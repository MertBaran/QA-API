import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';

import { PostgreSQLAdapter } from '../repositories/adapters/PostgreSQLAdapter';
import { container } from 'tsyringe';

export type DatabaseType = 'mongodb' | 'postgresql';

export class DatabaseFactory {
  static createDatabase(type: DatabaseType): IDatabaseAdapter {
    switch (type) {
      case 'mongodb':
        return container.resolve<IDatabaseAdapter>('DatabaseAdapter');
      case 'postgresql':
        return new PostgreSQLAdapter();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  static getDefaultDatabase(): IDatabaseAdapter {
    return container.resolve<IDatabaseAdapter>('DatabaseAdapter');
  }
}
