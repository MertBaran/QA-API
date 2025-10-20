import request from 'supertest';
import app from '../../APP';
import { container } from 'tsyringe';
import { FakeUserDataSource } from '../mocks/datasources/FakeUserDataSource';
// AuthManager kullanılmıyor, kaldırıldı
import { QuestionManager } from '../../services/managers/QuestionManager';
import { AnswerManager } from '../../services/managers/AnswerManager';

import bcrypt from 'bcryptjs';

export async function registerTestUser({
  firstName = 'Test',
  lastName = 'User',
  email = `test+${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}@example.com`,
  password = 'password123',
  role = 'user',
}: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}> = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _role = role; // role parametresi kullanılmıyor ama interface'de gerekli
  try {
    // Use fake data source directly for tests
    const userDataSource =
      container.resolve<FakeUserDataSource>('UserDataSource');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userDataSource.create({
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      // roles field'ı artık UserRole tablosunda tutuluyor
      profile_image: '',
      blocked: false,
    });

    return { email, password, user };
  } catch (error) {
    console.error('registerTestUser error:', error);
    throw error;
  }
}

export async function loginTestUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    // First try to register the user if they don't exist
    try {
      await registerTestUser({ email, password });
    } catch (_error) {
      // User might already exist, continue with login
    }

    // Use API endpoint for login instead of direct service call
    const request = require('supertest');
    const app = require('../../APP').default;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password, captchaToken: 'test-captcha-token-12345' });

    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.body.message}`);
    }

    return {
      user: response.body.data,
      token: response.body.access_token,
    };
  } catch (error) {
    console.error('loginTestUser error:', error);
    throw error;
  }
}

export async function createTestQuestion({
  token,
  title = `Test Question ${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`,
  content = 'This is a test question content that is long enough to meet the minimum requirement.',
}: {
  token: string;
  title?: string;
  content?: string;
}) {
  try {
    // Extract user ID from JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      token,
      process.env['JWT_SECRET_KEY'] || 'test-secret-key'
    );
    const userId = decoded.id;
    if (!userId) {
      throw new Error('Invalid JWT token format');
    }

    // Use QuestionManager directly for tests
    const questionService =
      container.resolve<QuestionManager>('IQuestionService');
    const question = await questionService.createQuestion(
      {
        title,
        content,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
      },
      userId
    );

    return question;
  } catch (error) {
    console.error('createTestQuestion error:', error);
    throw error;
  }
}

export async function createTestAnswer({
  token,
  questionId,
  content = 'This is a test answer content that is long enough.',
}: {
  token: string;
  questionId: string;
  content?: string;
}) {
  try {
    // Extract user ID from JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      token,
      process.env['JWT_SECRET_KEY'] || 'test-secret-key'
    );
    const userId = decoded.id;
    if (!userId) {
      throw new Error('Invalid JWT token format');
    }

    // Use AnswerManager directly for tests
    const answerService = container.resolve<AnswerManager>('IAnswerService');
    const answer = await answerService.createAnswer(
      { content },
      questionId,
      userId
    );

    return answer;
  } catch (error) {
    console.error('createTestAnswer error:', error);
    throw error;
  }
}

// Keep API test functions for integration tests
export async function registerTestUserAPI({
  firstName = 'Test',
  lastName = 'User',
  email = `test+${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}@example.com`,
  password = 'password123',
  role = 'user',
}: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}> = {}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ firstName, lastName, email, password, role });
  if (response.status !== 200) {
    console.error('Register failed:', response.body);
  }
  expect(response.status).toBe(200);
  return { email, password, user: response.body.data };
}

export async function loginTestUserAPI({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password, captchaToken: 'test-captcha-token-12345' });
  if (response.status !== 200) {
    console.error('Login failed:', response.body);
  }
  expect(response.status).toBe(200);
  expect(response.body.access_token).toBeDefined();
  return { user: response.body.data, token: response.body.access_token };
}

export async function createTestQuestionAPI({
  token,
  title = `Test Question ${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`,
  content = 'This is a test question content that is long enough to meet the minimum requirement.',
}: {
  token: string;
  title?: string;
  content?: string;
}) {
  const response = await request(app)
    .post('/api/questions/ask')
    .set('Authorization', `Bearer ${token}`)
    .send({ title, content });
  if (response.status !== 200) {
    console.error('Question creation failed:', response.body);
  }
  expect(response.status).toBe(200);
  expect(response.body.data).toBeDefined();
  return response.body.data;
}

export async function createTestAnswerAPI({
  token,
  questionId,
  content = 'This is a test answer content that is long enough.',
}: {
  token: string;
  questionId: string;
  content?: string;
}) {
  const response = await request(app)
    .post(`/api/questions/${questionId}/answers`)
    .set('Authorization', `Bearer ${token}`)
    .send({ content });
  if (response.status !== 200) {
    console.error('Answer creation failed:', response.body);
  }
  expect(response.status).toBe(200);
  expect(response.body.data).toBeDefined();
  return response.body.data;
}
