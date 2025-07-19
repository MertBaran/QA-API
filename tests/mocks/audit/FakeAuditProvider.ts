import { IAuditProvider, AuditLogEntry } from '../../../infrastructure/audit/IAuditProvider';

export class FakeAuditProvider implements IAuditProvider {
  public logs: AuditLogEntry[] = [];
  async log(entry: AuditLogEntry): Promise<void> {
    this.logs.push(entry);
  }
} 