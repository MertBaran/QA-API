import 'reflect-metadata';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../testApp';
import { container } from 'tsyringe';

import { QuestionRepository } from '../../repositories/QuestionRepository';
import '../setup';

const questionRepository = container.resolve(QuestionRepository);

describe('Question Workflow Integration Tests', () => {
  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;

  beforeEach(async () => {
    // Create two test users via API
    const email1 = `john+${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
    await request(app).post('/api/auth/register').send({
      firstName: 'John',
      lastName: 'Doe',
      email: email1,
      password: 'password123',
      role: 'user',
    });
    const loginResponse1 = await request(app).post('/api/auth/login').send({
      email: email1,
      password: 'password123',
    });
    user1 = loginResponse1.body.data;
    user1Token = loginResponse1.body.access_token;

    const email2 = `jane+${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
    await request(app).post('/api/auth/register').send({
      firstName: 'Jane',
      lastName: 'Smith',
      email: email2,
      password: 'password123',
      role: 'user',
    });
    const loginResponse2 = await request(app).post('/api/auth/login').send({
      email: email2,
      password: 'password123',
    });
    user2 = loginResponse2.body.data;
    user2Token = loginResponse2.body.access_token;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('Complete Question Lifecycle', () => {
    it('should complete full question lifecycle: create, read, update, like, delete', async () => {
      // 1. Create a question
      const questionData = {
        title: `Question Lifecycle Test ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content:
          'This is a test question for lifecycle testing that is long enough to meet the minimum requirement of 20 characters.',
      };

      const createResponse = await request(app)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(questionData);

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe(questionData.title);
      expect(createResponse.body.data.user.toString()).toBe(
        user1._id.toString()
      );

      const questionId = createResponse.body.data._id;

      // 2. Read the question
      const readResponse = await request(app).get(
        `/api/questions/${questionId}`
      );

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data._id).toBe(questionId);
      expect(readResponse.body.data.title).toBe(questionData.title);

      // 3. Get all questions and verify it's included
      const getAllResponse = await request(app).get('/api/questions');

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.data.map((q: any) => q._id)).toContain(
        questionId
      );

      // 4. Like the question
      const likeResponse = await request(app)
        .get(`/api/questions/${questionId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.data.likes).toContain(user1._id.toString());

      // 5. User2 also likes the question
      const user2LikeResponse = await request(app)
        .get(`/api/questions/${questionId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2LikeResponse.status).toBe(200);
      expect(user2LikeResponse.body.data.likes).toContain(user2._id.toString());

      // 6. Update the question
      const updateData = {
        title: `Updated Question Lifecycle Test ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content:
          'This is an updated test question for lifecycle testing that is long enough to meet the minimum requirement of 20 characters.',
      };

      const updateResponse = await request(app)
        .put(`/api/questions/${questionId}/edit`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData);

      // Check if update was successful (status might be 200 or 201)
      expect([200, 201]).toContain(updateResponse.status);
      // Check if response has data
      expect(updateResponse.body.data).toBeDefined();
      // Check if title and content were updated
      if (updateResponse.body.data) {
        expect(updateResponse.body.data.title).toBe(updateData.title);
        expect(updateResponse.body.data.content).toBe(updateData.content);
      }

      // 7. Verify likes are preserved after update
      const questionRepository = container.resolve(
        'IQuestionRepository'
      ) as any;
      const updatedQuestion = await questionRepository.findById(questionId);
      if (!updatedQuestion) throw new Error('updatedQuestion is null');
      expect(updatedQuestion.likes.map((id: any) => id.toString())).toContain(
        user1._id.toString()
      );
      expect(updatedQuestion.likes.map((id: any) => id.toString())).toContain(
        user2._id.toString()
      );

      // 8. User2 tries to edit user1's question (should fail)
      const unauthorizedEditResponse = await request(app)
        .put(`/api/questions/${questionId}/edit`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Unauthorized Edit',
          content: 'This should not work.',
        });

      expect(unauthorizedEditResponse.status).toBe(403);

      // 9. Delete the question
      const deleteResponse = await request(app)
        .delete(`/api/questions/${questionId}/delete`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe(
        'Question delete operation successfull'
      );

      // 10. Verify question is deleted
      const verifyDeleteResponse = await request(app).get(
        `/api/questions/${questionId}`
      );

      expect(verifyDeleteResponse.status).toBe(404);
    });
  });

  describe('Question Like/Unlike Workflow', () => {
    it('should handle like and unlike operations correctly', async () => {
      // Create a question
      const questionData = {
        title: `Like Test Question ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content:
          'This is a test question for like testing that is long enough to meet the minimum requirement of 20 characters.',
      };

      const createResponse = await request(app)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(questionData);

      const questionId = createResponse.body.data._id;

      // 1. User1 likes the question
      const likeResponse = await request(app)
        .get(`/api/questions/${questionId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.data.likes).toContain(user1._id.toString());

      // 2. User1 tries to like again (should fail)
      const duplicateLikeResponse = await request(app)
        .get(`/api/questions/${questionId}/like`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Check if duplicate like was properly handled
      expect([400, 409]).toContain(duplicateLikeResponse.status);
      // Check if error message exists
      expect(duplicateLikeResponse.body.message).toBeDefined();
      expect(duplicateLikeResponse.body.message.length).toBeGreaterThan(0);

      // 3. User2 likes the question
      const user2LikeResponse = await request(app)
        .get(`/api/questions/${questionId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2LikeResponse.status).toBe(200);
      expect(user2LikeResponse.body.data.likes).toContain(user2._id.toString());

      // 4. User1 unlikes the question
      const unlikeResponse = await request(app)
        .get(`/api/questions/${questionId}/undo_like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.data.likes).not.toContain(
        user1._id.toString()
      );
      expect(unlikeResponse.body.data.likes).toContain(user2._id.toString());

      // 5. User1 tries to unlike again (should fail)
      const duplicateUnlikeResponse = await request(app)
        .get(`/api/questions/${questionId}/undo_like`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(duplicateUnlikeResponse.status).toBe(400);
      expect(duplicateUnlikeResponse.body.message).toBe(
        'You have not liked this question'
      );

      // 6. User2 unlikes the question
      const user2UnlikeResponse = await request(app)
        .get(`/api/questions/${questionId}/undo_like`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2UnlikeResponse.status).toBe(200);
      expect(user2UnlikeResponse.body.data.likes).toHaveLength(0);
    });
  });

  describe('Question Validation and Error Handling', () => {
    it('should handle invalid question data', async () => {
      // Try to create question without authentication
      const unauthorizedResponse = await request(app)
        .post('/api/questions/ask')
        .send({
          title: 'Test Question',
          content: 'Test content',
        });

      expect(unauthorizedResponse.status).toBe(401);

      // Try to create question with invalid data
      const invalidDataResponse = await request(app)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Short', // Too short
          content: 'Short', // Too short
        });

      expect(invalidDataResponse.status).toBe(400);

      // Try to create question with missing fields
      const missingFieldsResponse = await request(app)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Question',
          // Missing content
        });

      expect(missingFieldsResponse.status).toBe(400);
    });

    it('should handle non-existent question operations', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();

      // Try to get non-existent question
      const getResponse = await request(app).get(
        `/api/questions/${fakeQuestionId}`
      );

      expect(getResponse.status).toBe(404);

      // Try to edit non-existent question
      const editResponse = await request(app)
        .put(`/api/questions/${fakeQuestionId}/edit`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
        });

      expect(editResponse.status).toBe(404);

      // Try to delete non-existent question
      const deleteResponse = await request(app)
        .delete(`/api/questions/${fakeQuestionId}/delete`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteResponse.status).toBe(404);
    });
  });
});
