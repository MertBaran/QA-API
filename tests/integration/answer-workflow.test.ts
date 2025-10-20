import request from 'supertest';
import { testApp } from '../setup';

describe('Answer Workflow Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let questionId: string;
  let answerId: string;

  beforeAll(async () => {
    // Test user oluştur
    testUser = {
      email: 'answer@example.com',
      password: 'password123',
      firstName: 'Answer',
      lastName: 'User',
      title: 'Developer',
      bio: 'Test bio',
      location: 'Test Location',
      website: 'https://test.com',
      github: 'answeruser',
      twitter: 'answeruser',
      linkedin: 'answeruser',
      avatar: 'https://test.com/avatar.jpg',
      profile_image: 'https://test.com/avatar.jpg',
      blocked: false,
    };

    // Register user
    const registerResponse = await request(testApp)
      .post('/api/auth/register')
      .send(testUser);

    expect(registerResponse.status).toBe(200);

    // Login user
    const loginResponse = await request(testApp).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
      captchaToken: 'test-captcha-token',
    });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.access_token;

    // Create a question for testing answers
    const questionData = {
      title: 'Test Question for Answers',
      content: 'This question is for testing answer functionality',
      tags: ['test', 'answer'],
      category: 'general',
      isPublic: true,
    };

    const questionResponse = await request(testApp)
      .post('/api/questions/ask')
      .set('Authorization', `Bearer ${authToken}`)
      .send(questionData);

    expect(questionResponse.status).toBe(200);
    questionId = questionResponse.body.data._id;
  });

  afterAll(async () => {
    // Clean up - delete the test question
    if (questionId) {
      await request(testApp)
        .delete(`/api/questions/${questionId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  describe('Complete Answer Lifecycle', () => {
    it('should complete full answer lifecycle: create, read, update, like, delete', async () => {
      // 1. Create Answer
      const answerData = {
        content: 'This is a test answer content',
        isPublic: true,
      };

      const createResponse = await request(testApp)
        .post(`/api/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(answerData);

      console.log('Answer Create Response:', {
        status: createResponse.status,
        body: createResponse.body,
        data: createResponse.body.data,
        answerId: createResponse.body.data._id,
        questionId: createResponse.body.data.question,
        allFields: Object.keys(createResponse.body.data),
      });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.content).toBe(answerData.content);
      expect(createResponse.body.data.question).toBe(questionId);

      answerId = createResponse.body.data._id;

      // 2. Read Answer
      const getResponse = await request(testApp)
        .get(`/api/questions/${questionId}/answers/${answerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Answer Read Response:', {
        status: getResponse.status,
        body: getResponse.body,
        endpoint: `/api/questions/${questionId}/answers/${answerId}`,
        questionId,
        answerId,
        questionIdType: typeof questionId,
        answerIdType: typeof answerId,
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.content).toBe(answerData.content);

      // 3. Update Answer
      const updateData = {
        content: 'This is an updated answer content',
      };

      const updateResponse = await request(testApp)
        .put(`/api/questions/${questionId}/answers/${answerId}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.content).toBe(updateData.content);

      // 4. Like Answer
      const likeResponse = await request(testApp)
        .get(`/api/questions/${questionId}/answers/${answerId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.success).toBe(true);

      // 5. Unlike Answer
      const unlikeResponse = await request(testApp)
        .get(`/api/questions/${questionId}/answers/${answerId}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.success).toBe(true);

      // 6. Delete Answer
      const deleteResponse = await request(testApp)
        .delete(`/api/questions/${questionId}/answers/${answerId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Multi-User Answer Interactions', () => {
    it('should handle multiple users answering the same question', async () => {
      // Create multiple answers to the same question
      const answers = [
        { content: 'First answer to the question' },
        { content: 'Second answer to the question' },
        { content: 'Third answer to the question' },
      ];

      const createdAnswers = [];

      for (const answerData of answers) {
        const response = await request(testApp)
          .post(`/api/questions/${questionId}/answers`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(answerData);

        expect(response.status).toBe(200);
        createdAnswers.push(response.body.data);
      }

      // Get all answers for the question
      const getAllResponse = await request(testApp).get(
        `/api/questions/${questionId}/answers`
      );

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.success).toBe(true);
      expect(getAllResponse.body.data.length).toBeGreaterThanOrEqual(
        answers.length
      );

      // Clean up - delete created answers
      for (const answer of createdAnswers) {
        await request(testApp)
          .delete(`/api/questions/${questionId}/answers/${answer._id}/delete`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    });
  });

  describe('Answer Like/Unlike Workflow', () => {
    it('should handle like and unlike operations correctly', async () => {
      // 1. Create an answer for testing likes
      const answerData = {
        content: 'Answer for testing likes',
        isPublic: true,
      };

      const createResponse = await request(testApp)
        .post(`/api/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(answerData);

      expect(createResponse.status).toBe(200);
      const likeAnswerId = createResponse.body.data._id;

      // 2. Like the answer
      const likeResponse = await request(testApp)
        .get(`/api/questions/${questionId}/answers/${likeAnswerId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.success).toBe(true);

      // 3. Unlike the answer
      const unlikeResponse = await request(testApp)
        .get(`/api/questions/${questionId}/answers/${likeAnswerId}/undo_like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.success).toBe(true);

      // 4. Clean up - delete the answer
      await request(testApp)
        .delete(`/api/questions/${questionId}/answers/${likeAnswerId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Answer Validation and Error Handling', () => {
    it('should handle invalid answer data', async () => {
      // Try to create answer with invalid data
      const invalidData = {
        content: '', // Empty content
      };

      const invalidDataResponse = await request(testApp)
        .post(`/api/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(invalidDataResponse.status).toBe(400);

      // Try to create answer with missing fields
      const missingFieldsResponse = await request(testApp)
        .post(`/api/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(missingFieldsResponse.status).toBe(400);
    });

    it('should handle non-existent answer operations', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      // Try to get non-existent answer
      const getResponse = await request(testApp).get(
        `/api/questions/${questionId}/answers/${nonExistentId}`
      );

      expect(getResponse.status).toBe(404);

      // Try to edit non-existent answer
      const editResponse = await request(testApp)
        .put(`/api/questions/${questionId}/answers/${nonExistentId}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content',
        });

      expect(editResponse.status).toBe(404);

      // Try to delete non-existent answer
      const deleteResponse = await request(testApp)
        .delete(`/api/questions/${questionId}/answers/${nonExistentId}/delete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('Answer List and Retrieval', () => {
    it('should get all answers for a question successfully', async () => {
      // Create a few answers first
      const answers = [
        { content: 'Answer content 1' },
        { content: 'Answer content 2' },
        { content: 'Answer content 3' },
      ];

      const createdAnswerIds = [];

      for (const answerData of answers) {
        const createResponse = await request(testApp)
          .post(`/api/questions/${questionId}/answers`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(answerData);

        console.log('Test Answer Create Response:', {
          status: createResponse.status,
          body: createResponse.body,
          data: createResponse.body.data,
          hasData: !!createResponse.body.data,
          dataType: typeof createResponse.body.data,
        });

        createdAnswerIds.push(createResponse.body.data._id);

        // Hemen database'den kontrol edelim
        const dbCheckResponse = await request(testApp)
          .get(
            `/api/questions/${questionId}/answers/${createResponse.body.data._id}`
          )
          .set('Authorization', `Bearer ${authToken}`);

        console.log('Answer Create Response:', {
          status: createResponse.status,
          _id: createResponse.body.data._id,
          question: createResponse.body.data.question,
        });

        console.log('DB Check Response:', {
          status: dbCheckResponse.status,
          body: dbCheckResponse.body,
        });
      }

      // HEMEN list yapalım (arada hiçbir işlem yok)
      const response = await request(testApp)
        .get(`/api/questions/${questionId}/answers`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Answer List Response:', {
        status: response.status,
        body: response.body,
        dataLength: response.body.data?.length,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(answers.length);

      // Clean up
      for (const answer of response.body.data) {
        await request(testApp)
          .delete(`/api/questions/${questionId}/answers/${answer._id}/delete`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    });
  });
});
