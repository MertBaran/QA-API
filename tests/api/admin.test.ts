import "reflect-metadata";
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../APP';
import { container } from 'tsyringe';
import "../setup";
import { registerTestUser, loginTestUser } from '../utils/testUtils';
// import User from '../../models/User'; // Artık kullanılmıyor

// Remove all repository imports and instantiations

describe('Admin API Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let otherToken: string;

  beforeEach(async () => {
    // Create admin user via utility
    const { email: adminEmail, password: adminPassword } = await registerTestUser({ role: 'admin' });
    const adminLogin = await loginTestUser({ email: adminEmail, password: adminPassword });
    adminUser = adminLogin.user;
    adminToken = adminLogin.token;
    // Create regular user via utility
    const { email: regularEmail, password: regularPassword } = await registerTestUser();
    const regularLogin = await loginTestUser({ email: regularEmail, password: regularPassword });
    regularUser = regularLogin.user;
    otherToken = regularLogin.token;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('GET /api/admin/block/:id', () => {
    it('should block a user', async () => {
      const response = await request(app)
        .get(`/api/admin/block/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Block - Unblock Successfull');

      // Verify user is blocked via API
      const blockedUserResponse = await request(app)
        .get(`/api/users/${regularUser._id}`);
      expect(blockedUserResponse.status).toBe(200);
      expect(blockedUserResponse.body.data._id).toBeDefined();
      expect(regularUser._id).toBeDefined();
      const userId = blockedUserResponse.body.data._id && typeof blockedUserResponse.body.data._id === 'object' && blockedUserResponse.body.data._id._id ? blockedUserResponse.body.data._id._id : blockedUserResponse.body.data._id;
      expect(userId).toBeDefined();
      expect(userId.toString()).toBe(regularUser._id.toString());
      expect(blockedUserResponse.body.data.blocked).toBe(true);
    });

    it('should unblock a blocked user', async () => {
      // First block the user
      await request(app)
        .get(`/api/admin/block/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app)
        .get(`/api/admin/block/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Block - Unblock Successfull');

      // Verify user is unblocked via API
      const unblockedUserResponse = await request(app)
        .get(`/api/users/${regularUser._id}`);
      expect(unblockedUserResponse.status).toBe(200);
      expect(unblockedUserResponse.body.data._id).toBeDefined();
      expect(regularUser._id).toBeDefined();
      const userId2 = unblockedUserResponse.body.data._id && typeof unblockedUserResponse.body.data._id === 'object' && unblockedUserResponse.body.data._id._id ? unblockedUserResponse.body.data._id._id : unblockedUserResponse.body.data._id;
      expect(userId2).toBeDefined();
      expect(userId2.toString()).toBe(regularUser._id.toString());
      expect(unblockedUserResponse.body.data.blocked).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/admin/block/${regularUser._id}`);

      expect(response.status).toBe(401);
    });

    it('should require admin access', async () => {
      // Create another regular user
      const otherUser = await registerTestUser({ role: 'user' });
      const otherLogin = await loginTestUser({ email: otherUser.email, password: 'password123' });

      const response = await request(app)
        .get(`/api/admin/block/${regularUser._id}`)
        .set('Authorization', `Bearer ${otherLogin.token}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/admin/block/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/user/:id', () => {
    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/admin/user/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('delete operation successfull');

      // Verify user is deleted via API
      const deletedUserResponse = await request(app)
        .get(`/api/users/${regularUser._id}`);
      expect(deletedUserResponse.status).toBe(404);
      const deletedUserId = deletedUserResponse.body.data && deletedUserResponse.body.data._id && typeof deletedUserResponse.body.data._id === 'object' && deletedUserResponse.body.data._id._id ? deletedUserResponse.body.data._id._id : deletedUserResponse.body.data && deletedUserResponse.body.data._id;
      expect(deletedUserId && deletedUserId.toString()).not.toBe(regularUser._id.toString());
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/admin/user/${regularUser._id}`);

      expect(response.status).toBe(401);
    });

    it('should require admin access', async () => {
      // Create another regular user
      const otherUser = await registerTestUser({ role: 'user' });
      const otherLogin = await loginTestUser({ email: otherUser.email, password: 'password123' });

      const response = await request(app)
        .delete(`/api/admin/user/${regularUser._id}`)
        .set('Authorization', `Bearer ${otherLogin.token}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/admin/user/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 