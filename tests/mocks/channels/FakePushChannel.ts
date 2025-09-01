import { NotificationChannel } from '../../../services/contracts/NotificationChannel';
import { NotificationPayload } from '../../../services/contracts/NotificationPayload';

export class FakePushChannel extends NotificationChannel {
  readonly type = 'push';

  displayName() {
    return 'Fake Push';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Mock implementation for testing
    console.log(`Fake Push sent to ${payload.to}: ${payload.message}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
