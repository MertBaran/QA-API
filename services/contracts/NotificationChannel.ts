import { NotificationPayload } from './NotificationPayload';

export abstract class NotificationChannel {
  abstract readonly type: string;
  abstract displayName(): string;
  abstract send(payload: NotificationPayload): Promise<void>;

  isType(type: string): boolean {
    return this.type === type;
  }
}
