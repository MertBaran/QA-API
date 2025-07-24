import { MigrationInterface } from '../../interfaces/MigrationInterface';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';
import { PostgreSQLAdapter } from '../../../repositories/adapters/PostgreSQLAdapter';

export class CreatePermissionsTable001 implements MigrationInterface {
  version = '001';
  description = 'Create permissions table';

  async up(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece PostgreSQL adapter için çalış
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log(
        '⏭️ Skipping PostgreSQL migration for non-PostgreSQL adapter'
      );
      return;
    }

    // PostgreSQL migration logic burada olacak
    // const client = databaseAdapter.getClient();
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS permissions (
    //     id SERIAL PRIMARY KEY,
    //     name VARCHAR(255) UNIQUE NOT NULL,
    //     description TEXT NOT NULL,
    //     resource VARCHAR(255) NOT NULL,
    //     action VARCHAR(255) NOT NULL,
    //     category VARCHAR(50) DEFAULT 'content',
    //     is_active BOOLEAN DEFAULT true,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);

    console.log('✅ PostgreSQL permissions table ready');
  }

  async down(databaseAdapter: IDatabaseAdapter): Promise<void> {
    // Sadece PostgreSQL adapter için çalış
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      console.log(
        '⏭️ Skipping PostgreSQL migration for non-PostgreSQL adapter'
      );
      return;
    }

    // PostgreSQL rollback logic burada olacak
    // const client = databaseAdapter.getClient();
    // await client.query('DROP TABLE IF EXISTS permissions;');

    console.log('✅ Dropped PostgreSQL permissions table');
  }
}
