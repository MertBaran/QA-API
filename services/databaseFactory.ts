import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import { MongoDBAdapter } from '../repositories/adapters/MongoDBAdapter';
import { PostgreSQLAdapter } from '../repositories/adapters/PostgreSQLAdapter';

export type DatabaseType = 'mongodb' | 'postgresql';

export class DatabaseFactory {
  static createDatabase(type: DatabaseType): IDatabaseAdapter {
    switch (type) {
      case 'mongodb':
        return new MongoDBAdapter();
      case 'postgresql':
        return new PostgreSQLAdapter();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  static getDefaultDatabase(): IDatabaseAdapter {
    return new MongoDBAdapter();
  }
} 