// ObjectId kullanılmıyor, kaldırıldı
import { L10n } from '../../types/i18n';

export interface INotificationTemplateModel {
  _id?: any;

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
