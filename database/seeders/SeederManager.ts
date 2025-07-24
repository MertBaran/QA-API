// ISeedStrategy kullanılmıyor, kaldırıldı
import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';
import { DatabaseStrategyFactory } from '../factories/DatabaseStrategyFactory';

export class SeederManager {
  async runAll(databaseAdapter: IDatabaseAdapter): Promise<void> {
    const strategy =
      DatabaseStrategyFactory.createSeedStrategy(databaseAdapter);
    await strategy.runSeeds(databaseAdapter);
  }

  async rollbackAll(databaseAdapter: IDatabaseAdapter): Promise<void> {
    const strategy =
      DatabaseStrategyFactory.createSeedStrategy(databaseAdapter);
    await strategy.rollbackSeeds(databaseAdapter);
  }

  async runSpecific(
    databaseAdapter: IDatabaseAdapter,
    seedName: string
  ): Promise<void> {
    const strategy =
      DatabaseStrategyFactory.createSeedStrategy(databaseAdapter);
    await strategy.runSpecificSeed(databaseAdapter, seedName);
  }
}
