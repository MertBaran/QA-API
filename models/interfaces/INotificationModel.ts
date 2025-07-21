import { ObjectId } from 'bson';

export interface INotificationModel {
  _id?: any;

  // Temel Bilgiler
  userId: ObjectId;
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
  templateId?: ObjectId;
  templateName?: string;
}
