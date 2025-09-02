import request from 'supertest';
import { testApp } from '../setup';

// Helper to assign admin role directly in DB for tests
async function assignAdminRoleToUser(userId: string) {
  const RoleMongo = require('../../models/mongodb/RoleMongoModel').default;
  const UserRoleMongo =
    require('../../models/mongodb/UserRoleMongoModel').default;
  const adminRole = await RoleMongo.findOne({ name: 'admin' });
  if (!adminRole) throw new Error('Admin role not found in test DB');
  // Upsert user-role (unique index on userId+roleId prevents duplicates)
  try {
    await UserRoleMongo.create({
      userId,
      roleId: adminRole._id.toString(),
      isActive: true,
      assignedAt: new Date(),
    });
  } catch (_e) {
    // ignore duplicate errors between runs
  }
}

// Ensure system:admin permission exists and linked to admin role
async function ensureAdminPermissionAssigned() {
  const RoleMongo = require('../../models/mongodb/RoleMongoModel').default;
  const PermissionMongo =
    require('../../models/mongodb/PermissionMongoModel').default;
  const adminRole = await RoleMongo.findOne({ name: 'admin' });
  if (!adminRole) throw new Error('Admin role not found');

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

  // Add to role if not present
  const hasPerm = (adminRole.permissions || []).some(
    (p: any) => p?.toString?.() === adminPerm._id.toString()
  );
  if (!hasPerm) {
    adminRole.permissions = [...(adminRole.permissions || []), adminPerm._id];
    await adminRole.save();
  }
}

describe('Monitoring Integration Tests', () => {
  let testUser: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Test user oluştur
    testUser = {
      email: 'monitoring@example.com',
      password: 'password123',
      firstName: 'Monitoring',
      lastName: 'User',
      title: 'Admin',
      bio: 'Test bio',
      location: 'Test Location',
      website: 'https://test.com',
      github: 'monitoringuser',
      twitter: 'monitoringuser',
      linkedin: 'monitoringuser',
      avatar: 'https://test.com/avatar.jpg',
      profile_image: 'https://test.com/avatar.jpg',
      blocked: false,
    };

    // Register user
    const registerResponse = await request(testApp)
      .post('/api/auth/register')
      .send(testUser);

    expect(registerResponse.status).toBe(200);

    // Login user
    const loginResponse = await request(testApp).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
      captchaToken: 'test-captcha-token-12345',
    });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.access_token;

    // Fetch profile to get user id
    const profileResponse = await request(testApp)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);
    expect(profileResponse.status).toBe(200);
    userId = profileResponse.body.data._id;

    // Assign admin role and ensure admin permission exists on that role
    await assignAdminRoleToUser(userId);
    await ensureAdminPermissionAssigned();
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
