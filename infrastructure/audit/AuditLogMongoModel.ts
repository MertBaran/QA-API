import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLogMongo extends Document {
  action: string;
  details: Record<string, any>;
  context?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogMongo>({
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed, required: true },
  context: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const AuditLogMongo = mongoose.model<IAuditLogMongo>('AuditLog', AuditLogSchema);
export default AuditLogMongo; 