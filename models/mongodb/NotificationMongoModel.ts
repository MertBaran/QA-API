import mongoose, { Schema, Document } from 'mongoose';

export interface NotificationDocument extends Document {
  // Temel Bilgiler
  userId: mongoose.Types.ObjectId;
  type: 'email' | 'sms' | 'push' | 'webhook';
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';

  // İçerik
  subject: string;
  message: string;
  html?: string;
  data?: Record<string, any>;

  // Gönderim Bilgileri
  from: string;
  to: string;

  // Zaman Bilgileri
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;

  // Sistem Bilgileri
  strategy: 'direct' | 'queue';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;

  // Hata Bilgileri
  errorMessage?: string;
  errorCode?: string;

  // Metadata
  messageId?: string;
  externalId?: string;
  tags: string[];

  // Template bilgisi (opsiyonel)
  templateId?: mongoose.Types.ObjectId;
  templateName?: string;
}

const NotificationSchema = new Schema<NotificationDocument>({
  // Temel Bilgiler
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'webhook'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
    default: 'pending',
    index: true,
  },

  // İçerik
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  html: {
    type: String,
  },
  data: {
    type: Schema.Types.Mixed,
  },

  // Gönderim Bilgileri
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },

  // Zaman Bilgileri
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  sentAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  readAt: {
    type: Date,
  },

  // Sistem Bilgileri
  strategy: {
    type: String,
    enum: ['direct', 'queue'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal',
    index: true,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },

  // Hata Bilgileri
  errorMessage: {
    type: String,
  },
  errorCode: {
    type: String,
  },

  // Metadata
  messageId: {
    type: String,
  },
  externalId: {
    type: String,
  },
  tags: [
    {
      type: String,
    },
  ],

  // Template bilgisi
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'NotificationTemplate',
  },
  templateName: {
    type: String,
  },
});

// Index'ler
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ priority: 1, createdAt: -1 });

export default mongoose.model<NotificationDocument>(
  'Notification',
  NotificationSchema
);
