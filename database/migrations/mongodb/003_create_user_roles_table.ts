import mongoose from 'mongoose';
import { MigrationInterface } from '../../interfaces/MigrationInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../../repositories/adapters/MongoDBAdapter';
import UserRoleMongo from '../../../models/mongodb/UserRoleMongoModel';

export class CreateUserRolesTable003 implements MigrationInterface {
  version = '003';
  description = 'Create user roles table';

  async up(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB migration for non-MongoDB adapter');
      return;
    }

    // MongoDB connection'ı al
    const connection = mongoose.connection;

    // Mevcut model'i kullan - schema zaten tanımlı
    if (!connection.models['UserRole']) {
      // Model'i connection'a register et
      const UserRoleSchema = UserRoleMongo.schema;
      connection.model('UserRole', UserRoleSchema);
    }

    console.log('✅ User roles table ready');
  }

  async down(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB migration for non-MongoDB adapter');
      return;
    }

    const connection = mongoose.connection;
    await connection.dropCollection('userroles');
    console.log('✅ Dropped user roles table');
  }
}
