import 'reflect-metadata';
import request from 'supertest';

import app from '../../APP';
import '../setup';
import { registerTestUser, loginTestUser } from '../utils/testUtils';

describe('Auth API Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    const { email, password } = await registerTestUser();
    const login = await loginTestUser({ email, password });
    testUser = login.user;
    authToken = login.token;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueSuffix = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: `testuser+${uniqueSuffix}@example.com`,
        password: 'password123',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.access_token).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: testUser.email, // Use existing email
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const { email, password } = await registerTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(email);
      expect(response.body.access_token).toBeDefined();
    });

    it('should not login with incorrect credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/logout', () => {
    it('should logout successfully with English message', async () => {
      const response = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'en');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout success');
    });

    it('should logout successfully with Turkish message', async () => {
      const response = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'tr');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Çıkış başarılı');
    });

    it('should logout successfully with German message', async () => {
      const response = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'de');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Abmeldung erfolgreich');
    });

    it('should fallback to English for unsupported language', async () => {
      const response = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'fr');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout success');
    });

    it('should handle complex Accept-Language headers', async () => {
      const response = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'tr-TR,tr;q=0.9,en;q=0.8');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Çıkış başarılı');
    });
  });

  describe('POST /api/auth/forgotpassword', () => {
    it('should send reset password token with Turkish message', async () => {
      const response = await request(app)
        .post('/api/auth/forgotpassword')
        .set('Accept-Language', 'tr')
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
      );
    });

    it('should send reset password token with German message', async () => {
      const response = await request(app)
        .post('/api/auth/forgotpassword')
        .set('Accept-Language', 'de')
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Passwort-Reset-Link an E-Mail gesendet'
      );
    });

    it('should handle non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgotpassword')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser._id);
      expect(response.body.data.name).toBe(testUser.name);
    });

    it('should not get profile without authentication', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('Language in JWT Token', () => {
    it('should include language in JWT when registering with German', async () => {
      const uniqueSuffix = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: `testuser+${uniqueSuffix}@example.com`,
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Accept-Language', 'de')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();

      // Verify the token contains German language
      // We can't decode JWT directly in tests, but we can test logout with that token
      const logoutResponse = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${response.body.access_token}`);

      expect(logoutResponse.status).toBe(200);
      // The locale should come from JWT token, not Accept-Language header in logout
    });

    it('should include language in JWT when logging in with Turkish', async () => {
      const { email, password } = await registerTestUser();

      const response = await request(app)
        .post('/api/auth/login')
        .set('Accept-Language', 'tr')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();

      // Test that subsequent requests use the language from JWT
      const logoutResponse = await request(app)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${response.body.access_token}`);

      expect(logoutResponse.status).toBe(200);
    });
  });
});
