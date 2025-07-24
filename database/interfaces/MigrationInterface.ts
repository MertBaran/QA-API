import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';

export interface MigrationInterface {
  version: string;
  description: string;
  up(databaseAdapter: IDatabaseAdapter): Promise<void>;
  down(databaseAdapter: IDatabaseAdapter): Promise<void>;
}
