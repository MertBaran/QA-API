import { NotificationChannel } from '../../../services/contracts/NotificationChannel';
import { NotificationPayload } from '../../../services/contracts/NotificationPayload';

export class FakeSMSChannel extends NotificationChannel {
  readonly type = 'sms';

  displayName() {
    return 'Fake SMS';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Mock implementation for testing
    console.log(`Fake SMS sent to ${payload.to}: ${payload.message}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
