import { NotificationChannel } from './NotificationChannel';
import { NotificationPayload } from './NotificationPayload';

export interface INotificationChannelRegistry {
  // Kanal kaydetme
  registerChannel(channel: NotificationChannel): void;

  // Kanal kaldırma
  unregisterChannel(channelType: string): void;

  // Belirli bir kanalı alma
  getChannel(channelType: string): NotificationChannel | null;

  // Tüm kanalları alma
  getAllChannels(): NotificationChannel[];

  // Desteklenen kanal tiplerini alma
  getSupportedChannelTypes(): string[];

  // Belirli bir kanalın desteklenip desteklenmediğini kontrol etme
  isChannelSupported(channelType: string): boolean;

  // Belirli bir kanala mesaj gönderme
  sendToChannel(
    channelType: string,
    payload: NotificationPayload
  ): Promise<void>;
}
