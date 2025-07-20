import { IAuditProvider, AuditLogEntry } from './IAuditProvider';
import AuditLogMongo from './AuditLogMongoModel';

export class MongoAuditProvider implements IAuditProvider {
  async log(entry: AuditLogEntry): Promise<void> {
    await AuditLogMongo.create({
      ...entry,
      timestamp: entry.timestamp || new Date(),
    });
  }
}
