export interface NotificationPayload {
  to: string;
  subject?: string;
  message: string;
  html?: string;
  channel?: 'email' | 'sms' | 'whatsapp';
  [key: string]: any;
}

export interface INotificationProvider {
  sendNotification(payload: NotificationPayload): Promise<void>;
}
