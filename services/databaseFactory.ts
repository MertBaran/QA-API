import { IDatabaseAdapter } from '../repositories/adapters/IDatabaseAdapter';
import { container } from 'tsyringe';
import { TOKENS } from './TOKENS';

export class DatabaseFactory {
  /** Container'da DATABASE_TYPE'a göre register edilmiş adapter'ı döner. initializeContainer önce çağrılmalı. */
  static getDatabase(): IDatabaseAdapter {
    return container.resolve<IDatabaseAdapter>(TOKENS.IDatabaseAdapter);
  }
}
