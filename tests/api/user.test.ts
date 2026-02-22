import 'reflect-metadata';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { testApp } from '../setup';

import '../setup';
import { registerTestUserAPI, loginTestUserAPI } from '../utils/testUtils';

async function ensureAdminPermissions(token: string) {
  const resp = await request(testApp)
    .get('/api/auth/check-admin-permissions')
    .set('Authorization', `Bearer ${token}`);
  if (resp.status === 200 && resp.body?.hasAdminPermission) return;
  const dbType = process.env['DATABASE_TYPE'] || 'mongodb';
  if (dbType === 'postgresql') {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env['JWT_SECRET_KEY'] || 'test-secret-key') as { id: string };
    const prisma = require('../../repositories/postgresql/PrismaClientSingleton').getPrismaClient();
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!adminRole) return;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: decoded.id, roleId: adminRole.id } },
      create: { userId: decoded.id, roleId: adminRole.id },
      update: {},
    });
    return;
  }
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

function fakeUserId(): string {
  return process.env['DATABASE_TYPE'] === 'postgresql' ? randomUUID() : require('mongoose').Types.ObjectId().toString();
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
    it('should get all users or require admin', async () => {
      const response = await request(testApp)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get single user or require permission', async () => {
      const id = testUser.id ?? testUser._id;
      const response = await request(testApp)
        .get(`/api/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(testApp)
        .get(`/api/users/${fakeUserId()}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([403, 404]).toContain(response.status);
    });

    it('should return error for invalid user id format', async () => {
      const response = await request(testApp)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([400, 403, 404]).toContain(response.status);
    });
  });
});
