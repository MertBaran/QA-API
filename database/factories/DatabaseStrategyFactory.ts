import { IMigrationStrategy } from '../interfaces/IMigrationStrategy';
import { ISeedStrategy } from '../interfaces/ISeedStrategy';
import { MongoDBMigrationStrategy } from '../strategies/MongoDBMigrationStrategy';
import { PostgreSQLMigrationStrategy } from '../strategies/PostgreSQLMigrationStrategy';
import { MongoDBSeedStrategy } from '../strategies/MongoDBSeedStrategy';
import { PostgreSQLSeedStrategy } from '../strategies/PostgreSQLSeedStrategy';
import { IDatabaseAdapter } from '../../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../../repositories/adapters/MongoDBAdapter';
import { PostgreSQLAdapter } from '../../repositories/adapters/PostgreSQLAdapter';

export class DatabaseStrategyFactory {
  static createMigrationStrategy(
    databaseAdapter: IDatabaseAdapter
  ): IMigrationStrategy {
    if (databaseAdapter instanceof MongoDBAdapter) {
      return new MongoDBMigrationStrategy();
    } else if (databaseAdapter instanceof PostgreSQLAdapter) {
      return new PostgreSQLMigrationStrategy();
    } else {
      throw new Error(
        `Unsupported database adapter type: ${databaseAdapter.constructor.name}`
      );
    }
  }

  static createSeedStrategy(databaseAdapter: IDatabaseAdapter): ISeedStrategy {
    if (databaseAdapter instanceof MongoDBAdapter) {
      return new MongoDBSeedStrategy();
    } else if (databaseAdapter instanceof PostgreSQLAdapter) {
      return new PostgreSQLSeedStrategy();
    } else {
      throw new Error(
        `Unsupported database adapter type: ${databaseAdapter.constructor.name}`
      );
    }
  }
}
