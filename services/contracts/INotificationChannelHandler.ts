import { NotificationPayload } from "./NotificationPayload";

export interface INotificationChannelHandler {
  canHandle(channel: string): boolean;
  send(payload: NotificationPayload): Promise<void>;
  configure?(options: any): void;
  isAvailable?(): boolean;
  getChannelName?(): string;
  // addRecipient?(): void;
  // removeRecipient?(): void;
  // logNotification?(): void;
} 