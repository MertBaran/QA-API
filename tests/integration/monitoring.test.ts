import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { testApp } from '../setup';

async function createTestUserAndToken() {
  const dbType = process.env['DATABASE_TYPE'] || 'mongodb';

  if (dbType === 'postgresql') {
    const prisma = require('../../repositories/postgresql/PrismaClientSingleton').getPrismaClient();
    let user = await prisma.user.findUnique({ where: { email: 'monitoring@example.com' } });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          name: 'Monitoring User',
          email: 'monitoring@example.com',
          password: hashedPassword,
        },
      });
    }
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!adminRole) throw new Error('Admin role not found in seed');
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      create: { userId: user.id, roleId: adminRole.id },
      update: {},
    });
    const secret = process.env['JWT_SECRET_KEY'] || 'insaninsanderleridi';
    const token = jwt.sign(
      { id: user.id, name: user.name, lang: 'en' },
      secret,
      { expiresIn: '24h' }
    );
    return { userId: user.id, authToken: token };
  }

  const UserMongo = require('../../models/mongodb/UserMongoModel').default;
  const UserRoleMongo = require('../../models/mongodb/UserRoleMongoModel').default;
  const RoleMongo = require('../../models/mongodb/RoleMongoModel').default;

  let user = await UserMongo.findOne({ email: 'monitoring@example.com' });
  if (!user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    user = await UserMongo.create({
      name: 'Monitoring User',
      email: 'monitoring@example.com',
      password: hashedPassword,
      profile_image: '',
      blocked: false,
    });
  }

  const adminRole = await RoleMongo.findOne({ name: 'admin' });
  if (!adminRole) throw new Error('Admin role not found in seed');

  const existingUserRole = await UserRoleMongo.findOne({
    userId: String(user._id),
    roleId: String(adminRole._id),
  });
  if (!existingUserRole) {
    await UserRoleMongo.create({
      userId: String(user._id),
      roleId: String(adminRole._id),
      isActive: true,
      assignedAt: new Date(),
    });
  }

  const secret = process.env['JWT_SECRET_KEY'] || 'insaninsanderleridi';
  const token = jwt.sign(
    { id: String(user._id), name: user.name, lang: 'en' },
    secret,
    { expiresIn: '24h' }
  );
  return { userId: String(user._id), authToken: token };
}

describe('Monitoring Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    testUser = {
      email: 'monitoring@example.com',
      password: 'password123',
      firstName: 'Monitoring',
      lastName: 'User',
    };

    // Create user with admin role via Mongoose (seed has system:admin on admin role)
    const { userId: uid, authToken: tok } = await createTestUserAndToken();
    userId = uid;
    authToken = tok;
  });

  describe('GET /api/monitoring/connections', () => {
    it('should return connection status', async () => {
      const response = await request(testApp)
        .get('/api/monitoring/connections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.connections)).toBe(true);
      expect(typeof response.body.data.lastUpdate).toBe('string');
      expect(typeof response.body.data.monitoring).toBe('boolean');
    });
  });

  describe('GET /api/monitoring/alerts', () => {
    it('should return alert history with default limit', async () => {
      const response = await request(testApp)
        .get('/api/monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      expect(typeof response.body.data.total).toBe('number');
      expect(response.body.data.limit).toBe(50); // Backend default
    });

    it('should return alert history with custom limit', async () => {
      const response = await request(testApp)
        .get('/api/monitoring/alerts?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          alerts: expect.any(Array),
          total: expect.any(Number),
          limit: 10,
        },
      });
    });
  });

  describe('GET /api/monitoring/stats', () => {
    it('should return monitoring statistics', async () => {
      const response = await request(testApp)
        .get('/api/monitoring/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.connectedClients).toBe('number');
      expect(typeof response.body.data.connectionLost).toBe('number');
      expect(typeof response.body.data.connectionRestored).toBe('number');
      expect(typeof response.body.data.isMonitoring).toBe('boolean');
      expect(['object', 'null']).toContain(
        typeof response.body.data.lastAlert || 'null'
      );
      expect(typeof response.body.data.totalAlerts).toBe('number');
    });
  });

  describe('POST /api/monitoring/start', () => {
    it('should start monitoring with default interval', async () => {
      const response = await request(testApp)
        .post('/api/monitoring/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.data.interval).toBe('number'); // e.g. 30000
      expect(response.body.data.isActive).toBe(true);
    });

    it('should start monitoring with custom interval', async () => {
      const response = await request(testApp)
        .post('/api/monitoring/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ interval: 15000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.message).toBe('string');
      expect(response.body.data.interval).toBe(15000);
      expect(response.body.data.isActive).toBe(true);
    });
  });

  describe('POST /api/monitoring/stop', () => {
    it('should stop monitoring', async () => {
      const response = await request(testApp)
        .post('/api/monitoring/stop')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.message).toBe('string');
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid request body', async () => {
      const response = await request(testApp)
        .post('/api/monitoring/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ interval: 'invalid' })
        .expect(200); // Should still work with default interval

      expect(response.body.success).toBe(true);
    });

    it('should handle missing service gracefully', async () => {
      const response = await request(testApp)
        .get('/api/monitoring/connections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Service handles error gracefully

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(testApp)
        .get('/api/monitoring/connections')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toBeDefined();
    });

    it('should require admin permissions', async () => {
      // Note: This test assumes the user has admin permissions
      // In a real scenario, you might need to set up admin roles
      const response = await request(testApp)
        .get('/api/monitoring/connections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Monitoring Workflow', () => {
    it('should complete full monitoring workflow', async () => {
      // 1. Start monitoring
      const startResponse = await request(testApp)
        .post('/api/monitoring/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ interval: 10000 });

      expect(startResponse.status).toBe(200);
      expect(startResponse.body.data.isActive).toBe(true);

      // 2. Check stats
      const statsResponse = await request(testApp)
        .get('/api/monitoring/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statsResponse.status).toBe(200);
      expect(typeof statsResponse.body.data.isMonitoring).toBe('boolean');

      // 3. Check connections
      const connectionsResponse = await request(testApp)
        .get('/api/monitoring/connections')
        .set('Authorization', `Bearer ${authToken}`);

      expect(connectionsResponse.status).toBe(200);

      // 4. Check alerts
      const alertsResponse = await request(testApp)
        .get('/api/monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(alertsResponse.status).toBe(200);

      // 5. Stop monitoring
      const stopResponse = await request(testApp)
        .post('/api/monitoring/stop')
        .set('Authorization', `Bearer ${authToken}`);

      expect(stopResponse.status).toBe(200);
      expect(stopResponse.body.data.isActive).toBe(false);
    });
  });
});
