/// <reference types="jest" />
import 'reflect-metadata';
import { execSync } from 'child_process';
import path from 'path';
import { initializeContainer } from '../services/container';
import { ApplicationSetup } from '../services/ApplicationSetup';

// Test environment variables (env loaded by jest.env.ts setupFiles)
process.env['JWT_SECRET_KEY'] = 'test-secret-key';
console.log(`📂 Test config: ${process.env['CONFIG_FILE'] || 'config.env.test'}`);

// Ensure MONGO_URI for MongoDB tests
if (process.env['DATABASE_TYPE'] !== 'postgresql') {
  process.env['MONGO_URI'] =
    process.env['MONGO_URI'] || 'mongodb://localhost:27017/test';
}

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

// PostgreSQL PermissionCategory enum
type PermissionCategory = 'content' | 'user' | 'system';

// Seed test database - MongoDB or PostgreSQL
async function seedTestDatabase(): Promise<void> {
  const dbType = process.env['DATABASE_TYPE'] || 'mongodb';

  if (dbType === 'postgresql') {
    await seedPostgreSQL();
  } else {
    await seedMongoDB();
  }
}

async function seedPostgreSQL(): Promise<void> {
  try {
    const { getPrismaClient } = require('../repositories/postgresql/PrismaClientSingleton');
    const prisma = getPrismaClient();

    console.log('🧹 Cleaning PostgreSQL test database...');
    await prisma.rolePermission.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    console.log('✅ Test database cleaned');

    const permByName = new Map<string, string>();
    for (const p of PERMISSIONS_TO_SEED) {
      const created = await prisma.permission.upsert({
        where: { name: p.name },
        create: {
          name: p.name,
          description: p.description,
          resource: p.resource,
          action: p.action,
          category: p.category as PermissionCategory,
          isActive: true,
        },
        update: { isActive: true },
      });
      permByName.set(p.name, created.id);
    }
    console.log('✅ Permissions created');

    const userPermNames = ['questions:create', 'questions:read', 'answers:create', 'answers:read'];
    const userPermIds = userPermNames.map(n => permByName.get(n)!).filter(Boolean);
    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      create: { name: 'user', description: 'Basic user permissions', isSystem: true, isActive: true },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: userRole.id } });
    if (userPermIds.length) {
      await prisma.rolePermission.createMany({
        data: userPermIds.map(pid => ({ roleId: userRole.id, permissionId: pid })),
      });
    }
    console.log('✅ User role created');

    const modPermNames = [...userPermNames, 'questions:moderate', 'answers:delete', 'users:read'];
    const modPermIds = modPermNames.map(n => permByName.get(n)!).filter(Boolean);
    const modRole = await prisma.role.upsert({
      where: { name: 'moderator' },
      create: { name: 'moderator', description: 'Can moderate content', isSystem: true, isActive: true },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: modRole.id } });
    if (modPermIds.length) {
      await prisma.rolePermission.createMany({
        data: modPermIds.map(pid => ({ roleId: modRole.id, permissionId: pid })),
      });
    }
    console.log('✅ Moderator role created');

    const systemAdminId = permByName.get('system:admin');
    if (!systemAdminId) throw new Error('system:admin permission not found');
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      create: { name: 'admin', description: 'Full system access', isSystem: true, isActive: true },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: systemAdminId },
    });
    console.log('✅ Admin role created');
  } catch (error) {
    console.error('❌ Failed to seed PostgreSQL test database:', error);
    throw error;
  }
}

async function seedMongoDB(): Promise<void> {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection;

    console.log('🧹 Cleaning test database...');
    await db.dropDatabase();
    console.log('✅ Test database cleaned');

    const PermissionModel = require('../models/mongodb/PermissionMongoModel').default;
    const RoleModel = require('../models/mongodb/RoleMongoModel').default;

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

    const userPermNames = ['questions:create', 'questions:read', 'answers:create', 'answers:read'];
    const userPermIds = userPermNames.map(n => permByName.get(n)).filter(Boolean);
    await RoleModel.findOneAndUpdate(
      { name: 'user' },
      { name: 'user', description: 'Basic user permissions', permissions: userPermIds, isActive: true },
      { upsert: true, new: true }
    );
    console.log('✅ User role created');

    const modPermNames = [...userPermNames, 'questions:moderate', 'answers:delete', 'users:read'];
    const modPermIds = modPermNames.map(n => permByName.get(n)).filter(Boolean);
    await RoleModel.findOneAndUpdate(
      { name: 'moderator' },
      { name: 'moderator', description: 'Can moderate content', permissions: modPermIds, isActive: true },
      { upsert: true, new: true }
    );
    console.log('✅ Moderator role created');

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

    // Test database connection
    const dbType = process.env['DATABASE_TYPE'] || 'mongodb';
    if (dbType === 'postgresql') {
      console.log('🔌 Testing PostgreSQL connection...');
      const { getPrismaClient } = require('../repositories/postgresql/PrismaClientSingleton');
      const prisma = getPrismaClient();
      await prisma.$connect();
      console.log('✅ PostgreSQL connection test successful');
      console.log('📦 Applying Prisma migrations to test DB...');
      execSync('npx prisma migrate deploy', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe',
        env: process.env,
      });
      console.log('✅ Migrations applied');
    } else {
      console.log('🔌 Testing MongoDB connection...');
      const mongoose = require('mongoose');
      const mongoUri =
        process.env['MONGO_URI'] || 'mongodb://localhost:27017/test';
      const testConnection = await mongoose.createConnection(mongoUri);
      await testConnection.asPromise();
      console.log('✅ MongoDB connection test successful');
      await testConnection.close();
    }

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
