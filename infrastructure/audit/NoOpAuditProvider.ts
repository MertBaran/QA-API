import { injectable } from 'tsyringe';
import { IAuditProvider, AuditLogEntry } from './IAuditProvider';

/**
 * PostgreSQL modunda MongoDB kullanılmadığı için audit log'ları
 * sessizce atlar. İleride Prisma ile PostgreSQL audit tablosu eklenebilir.
 */
@injectable()
export class NoOpAuditProvider implements IAuditProvider {
  async log(_entry: AuditLogEntry): Promise<void> {
    // No-op: PostgreSQL modunda MongoDB audit kullanılmıyor
  }
}
