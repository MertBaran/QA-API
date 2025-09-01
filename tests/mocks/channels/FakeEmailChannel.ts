import { NotificationChannel } from '../../../services/contracts/NotificationChannel';
import { NotificationPayload } from '../../../services/contracts/NotificationPayload';

export class FakeEmailChannel extends NotificationChannel {
  readonly type = 'email';

  displayName() {
    return 'Fake Email';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Mock implementation for testing
    console.log(`Fake Email sent to ${payload.to}: ${payload.message}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
