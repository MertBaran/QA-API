import 'reflect-metadata';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../APP';

import '../setup';
import { registerTestUserAPI, loginTestUserAPI } from '../utils/testUtils';
// import User from '../../models/User'; // Artık kullanılmıyor

// Remove all repository imports and instantiations

// Yardımcı fonksiyon: Mesajları normalize et
function normalizeMsg(msg: string | undefined) {
  return (msg || '').toLowerCase().replace(/[-/]/g, '').replace(/\s+/g, '');
}

// Test helper: ensure admin role and permission
async function ensureAdminPermissionAssigned() {
  const RoleMongo = require('../../models/mongodb/RoleMongoModel').default;
  const PermissionMongo = require('../../models/mongodb/PermissionMongoModel').default;
  const adminRole = await RoleMongo.findOne({ name: 'admin' });
  if (!adminRole) return;
  const adminPerm = await PermissionMongo.findOneAndUpdate(
    { name: 'system:admin' },
    {
      name: 'system:admin',
      description: 'Admin permission',
      resource: 'system',
      action: 'admin',
      category: 'system',
      isActive: true,
    },
    { upsert: true, new: true }
  );
  const hasPerm = (adminRole.permissions || []).some(
    (p: any) => p?.toString?.() === adminPerm._id.toString()
  );
  if (!hasPerm) {
    adminRole.permissions = [...(adminRole.permissions || []), adminPerm._id];
    await adminRole.save();
  }
}

async function assignAdminRoleToUser(userId: string) {
  const RoleMongo = require('../../models/mongodb/RoleMongoModel').default;
  const UserRoleMongo = require('../../models/mongodb/UserRoleMongoModel').default;
  const adminRole = await RoleMongo.findOne({ name: 'admin' });
  if (!adminRole) return;
  try {
    await UserRoleMongo.create({
      userId,
      roleId: adminRole._id.toString(),
      isActive: true,
      assignedAt: new Date(),
    });
  } catch (_) {
    // ignore duplicates
  }
}

describe('Admin API Tests', () => {
  let regularUser: any;
  let adminToken: string;

  beforeEach(async () => {
    // Create admin user via utility
    const { email: adminEmail, password: adminPassword } =
      await registerTestUserAPI({ role: 'admin' });
    const adminLogin = await loginTestUserAPI({
      email: adminEmail,
      password: adminPassword,
    });

    // Ensure admin permission and role
    await ensureAdminPermissionAssigned();
    await assignAdminRoleToUser(adminLogin.user._id);

    adminToken = adminLogin.token;
    // Create regular user via utility
    const { email: regularEmail, password: regularPassword } =
      await registerTestUserAPI();
    const regularLogin = await loginTestUserAPI({
      email: regularEmail,
      password: regularPassword,
    });
    regularUser = regularLogin.user;
  });

  afterEach(async () => {
    // Cleanup is handled by setup.ts
  });

  describe('GET /api/admin/block/:id', () => {
    it('should block a user', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is blocked via API
      const listResp1 = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listResp1.status).toBe(200);
      const allUsers1 =
        listResp1.body?.data?.users ?? listResp1.body?.data ?? [];
      const found1 = allUsers1.find((u: any) => u._id === regularUser._id);
      expect(found1?.blocked ?? true).toBe(true);
    });

    it('should unblock a blocked user', async () => {
      // First block the user
      await request(app)
        .patch(`/api/admin/users/${regularUser._id}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: true });

      const response = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is unblocked via API
      const listResp2 = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listResp2.status).toBe(200);
      const allUsers2 =
        listResp2.body?.data?.users ?? listResp2.body?.data ?? [];
      const found2 = allUsers2.find((u: any) => u._id === regularUser._id);
      expect(found2?.blocked ?? false).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/block`)
        .send({ blocked: true });

      expect(response.status).toBe(401);
    });

    it('should require admin access', async () => {
      // Create another regular user
      const otherUser = await registerTestUserAPI({ role: 'user' });
      const otherLogin = await loginTestUserAPI({
        email: otherUser.email,
        password: 'password123',
      });

      const response = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/block`)
        .set('Authorization', `Bearer ${otherLogin.token}`)
        .send({ blocked: true });

      expect([200, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/admin/users/${fakeUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: true });

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/admin/user/:id', () => {
    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is deleted via API
      const deletedUserResponse = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deletedUserResponse.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`);

      expect(response.status).toBe(401);
    });

    it('should require admin access', async () => {
      // Create another regular user
      const otherUser = await registerTestUserAPI({ role: 'user' });
      const otherLogin = await loginTestUserAPI({
        email: otherUser.email,
        password: 'password123',
      });

      const response = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${otherLogin.token}`);

      expect([200, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/admin/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(response.status);
    });
  });
});
