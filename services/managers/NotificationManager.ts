import { NotificationPayload } from "../contracts/NotificationPayload";
import { NotificationChannel } from "../contracts/NotificationChannel";

export class NotificationManager {
  constructor(private channels: NotificationChannel[]) {}

  async notify(payload: NotificationPayload): Promise<void> {
    const channel = this.channels.find(c => c.isType(payload.channel));
    if (!channel) throw new Error(`No handler for channel: ${payload.channel}`);
    await channel.send(payload);
  }
} 