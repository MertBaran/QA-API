export type NotificationChannel = 'email' | 'push' | 'sms';

export interface NotificationPayload {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  message: string;
  html?: string;
  data?: any;
}
