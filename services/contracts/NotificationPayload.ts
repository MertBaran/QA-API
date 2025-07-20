export type NotificationChannel = 'email' | 'push' | 'sms' | 'webhook';

export interface NotificationPayload {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  message: string;
  html?: string;
  data?: any;
}

// Multi-channel notification için yeni interface
export interface MultiChannelNotificationPayload {
  channels: NotificationChannel[];
  to: string;
  subject?: string;
  message: string;
  html?: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// Kullanıcı bildirim tercihleri
export interface UserNotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  webhook: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  webhookUrl?: string;
}
