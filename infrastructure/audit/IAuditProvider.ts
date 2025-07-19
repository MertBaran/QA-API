// infrastructure/audit/IAuditProvider.ts
export type AuditLogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface AuditActor {
  id?: string;
  email?: string;
  role?: string;
}

export interface AuditTarget {
  type: string; // ör: 'question', 'user', 'answer'
  id: string;
}

export interface ErrorDetail {
  message: string;
  stack?: string;
  code?: string;
  [key: string]: any;
}

export interface AuditLogEntry {
  action: string;
  level?: AuditLogLevel;
  actor?: AuditActor;
  target?: AuditTarget;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  tags?: string[];
  error?: ErrorDetail;
  details?: Record<string, any>;
  context?: string;
  timestamp?: Date;
}

export interface IAuditProvider {
  log(entry: AuditLogEntry): Promise<void>;
} 