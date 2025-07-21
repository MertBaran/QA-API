import mongoose, { Schema, Document } from 'mongoose';
import { L10n } from '../../types/i18n';

export interface NotificationTemplateDocument extends Document {
  // Template Bilgileri
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  category: 'system' | 'marketing' | 'security' | 'notification';

  // İçerik (Çok Dilli)
  subject: L10n;
  message: L10n;
  html?: L10n;

  // Template Variables
  variables: string[];

  // Ayarlar
  isActive: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';

  // Metadata
  description?: L10n;
  tags: string[];

  // Zaman
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<NotificationTemplateDocument>({
  // Template Bilgileri
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'webhook'],
    required: true,
  },
  category: {
    type: String,
    enum: ['system', 'marketing', 'security', 'notification'],
    required: true,
  },

  // İçerik (Çok Dilli)
  subject: {
    en: { type: String, required: true },
    tr: { type: String, required: true },
    de: { type: String, required: true },
  },
  message: {
    en: { type: String, required: true },
    tr: { type: String, required: true },
    de: { type: String, required: true },
  },
  html: {
    en: { type: String },
    tr: { type: String },
    de: { type: String },
  },

  // Template Variables
  variables: [
    {
      type: String,
    },
  ],

  // Ayarlar
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal',
  },

  // Metadata
  description: {
    en: { type: String },
    tr: { type: String },
    de: { type: String },
  },
  tags: [
    {
      type: String,
    },
  ],

  // Zaman
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index'ler - name zaten unique olduğu için tekrar index oluşturmaya gerek yok
NotificationTemplateSchema.index({ type: 1, category: 1 });
NotificationTemplateSchema.index({ isActive: 1, type: 1 });

// updatedAt'i otomatik güncelle
NotificationTemplateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<NotificationTemplateDocument>(
  'NotificationTemplate',
  NotificationTemplateSchema
);
