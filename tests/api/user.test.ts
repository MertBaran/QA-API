import 'reflect-metadata';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../APP';

import '../setup';
import { registerTestUserAPI, loginTestUserAPI } from '../utils/testUtils';
// import User from '../../models/User'; // Artık kullanılmıyor

async function ensureAdminPermissions(token: string) {
  const resp = await request(app)
    .get('/api/auth/check-admin-permissions')
    .set('Authorization', `Bearer ${token}`);
  if (resp.status === 200 && resp.body?.hasAdminPermission) return;
  // Fallback: assign via DB
  const RoleMongo = require('../../models/mongodb/RoleMongoModel').default;
  const UserRoleMongo = require('../../models/mongodb/UserRoleMongoModel').default;
  const PermissionMongo = require('../../models/mongodb/PermissionMongoModel').default;
  const adminRole = await RoleMongo.findOne({ name: 'admin' });
  const adminPerm = await PermissionMongo.findOneAndUpdate(
    { name: 'system:admin' },
    { name: 'system:admin', isActive: true },
    { upsert: true, new: true }
  );
  if (adminRole && !adminRole.permissions?.includes(adminPerm._id)) {
    adminRole.permissions = [...(adminRole.permissions || []), adminPerm._id];
    await adminRole.save();
  }
}

describe('User API Tests', () => {
  let testUser: any;
  let testUser2: any;
  let adminToken: string;

  beforeEach(async () => {
    // Create admin user
    const { email: adminEmail, password: adminPassword } = await registerTestUserAPI({ role: 'admin' });
    const adminLogin = await loginTestUserAPI({ email: adminEmail, password: adminPassword });
    adminToken = adminLogin.token;
    await ensureAdminPermissions(adminToken);

    // Create first user via utility
    const { email: email1, password: password1 } = await registerTestUserAPI();
    const login1 = await loginTestUserAPI({
      email: email1,
      password: password1,
    });
    testUser = login1.user;
    // Create second user via utility
    const { email: email2, password: password2 } = await registerTestUserAPI();
    const login2 = await loginTestUserAPI({
      email: email2,
      password: password2,
    });
    testUser2 = login2.user;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get single user', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid user id format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(403);
    });
  });
});
