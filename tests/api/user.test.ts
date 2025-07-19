import "reflect-metadata";
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../APP';
import { container } from 'tsyringe';
import "../setup";
import { registerTestUser, loginTestUser } from '../utils/testUtils';
// import User from '../../models/User'; // Artık kullanılmıyor


describe('User API Tests', () => {
  let testUser: any;
  let testUser2: any;
  let userToken: string;
  let user2Token: string;

  beforeEach(async () => {
    // Create first user via utility
    const { email: email1, password: password1 } = await registerTestUser();
    const login1 = await loginTestUser({ email: email1, password: password1 });
    testUser = login1.user;
    userToken = login1.token;
    // Create second user via utility
    const { email: email2, password: password2 } = await registerTestUser();
    const login2 = await loginTestUser({ email: email2, password: password2 });
    testUser2 = login2.user;
    user2Token = login2.token;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Check if our test users are in the response
      const userNames = response.body.data.map((user: any) => user.name);
      expect(userNames).toContain(testUser.name);
      expect(userNames).toContain(testUser2.name);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get single user', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.email).toBe(testUser.email);
      // Password should not be included in response
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/users/${fakeUserId}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid user id format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id');

      expect(response.status).toBe(400);
    });
  });
}); 