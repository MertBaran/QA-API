// IMigrationStrategy kullanılmıyor, kaldırıldı
import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';
import { DatabaseStrategyFactory } from '../factories/DatabaseStrategyFactory';

export class MigrationManager {
  async runAll(databaseAdapter: IDatabaseAdapter): Promise<void> {
    const strategy =
      DatabaseStrategyFactory.createMigrationStrategy(databaseAdapter);
    await strategy.runMigrations(databaseAdapter);
  }

  async rollbackAll(databaseAdapter: IDatabaseAdapter): Promise<void> {
    const strategy =
      DatabaseStrategyFactory.createMigrationStrategy(databaseAdapter);
    await strategy.rollbackMigrations(databaseAdapter);
  }

  async runSpecific(
    databaseAdapter: IDatabaseAdapter,
    version: string
  ): Promise<void> {
    const strategy =
      DatabaseStrategyFactory.createMigrationStrategy(databaseAdapter);
    await strategy.runSpecificMigration(databaseAdapter, version);
  }
}
