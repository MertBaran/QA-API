import { SeedInterface } from '../../interfaces/SeedInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { PostgreSQLAdapter } from '../../../repositories/adapters/PostgreSQLAdapter';

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
    // Sadece PostgreSQL adapter için çalış
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log('⏭️ Skipping PostgreSQL seed for non-PostgreSQL adapter');
      return new Map();
    }

    // PostgreSQL seed logic burada olacak
    // const client = databaseAdapter.getClient();
    // const permissionMap = new Map();
    //
    // console.log('📝 Seeding PostgreSQL permissions...');
    //
    // for (const permData of this.PERMISSIONS) {
    //   try {
    //     const result = await client.query(
    //       'INSERT INTO permissions (name, description, resource, action, category) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING RETURNING id',
    //       [permData.name, permData.description, permData.resource, permData.action, permData.category]
    //     );
    //
    //     if (result.rows.length > 0) {
    //       permissionMap.set(permData.name, result.rows[0].id);
    //       console.log(`✅ Created permission: ${permData.name}`);
    //     } else {
    //       console.log(`✅ Permission exists: ${permData.name}`);
    //     }
    //   } catch (error) {
    //     console.error(`❌ Error creating permission ${permData.name}:`, error);
    //   }
    // }
    //
    // console.log(`✅ Seeded ${permissionMap.size} PostgreSQL permissions`);
    // return permissionMap;

    console.log('📝 PostgreSQL permissions seeding not implemented yet');
    return new Map();
  }

  async rollback(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece PostgreSQL adapter için çalış
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log(
        '⏭️ Skipping PostgreSQL seed rollback for non-PostgreSQL adapter'
      );
      return;
    }

    // PostgreSQL rollback logic burada olacak
    // const client = databaseAdapter.getClient();
    //
    // console.log('🔄 Rolling back PostgreSQL permissions...');
    //
    // for (const permData of this.PERMISSIONS) {
    //   try {
    //     await client.query('DELETE FROM permissions WHERE name = $1', [permData.name]);
    //     console.log(`✅ Deleted permission: ${permData.name}`);
    //   } catch (error) {
    //     console.error(`❌ Error deleting permission ${permData.name}:`, error);
    //   }
    // }

    console.log('🔄 PostgreSQL permissions rollback not implemented yet');
  }
}
