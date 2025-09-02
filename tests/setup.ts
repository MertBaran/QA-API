import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { initializeContainer } from '../services/container';
import { ApplicationSetup } from '../services/ApplicationSetup';

// Test environment variables
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET_KEY'] = 'test-secret-key';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../config/env/config.env.test'),
});

// i18n cache'i temizle
import { clearI18nCache } from '../types/i18n';

// Global test app instance
export let testApp: any;

// Silence noisy Redis logs during tests
const originalWarn = console.warn;
const originalLog = console.log;
beforeAll(() => {
  console.warn = ((...args: any[]) => {
    const msg = args?.[0]?.toString?.() ?? '';
    if (typeof msg === 'string' && msg.includes('Redis localhost')) {
      return; // mute
    }
    return originalWarn.apply(console, args as any);
  }) as any;

  console.log = ((...args: any[]) => {
    const msg = args?.[0]?.toString?.() ?? '';
    if (typeof msg === 'string') {
      if (msg.includes('🔌 Redis connection closed')) return;
      if (msg.includes('Redis: Connecting to Localhost')) return;
    }
    return originalLog.apply(console, args as any);
  }) as any;
});

// Seed test database with required data
async function seedTestDatabase(): Promise<void> {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection;

    // Clean test database first
    console.log('🧹 Cleaning test database...');
    await db.dropDatabase();
    console.log('✅ Test database cleaned');

    // Create permissions first
    const PermissionModel =
      require('../models/mongodb/PermissionMongoModel').default;

    // Basic permissions for user role
    const userPermissions = await Promise.all([
      PermissionModel.findOneAndUpdate(
        { name: 'questions:read' },
        {
          name: 'questions:read',
          description: 'Read questions',
          resource: 'questions',
          action: 'read',
          category: 'content',
          isActive: true,
        },
        { upsert: true, new: true }
      ),
      PermissionModel.findOneAndUpdate(
        { name: 'questions:create' },
        {
          name: 'questions:create',
          description: 'Create questions',
          resource: 'questions',
          action: 'create',
          category: 'content',
          isActive: true,
        },
        { upsert: true, new: true }
      ),
      PermissionModel.findOneAndUpdate(
        { name: 'answers:read' },
        {
          name: 'answers:read',
          description: 'Read answers',
          resource: 'answers',
          action: 'read',
          category: 'content',
          isActive: true,
        },
        { upsert: true, new: true }
      ),
      PermissionModel.findOneAndUpdate(
        { name: 'answers:create' },
        {
          name: 'answers:create',
          description: 'Create answers',
          resource: 'answers',
          action: 'create',
          category: 'content',
          isActive: true,
        },
        { upsert: true, new: true }
      ),
    ]);

    console.log('✅ Permissions created');

    // Create default role if it doesn't exist
    const RoleModel = require('../models/mongodb/RoleMongoModel').default;
    const defaultRole = await RoleModel.findOne({ name: 'user' });

    if (!defaultRole) {
      await RoleModel.create({
        name: 'user',
        description: 'Default user role',
        permissions: userPermissions.map(p => p._id),
        isActive: true,
      });
      console.log('✅ Default role created');
    }

    // Create default admin role if it doesn't exist
    const adminRole = await RoleModel.findOne({ name: 'admin' });
    if (!adminRole) {
      await RoleModel.create({
        name: 'admin',
        description: 'Admin role',
        permissions: userPermissions.map(p => p._id),
        isActive: true,
      });
      console.log('✅ Admin role created');
    }
  } catch (error) {
    console.error('❌ Failed to seed test database:', error);
    throw error;
  }
}

beforeAll(async () => {
  try {
    console.log('🔄 Starting test environment initialization...');

    // Initialize container and database connection
    console.log('📦 Initializing container...');
    await initializeContainer();
    console.log('✅ Container initialized');

    // Test MongoDB connection
    console.log('🔌 Testing MongoDB connection...');
    const mongoose = require('mongoose');
    const testConnection = await mongoose.createConnection(
      'mongodb://localhost:27018/test'
    );
    await testConnection.asPromise();
    console.log('✅ MongoDB connection test successful');
    await testConnection.close();

    // Create test app instance
    console.log('🚀 Creating test app...');
    const appSetup = new ApplicationSetup();

    // Initialize the app (this sets up database connection)
    console.log('🔌 Initializing app...');
    await appSetup.initialize();
    console.log('✅ App initialized');

    testApp = appSetup.getApp();
    console.log('✅ Test app created');

    // Seed test database with required data
    console.log('🌱 Seeding test database...');
    await seedTestDatabase();
    console.log('✅ Test database seeded');

    console.log('✅ Test environment initialized');
  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Her test öncesi cache'i temizle
  clearI18nCache();
});

afterAll(async () => {
  // Restore console.warn
  console.warn = originalWarn;
  console.log = originalLog;
  // Test ortamı temizle
  console.log('🔚 Test environment cleaned up');
});
