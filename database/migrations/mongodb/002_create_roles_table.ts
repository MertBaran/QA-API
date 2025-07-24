import mongoose from 'mongoose';
import { MigrationInterface } from '../../interfaces/MigrationInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../../repositories/adapters/MongoDBAdapter';
import RoleMongo from '../../../models/mongodb/RoleMongoModel';

export class CreateRolesTable002 implements MigrationInterface {
  version = '002';
  description = 'Create roles table';

  async up(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB migration for non-MongoDB adapter');
      return;
    }

    // MongoDB connection'ı al
    const connection = mongoose.connection;

    // Mevcut model'i kullan - schema zaten tanımlı
    if (!connection.models['Role']) {
      // Model'i connection'a register et
      const RoleSchema = RoleMongo.schema;
      connection.model('Role', RoleSchema);
    }

    console.log('✅ Roles table ready');
  }

  async down(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB migration for non-MongoDB adapter');
      return;
    }

    const connection = mongoose.connection;
    await connection.dropCollection('roles');
    console.log('✅ Dropped roles table');
  }
}
