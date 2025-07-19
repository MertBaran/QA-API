import "reflect-metadata";
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../APP';
import { container } from 'tsyringe';
import { UserRepository } from '../../repositories/UserRepository';
import { QuestionRepository } from '../../repositories/QuestionRepository';
import { AnswerRepository } from '../../repositories/AnswerRepository';
import "../setup";

const userRepository = container.resolve(UserRepository);
const questionRepository = container.resolve(QuestionRepository);
const answerRepository = container.resolve(AnswerRepository);

describe('Answer Workflow Integration Tests', () => {
  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;
  let testQuestion: any;

  beforeEach(async () => {
    // Create two test users via API
    const email1 = `john+${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: email1,
        password: 'password123',
        role: 'user'
      });
    const loginResponse1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: email1,
        password: 'password123'
      });
    user1 = loginResponse1.body.data;
    user1Token = loginResponse1.body.access_token;

    const email2 = `jane+${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Smith',
        email: email2,
        password: 'password123',
        role: 'user'
      });
    const loginResponse2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: email2,
        password: 'password123'
      });
    user2 = loginResponse2.body.data;
    user2Token = loginResponse2.body.access_token;

    // Create a test question via API
    const questionData = {
      title: `Test Question for Answers ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: 'This is a test question for answer workflow testing that is long enough to meet the minimum requirement of 20 characters.'
    };
    const questionResponse = await request(app)
      .post('/api/questions/ask')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(questionData);
    testQuestion = questionResponse.body.data;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('Complete Answer Lifecycle', () => {
    it('should complete full answer lifecycle: create, read, update, like, delete', async () => {
      // 1. Create an answer
      const answerData = {
        content: 'This is a test answer for lifecycle testing that is long enough to meet the minimum requirement of 10 characters.'
      };

      const createResponse = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(answerData);

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.content).toBe(answerData.content);
      expect(createResponse.body.data.user).toBeDefined();
      expect(user1._id).toBeDefined();
      const userId = createResponse.body.data.user && typeof createResponse.body.data.user === 'object' && createResponse.body.data.user._id ? createResponse.body.data.user._id : createResponse.body.data.user;
      expect(userId).toBeDefined();
      expect(userId.toString()).toBe(user1._id.toString());
      expect(createResponse.body.data.question).toBeDefined();
      expect(testQuestion._id).toBeDefined();
      const questionId = createResponse.body.data.question && typeof createResponse.body.data.question === 'object' && createResponse.body.data.question._id ? createResponse.body.data.question._id : createResponse.body.data.question;
      expect(questionId).toBeDefined();
      expect(questionId.toString()).toBe(testQuestion._id.toString());

      const answerId = createResponse.body.data._id;

      // 2. Read the answer
      const readResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data._id).toBe(answerId);
      expect(readResponse.body.data.content).toBe(answerData.content);
      expect(readResponse.body.data.user.name).toBe(user1.name);
      expect(readResponse.body.data.question.title).toBe(testQuestion.title);

      // 3. Get all answers for the question
      const getAllResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers`);

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.data.length).toBeGreaterThan(0);
      expect(getAllResponse.body.data[0]._id).toBe(answerId);

      // 4. Like the answer
      const likeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(likeResponse.status).toBe(200);
      if (Array.isArray(likeResponse.body.data.likes)) {
        likeResponse.body.data.likes.forEach((id: any) => expect(id).toBeDefined());
        const likeIds = likeResponse.body.data.likes.filter(Boolean).map((id: any) => id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id);
        expect(likeIds).toContain(user1._id.toString());
      }

      // 5. User2 also likes the answer
      const user2LikeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2LikeResponse.status).toBe(200);
      const user2LikeIds = (user2LikeResponse.body.data.likes || []).filter(Boolean).map((id: any) => { expect(id).toBeDefined(); return id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id; });
      expect(user2LikeIds).toContain(user2._id.toString());

      // 6. Update the answer
      const updateData = {
        content: 'This is an updated test answer for lifecycle testing that is long enough to meet the minimum requirement of 10 characters.'
      };

      const updateResponse = await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${answerId}/edit`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.content).toBe(updateData.content);
      expect(updateResponse.body.old_content).toBe(answerData.content);

      // 7. Verify likes are preserved after update
      const updatedAnswer = await answerRepository.findById(answerId);
      if (!updatedAnswer) throw new Error('updatedAnswer is null');
      const updatedLikeIds = (updatedAnswer.likes || []).filter(Boolean).map((id: any) => { expect(id).toBeDefined(); return id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id; });
      expect(updatedLikeIds).toContain(user1._id.toString());
      expect(updatedLikeIds).toContain(user2._id.toString());

      // 8. User2 tries to edit user1's answer (should fail)
      const unauthorizedEditResponse = await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${answerId}/edit`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          content: 'Unauthorized Edit'
        });

      expect(unauthorizedEditResponse.status).toBe(403);

      // 9. Delete the answer
      const deleteResponse = await request(app)
        .delete(`/api/questions/${testQuestion._id}/answers/${answerId}/delete`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Answer deleted successfully');

      // 10. Verify answer is deleted
      const verifyDeleteResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}`);

      expect(verifyDeleteResponse.status).toBe(404);

      // 11. Verify answer is removed from question's answers array
      const updatedQuestion = await questionRepository.findById(testQuestion._id);
      if (!updatedQuestion) throw new Error('updatedQuestion is null');
      expect(updatedQuestion.answers).toHaveLength(0);
    });
  });

  describe('Multi-User Answer Interactions', () => {
    it('should handle multiple users answering the same question', async () => {
      // User1 answers the question
      const answer1Data = {
        content: 'This is the first answer from user1 that is long enough to meet the minimum requirement of 10 characters.'
      };

      const answer1Response = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(answer1Data);

      expect(answer1Response.status).toBe(200);
      const answer1Id = answer1Response.body.data._id;

      // User2 answers the same question
      const answer2Data = {
        content: 'This is the second answer from user2 that is long enough to meet the minimum requirement of 10 characters.'
      };

      const answer2Response = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(answer2Data);

      expect(answer2Response.status).toBe(200);
      const answer2Id = answer2Response.body.data._id;

      // Get all answers and verify both are there
      const getAllAnswersResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers`);

      expect(getAllAnswersResponse.status).toBe(200);
      expect(getAllAnswersResponse.body.data).toHaveLength(2);

      const answerIds = getAllAnswersResponse.body.data.map((a: any) => a._id);
      expect(answerIds).toContain(answer1Id);
      expect(answerIds).toContain(answer2Id);

      // User1 likes user2's answer
      const user1LikeUser2Answer = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answer2Id}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(user1LikeUser2Answer.status).toBe(200);
      expect(user1LikeUser2Answer.body.data.likes).toContain(user1._id.toString());

      // User2 likes user1's answer
      const user2LikeUser1Answer = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answer1Id}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2LikeUser1Answer.status).toBe(200);
      expect(user2LikeUser1Answer.body.data.likes).toContain(user2._id.toString());

      // Verify question has both answers in its answers array
      const getAllAnswersResponse2 = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers`);
      expect(getAllAnswersResponse2.status).toBe(200);
      expect(getAllAnswersResponse2.body.data).toHaveLength(2);
    });
  });

  describe('Answer Like/Unlike Workflow', () => {
    it('should handle like and unlike operations correctly', async () => {
      // Create an answer
      const answerData = {
        content: 'This is a test answer for like testing that is long enough to meet the minimum requirement of 10 characters.'
      };

      const createResponse = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(answerData);

      const answerId = createResponse.body.data._id;

      // 1. User1 likes the answer
      const likeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(likeResponse.status).toBe(200);
      if (Array.isArray(likeResponse.body.data.likes)) {
        likeResponse.body.data.likes.forEach((id: any) => expect(id).toBeDefined());
        const likeIds = likeResponse.body.data.likes.filter(Boolean).map((id: any) => id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id);
        expect(likeIds).toContain(user1._id.toString());
      }

      // 2. User1 tries to like again (should fail)
      const duplicateLikeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(duplicateLikeResponse.status).toBe(400);
      expect(duplicateLikeResponse.body.message).toBe('You already like this answer');

      // 3. User2 likes the answer
      const user2LikeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2LikeResponse.status).toBe(200);
      const user2LikeIds = (user2LikeResponse.body.data.likes || []).filter(Boolean).map((id: any) => { expect(id).toBeDefined(); return id && id._id ? id._id.toString() : id && id.toString ? id.toString() : id; });
      expect(user2LikeIds).toContain(user2._id.toString());

      // 4. User1 unlikes the answer
      const unlikeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/undo_like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.data.likes).not.toContain(user1._id.toString());
      expect(unlikeResponse.body.data.likes).toContain(user2._id.toString());

      // 5. User1 tries to unlike again (should fail)
      const duplicateUnlikeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/undo_like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(duplicateUnlikeResponse.status).toBe(400);
      expect(duplicateUnlikeResponse.body.message).toBe('You can not undo like operation for this answer');

      // 6. User2 unlikes the answer
      const user2UnlikeResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${answerId}/undo_like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2UnlikeResponse.status).toBe(200);
      expect(user2UnlikeResponse.body.data.likes).toHaveLength(0);
    });
  });

  describe('Answer Validation and Error Handling', () => {
    it('should handle invalid answer data', async () => {
      // Try to create answer without authentication
      const unauthorizedResponse = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .send({
          content: 'Test answer'
        });

      expect(unauthorizedResponse.status).toBe(401);

      // Try to create answer with invalid data
      const invalidDataResponse = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Short' // Too short
        });

      expect(invalidDataResponse.status).toBe(400);

      // Try to create answer with missing content
      const missingContentResponse = await request(app)
        .post(`/api/questions/${testQuestion._id}/answers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({});

      expect(missingContentResponse.status).toBe(400);
    });

    it('should handle non-existent answer operations', async () => {
      const fakeAnswerId = new mongoose.Types.ObjectId();

      // Try to get non-existent answer
      const getResponse = await request(app)
        .get(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}`);

      expect(getResponse.status).toBe(404);

      // Try to edit non-existent answer
      const editResponse = await request(app)
        .put(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}/edit`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Updated content'
        });

      expect(editResponse.status).toBe(404);

      // Try to delete non-existent answer
      const deleteResponse = await request(app)
        .delete(`/api/questions/${testQuestion._id}/answers/${fakeAnswerId}/delete`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteResponse.status).toBe(404);
    });
  });
}); 