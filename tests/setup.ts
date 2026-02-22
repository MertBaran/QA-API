/// <reference types="jest" />
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

// Ensure MONGO_URI points to test database for consistent app + seed connection
process.env['MONGO_URI'] =
  process.env['MONGO_URI'] || 'mongodb://localhost:27017/test';

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

// Permissions matching remote (question-answer-test) structure
const PERMISSIONS_TO_SEED = [
  { name: 'questions:create', description: 'Create questions', resource: 'questions', action: 'create', category: 'content' },
  { name: 'questions:read', description: 'Read questions', resource: 'questions', action: 'read', category: 'content' },
  { name: 'questions:update', description: 'Update questions', resource: 'questions', action: 'update', category: 'content' },
  { name: 'questions:delete', description: 'Delete questions', resource: 'questions', action: 'delete', category: 'content' },
  { name: 'questions:moderate', description: 'Moderate questions', resource: 'questions', action: 'moderate', category: 'content' },
  { name: 'answers:create', description: 'Create answers', resource: 'answers', action: 'create', category: 'content' },
  { name: 'answers:read', description: 'Read answers', resource: 'answers', action: 'read', category: 'content' },
  { name: 'answers:update', description: 'Update answers', resource: 'answers', action: 'update', category: 'content' },
  { name: 'answers:delete', description: 'Delete answers', resource: 'answers', action: 'delete', category: 'content' },
  { name: 'users:read', description: 'Read users', resource: 'users', action: 'read', category: 'user' },
  { name: 'users:update', description: 'Update users', resource: 'users', action: 'update', category: 'user' },
  { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete', category: 'user' },
  { name: 'users:manage_roles', description: 'Manage user roles', resource: 'users', action: 'manage_roles', category: 'user' },
  { name: 'system:admin', description: 'System administration', resource: 'system', action: 'admin', category: 'system' },
];

// Seed test database - structure aligned with remote (question-answer-test)
async function seedTestDatabase(): Promise<void> {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection;

    // Clean test database first
    console.log('🧹 Cleaning test database...');
    await db.dropDatabase();
    console.log('✅ Test database cleaned');

    const PermissionModel = require('../models/mongodb/PermissionMongoModel').default;
    const RoleModel = require('../models/mongodb/RoleMongoModel').default;

    // Create all permissions (matching remote)
    const permDocs = await Promise.all(
      PERMISSIONS_TO_SEED.map(p =>
        PermissionModel.findOneAndUpdate(
          { name: p.name },
          { ...p, isActive: true },
          { upsert: true, new: true }
        )
      )
    );
    const permByName = new Map(PERMISSIONS_TO_SEED.map((p, i) => [p.name, permDocs[i]._id]));
    console.log('✅ Permissions created');

    // User role: questions:create, questions:read, answers:create, answers:read
    const userPermNames = ['questions:create', 'questions:read', 'answers:create', 'answers:read'];
    const userPermIds = userPermNames.map(n => permByName.get(n)).filter(Boolean);
    await RoleModel.findOneAndUpdate(
      { name: 'user' },
      { name: 'user', description: 'Basic user permissions', permissions: userPermIds, isActive: true },
      { upsert: true, new: true }
    );
    console.log('✅ User role created');

    // Moderator role: user perms + questions:moderate, answers:delete, users:read
    const modPermNames = [...userPermNames, 'questions:moderate', 'answers:delete', 'users:read'];
    const modPermIds = modPermNames.map(n => permByName.get(n)).filter(Boolean);
    await RoleModel.findOneAndUpdate(
      { name: 'moderator' },
      { name: 'moderator', description: 'Can moderate content', permissions: modPermIds, isActive: true },
      { upsert: true, new: true }
    );
    console.log('✅ Moderator role created');

    // Admin role: ONLY system:admin (matching remote)
    const systemAdminId = permByName.get('system:admin');
    if (!systemAdminId) throw new Error('system:admin permission not found');
    await RoleModel.findOneAndUpdate(
      { name: 'admin' },
      { name: 'admin', description: 'Full system access', permissions: [systemAdminId], isActive: true },
      { upsert: true, new: true }
    );
    console.log('✅ Admin role created');
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

    // Test MongoDB connection (config.env.test veya MONGO_URI env override)
    console.log('🔌 Testing MongoDB connection...');
    const mongoose = require('mongoose');
    const mongoUri =
      process.env['MONGO_URI'] || 'mongodb://localhost:27017/test';
    const testConnection = await mongoose.createConnection(mongoUri);
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
