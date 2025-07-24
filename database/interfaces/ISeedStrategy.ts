import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';

export interface ISeedStrategy {
  runSeeds(databaseAdapter: IDatabaseAdapter): Promise<void>;
  rollbackSeeds(databaseAdapter: IDatabaseAdapter): Promise<void>;
  runSpecificSeed(
    databaseAdapter: IDatabaseAdapter,
    seedName: string
  ): Promise<void>;
}
