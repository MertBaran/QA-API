import mongoose from 'mongoose';
import { SeedInterface } from '../../interfaces/SeedInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../../repositories/adapters/MongoDBAdapter';

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
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB seed for non-MongoDB adapter');
      return new Map();
    }

    // Database connection'ı kontrol et
    if (!databaseAdapter.isConnected()) {
      console.log('🔌 Reconnecting to database...');
      await databaseAdapter.connect();
    }

    const connection = mongoose.connection;
    const Permission = connection.model('Permission');
    const permissionMap = new Map();

    console.log('📝 Seeding permissions...');

    // Tek seferde tüm permission'ları ekle
    try {
      const existingPermissions = await Permission.find({}).lean();
      const existingNames = existingPermissions.map(p => p['name']);

      const permissionsToCreate = this.PERMISSIONS.filter(
        perm => !existingNames.includes(perm.name)
      );

      if (permissionsToCreate.length > 0) {
        const createdPermissions =
          await Permission.insertMany(permissionsToCreate);
        console.log(`✅ Created ${createdPermissions.length} permissions`);

        for (const perm of createdPermissions) {
          permissionMap.set(perm.name, perm._id);
        }
      } else {
        console.log('✅ All permissions already exist');
        for (const perm of this.PERMISSIONS) {
          const existing = existingPermissions.find(
            p => p['name'] === perm.name
          );
          if (existing) {
            permissionMap.set(perm.name, existing._id);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error seeding permissions:', error);
      throw error;
    }

    console.log(`✅ Seeded ${permissionMap.size} permissions`);
    return permissionMap;
  }

  async rollback(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB seed rollback for non-MongoDB adapter');
      return;
    }

    const connection = mongoose.connection;
    const Permission = connection.model('Permission');

    console.log('🔄 Rolling back permissions...');

    for (const permData of this.PERMISSIONS) {
      try {
        await Permission.deleteOne({ name: permData.name });
        console.log(`✅ Deleted permission: ${permData.name}`);
      } catch (error) {
        console.error(`❌ Error deleting permission ${permData.name}:`, error);
      }
    }
  }
}
