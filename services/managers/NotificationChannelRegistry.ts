import { injectable } from 'tsyringe';
import { INotificationChannelRegistry } from '../contracts/INotificationChannelRegistry';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';

@injectable()
export class NotificationChannelRegistry
  implements INotificationChannelRegistry
{
  private channels: Map<string, NotificationChannel> = new Map();

  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.type, channel);
  }

  unregisterChannel(channelType: string): void {
    this.channels.delete(channelType);
  }

  getChannel(channelType: string): NotificationChannel | null {
    return this.channels.get(channelType) || null;
  }

  getAllChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  getSupportedChannelTypes(): string[] {
    return Array.from(this.channels.keys());
  }

  isChannelSupported(channelType: string): boolean {
    return this.channels.has(channelType);
  }

  async sendToChannel(
    channelType: string,
    payload: NotificationPayload
  ): Promise<void> {
    const channel = this.getChannel(channelType);
    if (!channel) {
      throw new Error(
        `Notification channel '${channelType}' is not registered.`
      );
    }

    await channel.send(payload);
  }
}
