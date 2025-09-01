import { NotificationChannel } from '../../../services/contracts/NotificationChannel';
import { NotificationPayload } from '../../../services/contracts/NotificationPayload';

export class FakeWebhookChannel extends NotificationChannel {
  readonly type = 'webhook';

  displayName() {
    return 'Fake Webhook';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Mock implementation for testing
    console.log(`Fake Webhook sent to ${payload.to}: ${payload.message}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
