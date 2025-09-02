import request from 'supertest';
import { testApp } from '../setup';

describe('Authentication Workflow Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Test user oluştur
    testUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      title: 'Developer',
      bio: 'Test bio',
      location: 'Test Location',
      website: 'https://test.com',
      github: 'testuser',
      twitter: 'testuser',
      linkedin: 'testuser',
      avatar: 'https://test.com/avatar.jpg',
      profile_image: 'https://test.com/avatar.jpg',
      blocked: false,
    };
  });

  describe('Complete Authentication Workflow', () => {
    it('should complete full auth workflow: register, login, logout, profile access', async () => {
      // 1. Register
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .send(testUser);

      expect(registerResponse.status).toBe(200);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.access_token).toBeDefined();
      expect(registerResponse.body.data.email).toBe(testUser.email);

      // Register already returns access token, use it directly
      authToken = registerResponse.body.access_token;

      // 3. Get Profile
      console.log('Token:', authToken);
      const profileResponse = await request(testApp)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Profile Response:', {
        status: profileResponse.status,
        body: profileResponse.body,
      });

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
      // 1. Register with Turkish
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'tr')
        .send({
          ...testUser,
          email: 'turkish@example.com',
        });

      expect(registerResponse.status).toBe(200);

      // 2. Login with Turkish
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'tr')
        .send({
          email: 'turkish@example.com',
          password: testUser.password,
          captchaToken: 'test-captcha-token',
        });

      console.log('Turkish Login Response:', {
        status: loginResponse.status,
        body: loginResponse.body,
        errors: loginResponse.body.errors,
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
      // 1. Register with German
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'de')
        .send({
          ...testUser,
          email: 'german@example.com',
        });

      expect(registerResponse.status).toBe(200);

      // 2. Login with German
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'de')
        .send({
          email: 'german@example.com',
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
      // 1. Register with French email first
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'fr')
        .send({
          ...testUser,
          email: 'french@example.com',
        });

      expect(registerResponse.status).toBe(200);

      // 2. Login with French
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'fr')
        .send({
          email: 'french@example.com',
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
      // 1. Register with complex language header
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'en-US,en;q=0.9,tr;q=0.8,de;q=0.7')
        .send({
          ...testUser,
          email: 'complex@example.com',
        });

      expect(registerResponse.status).toBe(200);

      // 2. Login with complex language header
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'en-US,en;q=0.9,tr;q=0.8,de;q=0.7')
        .send({
          email: 'complex@example.com',
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
      // 1. First create a user
      const registerResponse = await request(testApp)
        .post('/api/auth/register')
        .set('Accept-Language', 'invalid-locale')
        .send({
          ...testUser,
          email: 'invalid-locale@example.com',
        });

      expect(registerResponse.status).toBe(200);

      // 2. Try to login with wrong password
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .set('Accept-Language', 'invalid-locale')
        .send({
          email: 'invalid-locale@example.com',
          password: 'wrongpassword',
          captchaToken: 'test-captcha-token',
        });

      console.log('Invalid Locale Login Response:', {
        status: loginResponse.status,
        body: loginResponse.body,
        errors: loginResponse.body.errors,
      });

      expect(loginResponse.status).toBe(400);
      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.error).toBe('Invalid credentials');
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
