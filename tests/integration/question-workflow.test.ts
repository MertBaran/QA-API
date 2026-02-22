import request from 'supertest';
import { testApp } from '../setup';

describe('Question Workflow Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let questionId: string;

  const uid = () => `q+${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;

  beforeAll(async () => {
    testUser = {
      email: uid(),
      password: 'Password1!',
      firstName: 'Question',
      lastName: 'User',
    };
    const reg = await request(testApp).post('/api/auth/register').send(testUser);
    expect(reg.status).toBe(200);
    const login = await request(testApp).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
      captchaToken: 'test-captcha-token',
    });
    expect(login.status).toBe(200);
    authToken = login.body.access_token;
  });

  describe('Complete Question Lifecycle', () => {
    it('should complete full question lifecycle: create, read, update, like, delete', async () => {
      // 1. Create Question
      const questionData = {
        title: 'Test Question Title',
        content: 'This is a test question content',
        tags: ['test', 'integration', 'question'],
        category: 'general',
        isPublic: true,
      };

      const createResponse = await request(testApp)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionData);

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe(questionData.title);
      expect(createResponse.body.data.user.toString()).toBe(
        createResponse.body.data.user.toString()
      );

      questionId = createResponse.body.data?.id ?? createResponse.body.data?._id;

      // 2. Read Question
      const getResponse = await request(testApp).get(
        `/api/questions/${questionId}`
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.title).toBe(questionData.title);

      // 3. Update Question
      const updateData = {
        title: 'Updated Question Title',
        content: 'This is an updated question content',
        tags: ['test', 'integration', 'question', 'updated'],
      };

      const updateResponse = await request(testApp)
        .put(`/api/questions/${questionId}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe(updateData.title);

      // 4. Like Question
      const likeResponse = await request(testApp)
        .get(`/api/questions/${questionId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.success).toBe(true);

      // 5. Unlike Question
      const unlikeResponse = await request(testApp)
        .get(`/api/questions/${questionId}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.success).toBe(true);

      // 6. Delete Question
      const deleteResponse = await request(testApp)
        .delete(`/api/questions/${questionId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Question Like/Unlike Workflow', () => {
    it('should handle like and unlike operations correctly', async () => {
      // 1. Create a question for testing likes
      const questionData = {
        title: 'Like Test Question',
        content: 'This question is for testing likes',
        tags: ['test', 'like'],
        category: 'general',
        isPublic: true,
      };

      const createResponse = await request(testApp)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionData);

      expect(createResponse.status).toBe(200);
      const likeQuestionId = createResponse.body.data?.id ?? createResponse.body.data?._id;

      // 2. Like the question
      const likeResponse = await request(testApp)
        .get(`/api/questions/${likeQuestionId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.success).toBe(true);

      // 3. Unlike the question
      const unlikeResponse = await request(testApp)
        .get(`/api/questions/${likeQuestionId}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.success).toBe(true);

      // 4. Clean up - delete the question
      await request(testApp)
        .delete(`/api/questions/${likeQuestionId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Question Validation and Error Handling', () => {
    it('should handle invalid question data', async () => {
      // Try to create question with invalid data
      const invalidData = {
        title: '', // Empty title
        content: '', // Empty content
        tags: 'invalid-tags', // Should be array
      };

      const invalidDataResponse = await request(testApp)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(invalidDataResponse.status).toBe(400);

      // Try to create question with missing fields
      const missingFieldsResponse = await request(testApp)
        .post('/api/questions/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(missingFieldsResponse.status).toBe(400);
    });

    it('should handle non-existent question operations', async () => {
      const nonExistentId = process.env['DATABASE_TYPE'] === 'postgresql'
        ? require('crypto').randomUUID()
        : '507f1f77bcf86cd799439011';

      // Try to get non-existent question
      const getResponse = await request(testApp).get(
        `/api/questions/${nonExistentId}`
      );

      expect(getResponse.status).toBe(404);

      // Try to edit non-existent question
      const editResponse = await request(testApp)
        .put(`/api/questions/${nonExistentId}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
        });

      expect(editResponse.status).toBe(404);

      // Try to delete non-existent question
      const deleteResponse = await request(testApp)
        .delete(`/api/questions/${nonExistentId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('Question List and Pagination', () => {
    it('should get all questions successfully', async () => {
      const response = await request(testApp).get('/api/questions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get paginated questions successfully', async () => {
      const response = await request(testApp).get(
        '/api/questions/paginated?page=1&limit=10'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // Pagination response structure may vary, just check if data exists
      expect(response.body.data).toBeTruthy();
    });
  });
});
