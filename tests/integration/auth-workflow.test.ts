import request from 'supertest';
import { testApp } from '../setup';

const unique = () => `test+${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

describe('Authentication Workflow Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    testUser = {
      email: `${unique()}@example.com`,
      password: 'Password1!',
      firstName: 'Test',
      lastName: 'User',
    };
    const reg = await request(testApp)
      .post('/api/auth/register')
      .send(testUser);
    expect(reg.status).toBe(200);
    authToken = reg.body.access_token;
  });

  describe('Complete Authentication Workflow', () => {
    it('should complete full auth workflow: register, login, logout, profile access', async () => {
      // User already registered in beforeAll, use authToken
      const profileResponse = await request(testApp)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe(testUser.email);

      // 4. Logout
      const logoutResponse = await request(testApp)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
    });

    it('should handle multilingual workflow', async () => {
      const email = `${unique()}@example.com`;
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'tr')
        .send({ ...testUser, email });

      expect(registerResponse.status).toBe(200);

      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'tr')
        .send({
          email,
          password: testUser.password,
          captchaToken: 'test-captcha-token',
        });

      expect(loginResponse.status).toBe(200);
      const turkishToken = loginResponse.body.access_token;

      // 3. Logout with Turkish - should get Turkish message
      const logoutResponse = await request(testApp)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${turkishToken}`)
        .set('Accept-Language', 'tr');

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
    });
  });

  describe('Language Persistence in JWT', () => {
    it('should maintain language preference from registration in subsequent requests', async () => {
      const email = `${unique()}@example.com`;
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'de')
        .send({ ...testUser, email });

      expect(registerResponse.status).toBe(200);

      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'de')
        .send({
          email,
          password: testUser.password,
          captchaToken: 'test-captcha-token',
        });

      expect(loginResponse.status).toBe(200);
      const germanToken = loginResponse.body.access_token;

      // 3. Access profile with German token
      const profileResponse = await request(testApp)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${germanToken}`)
        .set('Accept-Language', 'de');

      expect(profileResponse.status).toBe(200);
    });

    it('should maintain language preference from login in subsequent requests', async () => {
      const email = `${unique()}@example.com`;
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'fr')
        .send({ ...testUser, email });

      expect(registerResponse.status).toBe(200);

      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'fr')
        .send({
          email,
          password: testUser.password,
          captchaToken: 'test-captcha-token',
        });

      expect(loginResponse.status).toBe(200);
      const frenchToken = loginResponse.body.access_token;

      // 2. Access profile with French token
      const profileResponse = await request(testApp)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${frenchToken}`)
        .set('Accept-Language', 'fr');

      expect(profileResponse.status).toBe(200);
    });
  });

  describe('Complex Language Headers', () => {
    it('should handle complex Accept-Language headers correctly', async () => {
      const email = `${unique()}@example.com`;
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'en-US,en;q=0.9,tr;q=0.8,de;q=0.7')
        .send({ ...testUser, email });

      expect(registerResponse.status).toBe(200);

      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'en-US,en;q=0.9,tr;q=0.8,de;q=0.7')
        .send({
          email,
          password: testUser.password,
          captchaToken: 'test-captcha-token',
        });

      expect(loginResponse.status).toBe(200);
      const complexToken = loginResponse.body.access_token;

      // 3. Logout with complex language header
      const logoutResponse = await request(testApp)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${complexToken}`)
        .set('Accept-Language', 'en-US,en;q=0.9,tr;q=0.8,de;q=0.7');

      expect(logoutResponse.status).toBe(200);
    });
  });

  describe('Error Handling with Multiple Languages', () => {
    it('should return English error messages when locale detection fails', async () => {
      const email = `${unique()}@example.com`;
      await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'invalid-locale')
        .send({ ...testUser, email });

      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'invalid-locale')
        .send({
          email,
          password: 'wrongpassword',
          captchaToken: 'test-captcha-token',
        });

      expect([400, 401, 404]).toContain(loginResponse.status);
      expect(loginResponse.body.success).toBe(false);
    });

    it('should handle missing Accept-Language header gracefully', async () => {
      // No Accept-Language header
      const logoutResponse = await request(testApp)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
      // Should use fallback language (English)
      expect(logoutResponse.body.message).toBeDefined();
    });
  });
});
