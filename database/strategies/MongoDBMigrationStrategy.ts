import { IMigrationStrategy } from '../interfaces/IMigrationStrategy';
import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../repositories/adapters/MongoDBAdapter';
import { CreatePermissionsTable001 } from '../migrations/mongodb/001_create_permissions_table';
import { CreateRolesTable002 } from '../migrations/mongodb/002_create_roles_table';
import { CreateUserRolesTable003 } from '../migrations/mongodb/003_create_user_roles_table';

export class MongoDBMigrationStrategy implements IMigrationStrategy {
  private migrations = [
    new CreatePermissionsTable001(),
    new CreateRolesTable002(),
    new CreateUserRolesTable003(),
  ];

  async runMigrations(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      throw new Error('MongoDBMigrationStrategy requires MongoDBAdapter');
    }

    console.log('🚀 Running MongoDB migrations...');

    for (const migration of this.migrations) {
      try {
        console.log(
          `\n📦 Running migration ${migration.version}: ${migration.description}`
        );
        await migration.up(databaseAdapter);
        console.log(`✅ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log('✅ All MongoDB migrations completed');
  }

  async rollbackMigrations(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      throw new Error('MongoDBMigrationStrategy requires MongoDBAdapter');
    }

    console.log('🔄 Rolling back MongoDB migrations...');

    for (let i = this.migrations.length - 1; i >= 0; i--) {
      const migration = this.migrations[i];
      if (!migration) {
        console.error(`❌ Migration not found at index ${i}`);
        continue;
      }

      try {
        console.log(`\n📦 Rolling back migration ${migration.version}`);
        await migration.down(databaseAdapter);
        console.log(`✅ Migration ${migration.version} rolled back`);
      } catch (error) {
        console.error(
          `❌ Failed to rollback migration ${migration.version}:`,
          error
        );
        throw error;
      }
    }

    console.log('✅ All MongoDB migrations rolled back');
  }

  async runSpecificMigration(
    databaseAdapter: IDatabaseAdapter,
    version: string
  ): Promise<void> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      throw new Error('MongoDBMigrationStrategy requires MongoDBAdapter');
    }

    const migration = this.migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    console.log(
      `🚀 Running specific MongoDB migration ${version}: ${migration.description}`
    );
    await migration.up(databaseAdapter);
    console.log(`✅ Migration ${version} completed`);
  }
}
