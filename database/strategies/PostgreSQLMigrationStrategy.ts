import { IMigrationStrategy } from '../interfaces/IMigrationStrategy';
import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';
import { PostgreSQLAdapter } from '../../repositories/adapters/PostgreSQLAdapter';

// PostgreSQL şeması Prisma migrate ile yönetiliyor (npm run migrate:postgres)
// Bu strategy sadece seed öncesi no-op; migration için prisma migrate kullanın
export class PostgreSQLMigrationStrategy implements IMigrationStrategy {
  private migrations: Array<{ version: string; description: string; up: (a: IDatabaseAdapter) => Promise<void>; down: (a: IDatabaseAdapter) => Promise<void> }> = [];

  async runMigrations(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      throw new Error('PostgreSQLMigrationStrategy requires PostgreSQLAdapter');
    }

    console.log('🚀 Running PostgreSQL migrations...');

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

    console.log('✅ All PostgreSQL migrations completed');
  }

  async rollbackMigrations(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      throw new Error('PostgreSQLMigrationStrategy requires PostgreSQLAdapter');
    }

    console.log('🔄 Rolling back PostgreSQL migrations...');

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

    console.log('✅ All PostgreSQL migrations rolled back');
  }

  async runSpecificMigration(
    databaseAdapter: IDatabaseAdapter,
    version: string
  ): Promise<void> {
    if (!(databaseAdapter instanceof PostgreSQLAdapter)) {
      throw new Error('PostgreSQLMigrationStrategy requires PostgreSQLAdapter');
    }

    const migration = this.migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    console.log(
      `🚀 Running specific PostgreSQL migration ${version}: ${migration.description}`
    );
    await migration.up(databaseAdapter);
    console.log(`✅ Migration ${version} completed`);
  }
}
