import 'reflect-metadata';
import { NotificationManager } from '../../../services/managers/NotificationManager';
import { FakeNotificationProvider } from '../../mocks/notification/FakeNotificationProvider';
import { INotificationProvider } from '../../../services/notification/INotificationProvider';
import { NotificationPayload } from '../../../services/contracts/NotificationPayload';

describe('NotificationManager Unit Tests', () => {
  let notificationManager: NotificationManager;
  let fakeNotificationProvider: INotificationProvider;

  beforeEach(() => {
    fakeNotificationProvider = new FakeNotificationProvider();
    notificationManager = new NotificationManager(
      fakeNotificationProvider as any
    );
  });

  it('should send email notification', async () => {
    const payload: NotificationPayload = {
      to: 'test@example.com',
      subject: 'Test',
      message: 'Hello',
      channel: 'email',
    };
    await expect(notificationManager.notify(payload)).resolves.toBeUndefined();
    expect((fakeNotificationProvider as any).sent.length).toBe(1);
    expect((fakeNotificationProvider as any).sent[0].to).toBe(
      'test@example.com'
    );
  });

  it('should throw for unsupported channel', async () => {
    const payload: NotificationPayload = {
      to: 'test@example.com',
      message: 'Hello',
      channel: 'sms',
    };
    await expect(notificationManager.notify(payload)).rejects.toThrow();
  });
});
