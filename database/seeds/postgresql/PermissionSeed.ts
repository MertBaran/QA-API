import { SeedInterface } from '../../interfaces/SeedInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { PostgreSQLAdapter } from '../../../repositories/adapters/PostgreSQLAdapter';
import { getPrismaClient } from '../../../repositories/postgresql/PrismaClientSingleton';

export class PermissionSeed implements SeedInterface {
  name = 'PermissionSeed';
  description = 'Seed basic permissions';

  private readonly PERMISSIONS = [
    {
      name: 'questions:create',
      description: 'Create questions',
      resource: 'questions',
      action: 'create',
      category: 'content',
    },
    {
      name: 'questions:read',
      description: 'Read questions',
      resource: 'questions',
      action: 'read',
      category: 'content',
    },
    {
      name: 'questions:update',
      description: 'Update questions',
      resource: 'questions',
      action: 'update',
      category: 'content',
    },
    {
      name: 'questions:delete',
      description: 'Delete questions',
      resource: 'questions',
      action: 'delete',
      category: 'content',
    },
    {
      name: 'questions:moderate',
      description: 'Moderate questions',
      resource: 'questions',
      action: 'moderate',
      category: 'content',
    },
    {
      name: 'answers:create',
      description: 'Create answers',
      resource: 'answers',
      action: 'create',
      category: 'content',
    },
    {
      name: 'answers:read',
      description: 'Read answers',
      resource: 'answers',
      action: 'read',
      category: 'content',
    },
    {
      name: 'answers:update',
      description: 'Update answers',
      resource: 'answers',
      action: 'update',
      category: 'content',
    },
    {
      name: 'answers:delete',
      description: 'Delete answers',
      resource: 'answers',
      action: 'delete',
      category: 'content',
    },
    {
      name: 'users:read',
      description: 'Read users',
      resource: 'users',
      action: 'read',
      category: 'user',
    },
    {
      name: 'users:update',
      description: 'Update users',
      resource: 'users',
      action: 'update',
      category: 'user',
    },
    {
      name: 'users:delete',
      description: 'Delete users',
      resource: 'users',
      action: 'delete',
      category: 'user',
    },
    {
      name: 'users:manage_roles',
      description: 'Manage user roles',
      resource: 'users',
      action: 'manage_roles',
      category: 'user',
    },
    {
      name: 'system:admin',
      description: 'System administration',
      resource: 'system',
      action: 'admin',
      category: 'system',
    },
  ];

  async run(databaseAdapter: IDatabaseAdapter): Promise<Map<string, any>> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log('⏭️ Skipping PostgreSQL seed for non-PostgreSQL adapter');
      return new Map();
    }

    const prisma = getPrismaClient();
    const permissionMap = new Map<string, string>();

    console.log('📝 Seeding PostgreSQL permissions...');

    for (const permData of this.PERMISSIONS) {
      try {
        const existing = await prisma.permission.findUnique({
          where: { name: permData.name },
        });
        if (existing) {
          permissionMap.set(permData.name, existing.id);
          continue;
        }
        const created = await prisma.permission.create({
          data: {
            name: permData.name,
            description: permData.description,
            resource: permData.resource,
            action: permData.action,
            category: permData.category as 'content' | 'user' | 'system',
            isActive: true,
          },
        });
        permissionMap.set(permData.name, created.id);
        console.log(`✅ Created permission: ${permData.name}`);
      } catch (error) {
        console.error(`❌ Error creating permission ${permData.name}:`, error);
        throw error;
      }
    }

    console.log(`✅ Seeded ${permissionMap.size} PostgreSQL permissions`);
    return permissionMap;
  }

  async rollback(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log(
        '⏭️ Skipping PostgreSQL seed rollback for non-PostgreSQL adapter'
      );
      return;
    }

    const prisma = getPrismaClient();
    console.log('🔄 Rolling back PostgreSQL permissions...');

    for (const permData of this.PERMISSIONS) {
      try {
        await prisma.permission.deleteMany({ where: { name: permData.name } });
        console.log(`✅ Deleted permission: ${permData.name}`);
      } catch (error) {
        console.error(`❌ Error deleting permission ${permData.name}:`, error);
        throw error;
      }
    }
  }
}
