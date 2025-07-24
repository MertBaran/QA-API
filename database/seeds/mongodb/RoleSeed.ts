import mongoose from 'mongoose';
import { SeedInterface } from '../../interfaces/SeedInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../../repositories/adapters/MongoDBAdapter';

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
    const Role = connection.model('Role');
    const Permission = connection.model('Permission');
    const roleMap = new Map();

    console.log('👥 Seeding roles...');

    for (const roleData of this.ROLES) {
      try {
        let role = await Role.findOne({ name: roleData.name });

        if (!role) {
          // Get permission IDs
          const permissionIds = [];
          for (const permName of roleData.permissions) {
            const permission = await Permission.findOne({ name: permName });
            if (permission) {
              permissionIds.push(permission._id);
            }
          }

          role = await Role.create({
            name: roleData.name,
            description: roleData.description,
            permissions: permissionIds,
            isSystem: true,
            isActive: true,
          });
          console.log(
            `✅ Created role: ${roleData.name} with ${permissionIds.length} permissions`
          );
        } else {
          console.log(`✅ Role exists: ${roleData.name}`);
        }

        roleMap.set(roleData.name, role._id);
      } catch (error) {
        console.error(`❌ Error creating role ${roleData.name}:`, error);
      }
    }

    console.log(`✅ Seeded ${roleMap.size} roles`);
    return roleMap;
  }

  async rollback(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB seed rollback for non-MongoDB adapter');
      return;
    }

    const connection = mongoose.connection;
    const Role = connection.model('Role');

    console.log('🔄 Rolling back roles...');

    for (const roleData of this.ROLES) {
      try {
        await Role.deleteOne({ name: roleData.name });
        console.log(`✅ Deleted role: ${roleData.name}`);
      } catch (error) {
        console.error(`❌ Error deleting role ${roleData.name}:`, error);
      }
    }
  }
}
