import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';

export interface IMigrationStrategy {
  runMigrations(databaseAdapter: IDatabaseAdapter): Promise<void>;
  rollbackMigrations(databaseAdapter: IDatabaseAdapter): Promise<void>;
  runSpecificMigration(
    databaseAdapter: IDatabaseAdapter,
    version: string
  ): Promise<void>;
}
