import 'reflect-metadata';
import request from 'supertest';
// mongoose kullanılmıyor, kaldırıldı
import app from '../testApp';
import { container } from 'tsyringe';

import { QuestionRepository } from '../../repositories/QuestionRepository';
import { AnswerRepository } from '../../repositories/AnswerRepository';
import '../setup';
import { registerTestUser, createTestQuestion } from '../utils/testUtils';

const _questionRepository = container.resolve(QuestionRepository);
const _answerRepository = container.resolve(AnswerRepository);

describe('Answer Workflow Integration Tests', () => {
  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;
  let testQuestion: any;

  beforeAll(async () => {
    // Register and login test users
    user1 = await registerTestUser({
      firstName: 'Test',
      lastName: 'User 1',
      email: 'testuser1@example.com',
      password: 'testpass123',
    });
    user1Token = user1.token;

    user2 = await registerTestUser({
      firstName: 'Test',
      lastName: 'User 2',
      email: 'testuser2@example.com',
      password: 'testpass123',
    });
    user2Token = user2.token;

    // Create a test question
    testQuestion = await createTestQuestion({
      token: user1Token,
      title: 'Test Question for Answer Workflow',
      content: 'This is a test question content for answer workflow testing.',
    });
  });

  describe('Complete Answer Lifecycle', () => {
    it('should complete full answer lifecycle: create, read, update, like, delete', async () => {
      // 1. Create an answer
      const answerData = {
        content:
          'This is a test answer for lifecycle testing that is long enough to meet the minimum requirement of 10 characters.',
      };

      const createResponse = await request(app)
        .post(`/api/answers/${testQuestion._id}/answer`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(answerData);

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.content).toBe(answerData.content);
      expect(createResponse.body.data.user).toBeDefined();
      expect(user1._id).toBeDefined();
      const userId =
        createResponse.body.data.user &&
        typeof createResponse.body.data.user === 'object' &&
        createResponse.body.data.user._id
          ? createResponse.body.data.user._id
          : createResponse.body.data.user;
      expect(userId).toBeDefined();
      expect(userId.toString()).toBe(user1._id.toString());
      expect(createResponse.body.data.question).toBeDefined();
      expect(testQuestion._id).toBeDefined();
      const questionId =
        createResponse.body.data.question &&
        typeof createResponse.body.data.question === 'object' &&
        createResponse.body.data.question._id
          ? createResponse.body.data.question._id
          : createResponse.body.data.question;
      expect(questionId).toBeDefined();
      expect(questionId.toString()).toBe(testQuestion._id.toString());

      const answerId = createResponse.body.data._id;

      // 2. Read the answer
      const readResponse = await request(app).get(`/api/answers/${answerId}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data._id).toBe(answerId);
      expect(readResponse.body.data.content).toBe(answerData.content);
      expect(readResponse.body.data.user.name).toBe(user1.name);
      expect(readResponse.body.data.question.title).toBe(testQuestion.title);

      // 3. Get all answers for the question
      const getAllResponse = await request(app).get(
        `/api/answers/${testQuestion._id}/answers`
      );

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.data.length).toBeGreaterThan(0);
      expect(getAllResponse.body.data[0]._id).toBe(answerId);

      // 4. Like the answer
      const likeResponse = await request(app)
        .get(`/api/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(likeResponse.status).toBe(200);
      if (Array.isArray(likeResponse.body.data.likes)) {
        likeResponse.body.data.likes.forEach((id: any) =>
          expect(id).toBeDefined()
        );
        const likeIds = likeResponse.body.data.likes
          .filter(Boolean)
          .map((id: any) =>
            id && id._id
              ? id._id.toString()
              : id && id.toString
                ? id.toString()
                : id
          );
        expect(likeIds).toContain(user1._id.toString());
      }

      // 5. User2 also likes the answer
      const user2LikeResponse = await request(app)
        .get(`/api/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2LikeResponse.status).toBe(200);
      const user2LikeIds = (user2LikeResponse.body.data.likes || [])
        .filter(Boolean)
        .map((id: any) => {
          expect(id).toBeDefined();
          return id && id._id
            ? id._id.toString()
            : id && id.toString
              ? id.toString()
              : id;
        });
      expect(user2LikeIds).toContain(user2._id.toString());

      // 6. Update the answer
      const updateData = {
        content: 'Updated answer content for testing.',
      };

      const updateResponse = await request(app)
        .put(`/api/answers/${answerId}/edit`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.content).toBe(updateData.content);
      expect(updateResponse.body.data.old_content).toBe(answerData.content);

      // 7. Try to update with unauthorized user (should fail)
      const unauthorizedEditResponse = await request(app)
        .put(`/api/answers/${answerId}/edit`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateData);

      expect(unauthorizedEditResponse.status).toBe(403);

      // 8. Delete the answer
      const deleteResponse = await request(app)
        .delete(`/api/answers/${answerId}/delete`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // 9. Verify answer is deleted
      const deletedAnswerResponse = await request(app).get(
        `/api/answers/${answerId}`
      );

      expect(deletedAnswerResponse.status).toBe(404);
    });
  });

  describe('Multi-User Answer Interactions', () => {
    it('should handle multiple users answering the same question', async () => {
      // User1 answers the question
      const answer1Data = {
        content: 'First answer to the test question.',
      };

      const answer1Response = await request(app)
        .post(`/api/answers/${testQuestion._id}/answer`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(answer1Data);

      expect(answer1Response.status).toBe(200);
      const answer1Id = answer1Response.body.data._id;

      // User2 answers the same question
      const answer2Data = {
        content: 'Second answer to the test question.',
      };

      const answer2Response = await request(app)
        .post(`/api/answers/${testQuestion._id}/answer`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(answer2Data);

      expect(answer2Response.status).toBe(200);
      const answer2Id = answer2Response.body.data._id;

      // Verify both answers exist
      const getAllResponse = await request(app).get(
        `/api/answers/${testQuestion._id}/answers`
      );

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.data.length).toBeGreaterThanOrEqual(2);

      // User1 likes answer2
      const likeResponse = await request(app)
        .get(`/api/answers/${answer2Id}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(likeResponse.status).toBe(200);

      // User2 likes answer1
      const likeResponse2 = await request(app)
        .get(`/api/answers/${answer1Id}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(likeResponse2.status).toBe(200);

      // Verify likes are recorded
      const getAllResponse2 = await request(app).get(
        `/api/answers/${testQuestion._id}/answers`
      );

      expect(getAllResponse2.status).toBe(200);
      expect(getAllResponse2.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Answer Like/Unlike Workflow', () => {
    it('should handle like and unlike operations correctly', async () => {
      // 1. Create an answer
      const answerData = {
        content: 'Test answer for like/unlike workflow.',
      };

      const createResponse = await request(app)
        .post(`/api/answers/${testQuestion._id}/answer`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(answerData);

      const answerId = createResponse.body.data._id;

      // 1. User1 likes the answer
      const likeResponse = await request(app)
        .get(`/api/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.data.likes).toContain(user1._id.toString());

      // 2. User1 tries to like again (should fail)
      const duplicateLikeResponse = await request(app)
        .get(`/api/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect([400, 409]).toContain(duplicateLikeResponse.status);
      // Check if error message exists
      expect(duplicateLikeResponse.body.message).toBeDefined();
      expect(duplicateLikeResponse.body.message.length).toBeGreaterThan(0);

      // 3. User2 likes the answer
      const user2LikeResponse = await request(app)
        .get(`/api/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2LikeResponse.status).toBe(200);
      expect(user2LikeResponse.body.data.likes).toContain(user2._id.toString());

      // 4. User1 unlikes the answer
      const unlikeResponse = await request(app)
        .get(`/api/answers/${answerId}/undo_like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.data.likes).not.toContain(
        user1._id.toString()
      );

      // 5. User1 tries to unlike again (should fail)
      const duplicateUnlikeResponse = await request(app)
        .get(`/api/answers/${answerId}/undo_like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect([400, 409]).toContain(duplicateUnlikeResponse.status);

      // 6. User2 unlikes the answer
      const user2UnlikeResponse = await request(app)
        .get(`/api/answers/${answerId}/undo_like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2UnlikeResponse.status).toBe(200);
      expect(user2UnlikeResponse.body.data.likes).not.toContain(
        user2._id.toString()
      );
    });
  });

  describe('Answer Validation and Error Handling', () => {
    it('should handle invalid answer data', async () => {
      // Try to create answer without authentication
      const unauthorizedResponse = await request(app)
        .post(`/api/answers/${testQuestion._id}/answer`)
        .send({
          content: 'This should fail without auth.',
        });

      expect(unauthorizedResponse.status).toBe(401);

      // Try to create answer with invalid data
      const invalidDataResponse = await request(app)
        .post(`/api/answers/${testQuestion._id}/answer`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Too short', // Less than 10 characters
        });

      expect(invalidDataResponse.status).toBe(400);

      // Try to create answer with non-existent question
      const fakeQuestionId = '507f1f77bcf86cd799439011';
      const fakeQuestionResponse = await request(app)
        .post(`/api/answers/${fakeQuestionId}/answer`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'This should fail with non-existent question.',
        });

      expect(fakeQuestionResponse.status).toBe(404);

      // Try to access non-existent answer
      const fakeAnswerId = '507f1f77bcf86cd799439012';
      const fakeAnswerResponse = await request(app).get(
        `/api/answers/${fakeAnswerId}`
      );

      expect(fakeAnswerResponse.status).toBe(404);

      // Try to edit non-existent answer
      const fakeEditResponse = await request(app)
        .put(`/api/answers/${fakeAnswerId}/edit`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'This should fail.',
        });

      expect(fakeEditResponse.status).toBe(404);

      // Try to delete non-existent answer
      const fakeDeleteResponse = await request(app)
        .delete(`/api/answers/${fakeAnswerId}/delete`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(fakeDeleteResponse.status).toBe(404);
    });
  });
});
