import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';

export interface SeedInterface {
  name: string;
  description: string;
  run(databaseAdapter: IDatabaseAdapter): Promise<any>;
  rollback(databaseAdapter: IDatabaseAdapter): Promise<void>;
}
