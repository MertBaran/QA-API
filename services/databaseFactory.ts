import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import { DatabaseType } from './contracts/IConfigurationService';
import { PostgreSQLAdapter } from '../repositories/adapters/PostgreSQLAdapter';
import { container } from 'tsyringe';

export class DatabaseFactory {
  static createDatabase(type: DatabaseType): IDatabaseAdapter {
    switch (type) {
      case DatabaseType.MongoDB:
        return container.resolve<IDatabaseAdapter>('DatabaseAdapter');
      case DatabaseType.PostgreSQL:
        return new PostgreSQLAdapter();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  static getDefaultDatabase(): IDatabaseAdapter {
    return container.resolve<IDatabaseAdapter>('DatabaseAdapter');
  }
}
