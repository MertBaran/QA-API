import mongoose, { Document, Schema } from 'mongoose';
import { AuditLogEntry } from './IAuditProvider';

export interface IAuditLogMongo extends Document, AuditLogEntry {}

const AuditLogSchema = new Schema<IAuditLogMongo>({
  action: { type: String, required: true },
  level: { type: String, enum: ['info', 'warn', 'error', 'critical'] },
  actor: {
    id: { type: String },
    email: { type: String },
    role: { type: String },
  },
  target: {
    type: { type: String },
    id: { type: String },
  },
  ip: { type: String },
  userAgent: { type: String },
  sessionId: { type: String },
  requestId: { type: String },
  tags: [{ type: String }],
  error: {
    message: { type: String },
    stack: { type: String },
    code: { type: String },
  },
  details: { type: Schema.Types.Mixed },
  context: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const AuditLogMongo = mongoose.model<IAuditLogMongo>(
  'AuditLog',
  AuditLogSchema
);
export default AuditLogMongo;
