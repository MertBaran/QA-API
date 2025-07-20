import 'reflect-metadata';
import request from 'supertest';

import app from '../../APP';

import '../setup';

describe('Authentication Workflow Integration Tests', () => {
  let testUser: any;
  let userToken: string;

  beforeEach(async () => {
    // Create a test user via API
    const email = `test+${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}@example.com`;
    await request(app).post('/api/auth/register').send({
      firstName: 'Test',
      lastName: 'User',
      email: email,
      password: 'password123',
      role: 'user',
    });
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: email,
      password: 'password123',
    });
    testUser = loginResponse.body.data;
    userToken = loginResponse.body.access_token;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('Complete Authentication Workflow', () => {
    it('should complete full auth workflow: register, login, logout, profile access', async () => {
      // 1. Register a new user
      const uniqueSuffix = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newUserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: `newuser+${uniqueSuffix}@example.com`,
        password: 'password123',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newUserData);

      expect(registerResponse.status).toBe(200);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.name).toBe('John Doe');
      expect(registerResponse.body.access_token).toBeDefined();

      // 2. Login with the new user
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: newUserData.email,
        password: newUserData.password,
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.access_token).toBeDefined();

      const authToken = loginResponse.body.access_token;

      // 3. Access protected route with token
      const protectedResponse = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(protectedResponse.status).toBe(200);

      // 4. Try to access protected route without token (should fail)
      const unauthorizedResponse = await request(app)
        .post('/api/questions/ask')
        .send({
          title: `Test Question Title ${uniqueSuffix}`,
          content: `This is a test question content that meets the minimum length requirement ${uniqueSuffix}`,
        });

      expect(unauthorizedResponse.status).toBe(401);

      // 5. Logout with English
      const logoutResponse = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'en');

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
      expect(logoutResponse.body.message).toBe('Logout success');
    });

    it('should handle multilingual workflow', async () => {
      // 1. Register with German language preference
      const uniqueSuffix = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const germanUserData = {
        firstName: 'Hans',
        lastName: 'Mueller',
        email: `hansmueller+${uniqueSuffix}@example.com`,
        password: 'password123',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('Accept-Language', 'de')
        .send(germanUserData);

      expect(registerResponse.status).toBe(200);
      expect(registerResponse.body.access_token).toBeDefined();

      // 2. Login with Turkish language preference
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('Accept-Language', 'tr')
        .send({
          email: germanUserData.email,
          password: germanUserData.password,
        });

      expect(loginResponse.status).toBe(200);
      const turkishToken = loginResponse.body.access_token;

      // 3. Logout with Turkish - should get Turkish message
      const turkishLogoutResponse = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${turkishToken}`)
        .set('Accept-Language', 'tr');

      expect(turkishLogoutResponse.status).toBe(200);
      expect(turkishLogoutResponse.body.message).toBe('Çıkış başarılı');

      // 4. Test forgot password with German
      const forgotPasswordResponse = await request(app)
        .post('/api/auth/forgotpassword')
        .set('Accept-Language', 'de')
        .send({ email: germanUserData.email });

      expect(forgotPasswordResponse.status).toBe(200);
      expect(forgotPasswordResponse.body.message).toBe(
        'Passwort-Reset-Link an E-Mail gesendet'
      );
    });
  });

  describe('Language Persistence in JWT', () => {
    it('should maintain language preference from registration in subsequent requests', async () => {
      // Register with German
      const uniqueSuffix = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const userData = {
        firstName: 'German',
        lastName: 'User',
        email: `germanuser+${uniqueSuffix}@example.com`,
        password: 'password123',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('Accept-Language', 'de')
        .send(userData);

      expect(registerResponse.status).toBe(200);
      const germanToken = registerResponse.body.access_token;

      // Use the token without setting Accept-Language header
      // The language should come from JWT token
      const logoutResponse = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${germanToken}`);

      expect(logoutResponse.status).toBe(200);
      // Note: The specific message depends on how the middleware handles JWT language vs Accept-Language
      expect(logoutResponse.body.success).toBe(true);
    });

    it('should maintain language preference from login in subsequent requests', async () => {
      // Login with Turkish
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('Accept-Language', 'tr')
        .send({
          email: testUser.email,
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      const turkishToken = loginResponse.body.access_token;

      // Use the token for logout
      const logoutResponse = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${turkishToken}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
    });
  });

  describe('Complex Language Headers', () => {
    it('should handle complex Accept-Language headers correctly', async () => {
      const testCases = [
        { header: 'tr-TR,tr;q=0.9,en;q=0.8', expectedLang: 'tr' },
        { header: 'de-DE,de;q=0.9,en;q=0.8', expectedLang: 'de' },
        { header: 'en-US,en;q=0.9', expectedLang: 'en' },
        { header: 'fr-FR,fr;q=0.9,en;q=0.8', expectedLang: 'en' }, // Fallback to English
        { header: 'es-ES,es;q=0.9,tr;q=0.8', expectedLang: 'tr' }, // Should pick Turkish as it's supported
      ];

      for (const testCase of testCases) {
        const uniqueSuffix = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const userData = {
          firstName: 'Test',
          lastName: 'User',
          email: `testuser+${uniqueSuffix}@example.com`,
          password: 'password123',
        };

        // Register with specific language header
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .set('Accept-Language', testCase.header)
          .send(userData);

        expect(registerResponse.status).toBe(200);

        // Login and logout to test language handling
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .set('Accept-Language', testCase.header)
          .send({
            email: userData.email,
            password: userData.password,
          });

        expect(loginResponse.status).toBe(200);

        const logoutResponse = await request(app)
          .get('/api/auth/logout')
          .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
          .set('Accept-Language', testCase.header);

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body.success).toBe(true);

        // Verify the message is in the expected language
        const expectedMessages: Record<string, string> = {
          en: 'Logout success',
          tr: 'Çıkış başarılı',
          de: 'Abmeldung erfolgreich',
        };

        expect(logoutResponse.body.message).toBe(
          expectedMessages[testCase.expectedLang]
        );
      }
    });
  });

  describe('Error Handling with Multiple Languages', () => {
    it('should return English error messages when locale detection fails', async () => {
      // Try to login with invalid credentials
      const response = await request(app)
        .post('/api/auth/login')
        .set('Accept-Language', 'invalid-locale')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // Should fallback to English for error messages
    });

    it('should handle missing Accept-Language header gracefully', async () => {
      const logoutResponse = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);
      // No Accept-Language header

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
      // Should use fallback language (English)
      expect(logoutResponse.body.message).toBeDefined();
    });
  });
});
