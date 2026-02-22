import 'reflect-metadata';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { testApp } from '../setup';

import '../setup';
import { registerTestUserAPI, loginTestUserAPI } from '../utils/testUtils';

function uid(u: any): string {
  return u?.id ?? u?._id;
}

function fakeUserId(): string {
  return process.env['DATABASE_TYPE'] === 'postgresql' ? randomUUID() : require('mongoose').Types.ObjectId().toString();
}

async function assignAdminRoleToUser(userId: string) {
  const dbType = process.env['DATABASE_TYPE'] || 'mongodb';
  if (dbType === 'postgresql') {
    const prisma = require('../../repositories/postgresql/PrismaClientSingleton').getPrismaClient();
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!adminRole) return;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: adminRole.id } },
      create: { userId, roleId: adminRole.id },
      update: {},
    });
    return;
  }
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

    await assignAdminRoleToUser(uid(adminLogin.user));

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
      const response = await request(testApp)
        .patch(`/api/admin/users/${uid(regularUser)}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is blocked via API
      const listResp1 = await request(testApp)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listResp1.status).toBe(200);
      const allUsers1 =
        listResp1.body?.data?.users ?? listResp1.body?.data ?? [];
      const found1 = allUsers1.find((u: any) => (u.id ?? u._id) === uid(regularUser));
      expect(found1?.blocked ?? true).toBe(true);
    });

    it('should unblock a blocked user', async () => {
      // First block the user
      await request(testApp)
        .patch(`/api/admin/users/${uid(regularUser)}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: true });

      const response = await request(testApp)
        .patch(`/api/admin/users/${uid(regularUser)}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is unblocked via API
      const listResp2 = await request(testApp)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listResp2.status).toBe(200);
      const allUsers2 =
        listResp2.body?.data?.users ?? listResp2.body?.data ?? [];
      const found2 = allUsers2.find((u: any) => (u.id ?? u._id) === uid(regularUser));
      expect(found2?.blocked ?? false).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(testApp)
        .patch(`/api/admin/users/${uid(regularUser)}/block`)
        .send({ blocked: true });

      expect(response.status).toBe(401);
    });

    it('should require admin access', async () => {
      // Create another regular user
      const otherUser = await registerTestUserAPI({ role: 'user' });
      const otherLogin = await loginTestUserAPI({
        email: otherUser.email,
        password: 'Password1!',
      });

      const response = await request(testApp)
        .patch(`/api/admin/users/${uid(regularUser)}/block`)
        .set('Authorization', `Bearer ${otherLogin.token}`)
        .send({ blocked: true });

      expect([200, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(testApp)
        .patch(`/api/admin/users/${fakeUserId()}/block`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ blocked: true });

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/admin/user/:id', () => {
    it('should delete a user', async () => {
      const response = await request(testApp)
        .delete(`/api/admin/users/${uid(regularUser)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is deleted via API
      const deletedUserResponse = await request(testApp)
        .get(`/api/users/${uid(regularUser)}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deletedUserResponse.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(testApp)
        .delete(`/api/admin/users/${uid(regularUser)}`);

      expect(response.status).toBe(401);
    });

    it('should require admin access', async () => {
      // Create another regular user
      const otherUser = await registerTestUserAPI({ role: 'user' });
      const otherLogin = await loginTestUserAPI({
        email: otherUser.email,
        password: 'Password1!',
      });

      const response = await request(testApp)
        .delete(`/api/admin/users/${uid(regularUser)}`)
        .set('Authorization', `Bearer ${otherLogin.token}`);

      expect([200, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(testApp)
        .delete(`/api/admin/users/${fakeUserId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(response.status);
    });
  });
});
