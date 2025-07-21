import {
  NotificationPayload,
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from './NotificationPayload';

export interface INotificationService {
  notify(payload: NotificationPayload): Promise<void>;

  // Multi-channel notification için yeni metodlar
  notifyToMultipleChannels(
    payload: MultiChannelNotificationPayload
  ): Promise<void>;

  // Kullanıcının aktif kanallarına bildirim gönderme
  notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void>;

  // Kullanıcı bildirim tercihlerini alma
  getUserNotificationPreferences(
    userId: string
  ): Promise<UserNotificationPreferences>;

  // Kullanıcı bildirim tercihlerini güncelleme
  updateUserNotificationPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void>;

  // Queue durumunu kontrol etme (opsiyonel)
  getQueueStatus?(): Promise<{
    messageCount: number;
    consumerCount: number;
    deadLetterCount: number;
  }>;

  // Database operations
  getUserNotifications(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<any[]>;
  getNotificationStats(userId?: string): Promise<any>;

  // Template-based notification
  notifyUserWithTemplate(
    userId: string,
    templateName: string,
    locale: string,
    variables: Record<string, any>
  ): Promise<void>;
}
