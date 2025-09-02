import 'reflect-metadata';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../APP';
import '../setup';
import {
  registerTestUserAPI,
  loginTestUserAPI,
  createTestQuestion,
} from '../utils/testUtils';

describe('Question API Tests', () => {
  let testUser: any;
  let authToken: string;
  let testQuestion: any;

  beforeEach(async () => {
    const { email, password } = await registerTestUserAPI();
    const login = await loginTestUserAPI({ email, password });
    testUser = login.user;
    authToken = login.token;
    testQuestion = await createTestQuestion({ token: authToken });
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('GET /api/questions', () => {
    it('should get all questions', async () => {
      const response = await request(app).get('/api/questions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.map((q: any) => q.title)).toContain(
        testQuestion.title
      );
    });
  });

  describe('POST /api/questions/ask', () => {
    it('should create new question', async () => {
      const questionData = {
        title: `New Test Question Title That Is Long Enough ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content:
          'This is a new test question content that is long enough to meet the minimum requirement of 20 characters.',
      };

      const response = await request(app)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(questionData.title);
      expect(response.body.data.content).toBe(questionData.content);
      // user alanı string mi obje mi kontrol et
      expect(response.body.data.user).toBeDefined();
      expect(testUser._id).toBeDefined();
      const userId =
        response.body.data.user &&
        typeof response.body.data.user === 'object' &&
        response.body.data.user._id
          ? response.body.data.user._id
          : response.body.data.user;
      expect(userId).toBeDefined();
      expect(userId.toString()).toBe(testUser._id.toString());
    });

    it('should require authentication', async () => {
      const questionData = {
        title: 'New Test Question',
        content: 'This is a new test question content.',
      };

      const response = await request(app)
        .post('/api/questions/ask')
        .send(questionData);

      expect(response.status).toBe(401);
    });

    it('should require title field', async () => {
      const response = await request(app)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content:
            'This is a test question content that is long enough to meet the minimum requirement of 20 characters.',
        });

      expect(response.status).toBe(400);
    });

    it('should require content field', async () => {
      const response = await request(app)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Question Title That Is Long Enough',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/questions/:id', () => {
    it('should get single question', async () => {
      const response = await request(app).get(
        `/api/questions/${testQuestion._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testQuestion._id.toString());
      expect(response.body.data.title).toBe(testQuestion.title);
      expect(response.body.data.content).toBe(testQuestion.content);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();

      const response = await request(app).get(
        `/api/questions/${fakeQuestionId}`
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/questions/:id/edit', () => {
    it('should edit question', async () => {
      const newTitle = `Updated Test Question Title That Is Long Enough ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newContent =
        'This is an updated test question content that is long enough to meet the minimum requirement of 20 characters.';

      const response = await request(app)
        .put(`/api/questions/${testQuestion._id}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: newTitle,
          content: newContent,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newTitle);
      expect(response.body.data.content).toBe(newContent);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/questions/${testQuestion._id}/edit`)
        .send({
          title: 'Updated Title That Is Long Enough',
          content:
            'Updated content that is long enough to meet the minimum requirement of 20 characters.',
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/questions/${fakeQuestionId}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title That Is Long Enough',
          content:
            'Updated content that is long enough to meet the minimum requirement of 20 characters.',
        });

      expect(response.status).toBe(404);
    });

    it('should require owner access', async () => {
      // Create another user
      const otherUser = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Other User',
          lastName: 'User',
          email: `other+${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
          password: 'password123',
          role: 'user',
        });
      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: otherUser.body.data.email,
          password: 'password123',
          captchaToken: 'test-captcha-token-12345',
        });

      const otherAuthToken = otherLoginResponse.body.access_token;

      const response = await request(app)
        .put(`/api/questions/${testQuestion._id}/edit`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({
          title: 'Updated Title That Is Long Enough',
          content:
            'Updated content that is long enough to meet the minimum requirement of 20 characters.',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/questions/:id/delete', () => {
    it('should delete question', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion._id}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Question delete operation successful');

      // Verify question is deleted via API
      const deletedQuestionResponse = await request(app).get(
        `/api/questions/${testQuestion._id}`
      );
      expect(deletedQuestionResponse.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app).delete(
        `/api/questions/${testQuestion._id}/delete`
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/questions/${fakeQuestionId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require owner access', async () => {
      // Create another user
      const otherUser = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Other User',
          lastName: 'User',
          email: `other+${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
          password: 'password123',
          role: 'user',
        });
      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: otherUser.body.data.email,
          password: 'password123',
          captchaToken: 'test-captcha-token-12345',
        });

      const otherAuthToken = otherLoginResponse.body.access_token;

      const response = await request(app)
        .delete(`/api/questions/${testQuestion._id}/delete`)
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/questions/:id/like', () => {
    it('should like a question', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.likes).toBeDefined();
      if (Array.isArray(response.body.data.likes)) {
        response.body.data.likes.forEach((id: any) => expect(id).toBeDefined());
        const likeIds = response.body.data.likes
          .filter(Boolean)
          .map((id: any) =>
            id && id._id
              ? id._id.toString()
              : id && id.toString
                ? id.toString()
                : id
          );
        expect(likeIds).toContain(testUser._id.toString());
      }
    });

    it('should require authentication', async () => {
      const response = await request(app).get(
        `/api/questions/${testQuestion._id}/like`
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/questions/${fakeQuestionId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should not allow liking same question twice', async () => {
      // First like
      await request(app)
        .get(`/api/questions/${testQuestion._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second like attempt
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 500]).toContain(response.status);
      if (response.body && response.body.message) {
        expect(response.body.message).toBe('You already like this question');
      }
    });
  });

  describe('GET /api/questions/:id/undo_like', () => {
    beforeEach(async () => {
      // Like the question first
      await request(app)
        .get(`/api/questions/${testQuestion._id}/like`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should undo like a question', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.likes).toBeDefined();
        if (Array.isArray(response.body.data.likes)) {
          response.body.data.likes.forEach((id: any) =>
            expect(id).toBeDefined()
          );
          const likeIds = response.body.data.likes
            .filter(Boolean)
            .map((id: any) =>
              id && id._id
                ? id._id.toString()
                : id && id.toString
                  ? id.toString()
                  : id
            );
          expect(likeIds).not.toContain(testUser._id.toString());
        }
      } else {
        expect(response.body.message).toBe('You have not liked this question');
      }
    });

    it('should require authentication', async () => {
      const response = await request(app).get(
        `/api/questions/${testQuestion._id}/undo_like`
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/questions/${fakeQuestionId}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should not allow undoing like for question not liked', async () => {
      // Remove the like first
      await request(app)
        .get(`/api/questions/${testQuestion._id}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/questions/${testQuestion._id}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 500]).toContain(response.status);
      if (response.body && response.body.message) {
        expect(response.body.message).toBe('You have not liked this question');
      }
    });
  });
});
