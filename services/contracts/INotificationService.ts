import { NotificationPayload } from './NotificationPayload';

export interface INotificationService {
  notify(payload: NotificationPayload): Promise<void>;
}
