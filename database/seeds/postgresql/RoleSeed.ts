import { SeedInterface } from '../../interfaces/SeedInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { PostgreSQLAdapter } from '../../../repositories/adapters/PostgreSQLAdapter';
import { getPrismaClient } from '../../../repositories/postgresql/PrismaClientSingleton';

export class RoleSeed implements SeedInterface {
  name = 'RoleSeed';
  description = 'Seed basic roles';

  private readonly ROLES = [
    {
      name: 'user',
      description: 'Basic user permissions',
      permissions: [
        'questions:create',
        'questions:read',
        'answers:create',
        'answers:read',
      ],
    },
    {
      name: 'moderator',
      description: 'Can moderate content',
      permissions: [
        'questions:create',
        'questions:read',
        'answers:create',
        'answers:read',
        'questions:moderate',
        'answers:delete',
        'users:read',
      ],
    },
    {
      name: 'admin',
      description: 'Full system access',
      permissions: ['system:admin'],
    },
  ];

  async run(databaseAdapter: IDatabaseAdapter): Promise<Map<string, any>> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log('⏭️ Skipping PostgreSQL seed for non-PostgreSQL adapter');
      return new Map();
    }

    const prisma = getPrismaClient();
    const roleMap = new Map<string, string>();

    console.log('👥 Seeding PostgreSQL roles...');

    for (const roleData of this.ROLES) {
      try {
        const permissionIds: string[] = [];
        for (const permName of roleData.permissions) {
          const perm = await prisma.permission.findUnique({
            where: { name: permName },
          });
          if (perm) {
            permissionIds.push(perm.id);
          }
        }

        const existing = await prisma.role.findUnique({
          where: { name: roleData.name },
        });

        if (existing) {
          await prisma.rolePermission.deleteMany({
            where: { roleId: existing.id },
          });
          if (permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
              data: permissionIds.map(pid => ({
                roleId: existing.id,
                permissionId: pid,
              })),
              skipDuplicates: true,
            });
          }
          roleMap.set(roleData.name, existing.id);
          console.log(
            `✅ Role ${roleData.name} synced with ${permissionIds.length} permissions`
          );
        } else {
          const created = await prisma.role.create({
            data: {
              name: roleData.name,
              description: roleData.description,
              isSystem: true,
              isActive: true,
            },
          });
          if (permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
              data: permissionIds.map(pid => ({
                roleId: created.id,
                permissionId: pid,
              })),
              skipDuplicates: true,
            });
          }
          roleMap.set(roleData.name, created.id);
          console.log(
            `✅ Created role ${roleData.name} with ${permissionIds.length} permissions`
          );
        }
      } catch (error) {
        console.error(`❌ Error creating role ${roleData.name}:`, error);
        throw error;
      }
    }

    console.log(`✅ Seeded ${roleMap.size} PostgreSQL roles`);
    return roleMap;
  }

  async rollback(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log(
        '⏭️ Skipping PostgreSQL seed rollback for non-PostgreSQL adapter'
      );
      return;
    }

    const prisma = getPrismaClient();
    console.log('🔄 Rolling back PostgreSQL roles...');

    for (const roleData of this.ROLES) {
      try {
        await prisma.role.deleteMany({ where: { name: roleData.name } });
        console.log(`✅ Deleted role: ${roleData.name}`);
      } catch (error) {
        console.error(`❌ Error deleting role ${roleData.name}:`, error);
        throw error;
      }
    }
  }
}
