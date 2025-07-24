import mongoose from 'mongoose';
import { MigrationInterface } from '../../interfaces/MigrationInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../../repositories/adapters/MongoDBAdapter';
import PermissionMongo from '../../../models/mongodb/PermissionMongoModel';

export class CreatePermissionsTable001 implements MigrationInterface {
  version = '001';
  description = 'Create permissions table';

  async up(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB migration for non-MongoDB adapter');
      return;
    }

    // MongoDB connection'ı al
    const connection = mongoose.connection;

    // Mevcut model'i kullan - schema zaten tanımlı
    if (!connection.models['Permission']) {
      // Model'i connection'a register et
      const PermissionSchema = PermissionMongo.schema;
      connection.model('Permission', PermissionSchema);
    }

    console.log('✅ Permissions table ready');
  }

  async down(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece MongoDB adapter için çalış
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB migration for non-MongoDB adapter');
      return;
    }

    const connection = mongoose.connection;
    await connection.dropCollection('permissions');
    console.log('✅ Dropped permissions table');
  }
}
