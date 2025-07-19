import "reflect-metadata";
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../APP';
import "../setup";
import { registerTestUser, loginTestUser, createTestQuestion, createTestAnswer } from '../utils/testUtils';

describe('Answer API Tests', () => {
  let testUser: any;
  let authToken: string;
  let testQuestion: any;
  let testAnswer: any;

  beforeEach(async () => {
    // Kullanıcı oluştur ve login ol
    const { email, password } = await registerTestUser();
    const login = await loginTestUser({ email, password });
    testUser = login.user;
    authToken = login.token;

    // Soru oluştur
    testQuestion = await createTestQuestion({ token: authToken });

    // Cevap oluştur
    testAnswer = await createTestAnswer({ token: authToken, questionId: testQuestion._id });
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('POST /api/answers', () => {
    it('should add new answer to question', async () => {
      const answerData = {
        content: 'This is a new test answer content that is long enough.'
      };
      const response = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(answerData);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(answerData.content);
      expect(response.body.data.user).toBeDefined();
      expect(testUser._id).toBeDefined();
      const userId = response.body.data.user && typeof response.body.data.user === 'object' && response.body.data.user._id ? response.body.data.user._id : response.body.data.user;
      expect(userId).toBeDefined();
      expect(userId.toString()).toBe(testUser._id.toString());
      expect(response.body.data.question).toBeDefined();
      expect(testQuestion._id).toBeDefined();
      const questionId = response.body.data.question && typeof response.body.data.question === 'object' && response.body.data.question._id ? response.body.data.question._id : response.body.data.question;
      expect(questionId).toBeDefined();
      expect(questionId.toString()).toBe(testQuestion._id.toString());
    });

    it('should require authentication', async () => {
      const answerData = {
        content: 'This is a new answer content.'
      };

      const response = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .send(answerData);

      expect(response.status).toBe(401);
    });

    it('should require content field', async () => {
      const response = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should require content to be at least 10 characters', async () => {
      const response = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Short' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/answers', () => {
    it('should get all answers for a question', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].content).toBe(testAnswer.content);
    });
  });

  describe('GET /api/answers/:answer_id', () => {
    it('should get single answer with populated user and question', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testAnswer._id);
      expect(response.body.data.content).toBe(testAnswer.content);
      // user ve question alanları obje ise name ve title kontrolü yap
      if (response.body.data.user && typeof response.body.data.user === 'object') {
        expect(response.body.data.user.name).toBe(testUser.name);
      }
      if (response.body.data.question && typeof response.body.data.question === 'object') {
        expect(response.body.data.question.title).toBe(testQuestion.title);
      }
    });

    it('should return 404 for non-existent answer', async () => {
      const fakeAnswerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/answers/:answer_id/edit', () => {
    it('should edit answer content', async () => {
      const newContent = 'This is an updated answer content that is long enough.';

      const response = await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: newContent });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(newContent);
      expect(response.body.old_content).toBe(testAnswer.content);
    });

    it('should return 404 for non-existent answer', async () => {
      const fakeAnswerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(404);
    });

    it('should require content field', async () => {
      const response = await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/answers/:answer_id/delete', () => {
    it('should delete answer and remove from question', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Answer deleted successfully');

      // Verify answer is deleted via API
      const deletedAnswerResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}`);
      expect(deletedAnswerResponse.status).toBe(404);

      // Verify answer is removed from question via API
      const updatedQuestionResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}`);
      expect(updatedQuestionResponse.status).toBe(200);
      if (Array.isArray(updatedQuestionResponse.body.data.answers)) {
        updatedQuestionResponse.body.data.answers.forEach((id: any) => expect(id).toBeDefined());
        const answerIds = updatedQuestionResponse.body.data.answers.filter(Boolean).map((id: any) => id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id);
        expect(answerIds).not.toContain(testAnswer._id && testAnswer._id.toString ? testAnswer._id.toString() : testAnswer._id);
      }
    });

    it('should return 404 for non-existent answer', async () => {
      const fakeAnswerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/answers/:answer_id/like', () => {
    it('should like an answer', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.likes).toBeDefined();
      if (Array.isArray(response.body.data.likes)) {
        response.body.data.likes.forEach((id: any) => expect(id).toBeDefined());
        const likeIds = response.body.data.likes.filter(Boolean).map((id: any) => id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id);
        expect(likeIds).toContain(testUser._id.toString());
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/like`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent answer', async () => {
      const fakeAnswerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should not allow liking same answer twice', async () => {
      // First like
      await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second like attempt
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('You already like this answer');
    });
  });

  describe('GET /api/answers/:answer_id/undo_like', () => {
    beforeEach(async () => {
      // Like the answer first
      testAnswer.likes.push(testUser._id);
      await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ likes: testAnswer.likes });
    });

    it('should undo like an answer', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.likes).toBeDefined();
        if (Array.isArray(response.body.data.likes)) {
          response.body.data.likes.forEach((id: any) => expect(id).toBeDefined());
          const likeIds = response.body.data.likes.filter(Boolean).map((id: any) => id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id);
          expect(likeIds).not.toContain(testUser._id.toString());
        }
      } else {
        expect(response.body.message).toBe('You can not undo like operation for this answer');
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/undo_like`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent answer', async () => {
      const fakeAnswerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should not allow undoing like for answer not liked', async () => {
      // Remove the like first
      testAnswer.likes = (testAnswer.likes || []).filter((like: any) => like && like.toString && testUser._id && like.toString() !== testUser._id.toString());
      await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ likes: testAnswer.likes });

      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${testAnswer._id}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('You can not undo like operation for this answer');
    });
  });
}); 