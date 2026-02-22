/**
 * Prisma seed - Permission ve Role. DATABASE_URL env'den alınır (Docker'da docker-compose set eder).
 */
const { PrismaClient } = require('@prisma/client');
const path = require('path');
if (!process.env.DATABASE_URL) {
  require('dotenv').config({
    path: path.resolve(process.cwd(), 'config/env/config.env.docker'),
    override: true,
  });
}

const prisma = new PrismaClient();

const PERMISSIONS = [
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

const ROLES = [
  { name: 'user', description: 'Basic user permissions', permissions: ['questions:create', 'questions:read', 'answers:create', 'answers:read'] },
  { name: 'moderator', description: 'Can moderate content', permissions: ['questions:create', 'questions:read', 'answers:create', 'answers:read', 'questions:moderate', 'answers:delete', 'users:read'] },
  { name: 'admin', description: 'Full system access', permissions: ['system:admin'] },
];

async function main() {
  console.log('🌱 Seeding permissions and roles...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: p.name },
      create: p,
      update: {},
    });
  }
  console.log('✅ Permissions seeded');

  for (const r of ROLES) {
    const permIds = await prisma.permission.findMany({
      where: { name: { in: r.permissions } },
      select: { id: true },
    });
    const existing = await prisma.role.findUnique({ where: { name: r.name } });
    if (existing) {
      await prisma.rolePermission.deleteMany({ where: { roleId: existing.id } });
      await prisma.rolePermission.createMany({
        data: permIds.map((p) => ({ roleId: existing.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    } else {
      const created = await prisma.role.create({
        data: { name: r.name, description: r.description, isSystem: true, isActive: true },
      });
      await prisma.rolePermission.createMany({
        data: permIds.map((p) => ({ roleId: created.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
  }
  console.log('✅ Roles seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
