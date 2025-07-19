import 'reflect-metadata';
import { NotificationService } from '../../../services/notification/NotificationService';
import { FakeNotificationProvider } from '../../mocks/notification/FakeNotificationProvider';
import { INotificationProvider, NotificationPayload } from '../../../services/notification/INotificationProvider';

describe('NotificationService Unit Tests', () => {
  let notificationService: NotificationService;
  let fakeNotificationProvider: INotificationProvider;

  beforeEach(() => {
    fakeNotificationProvider = new FakeNotificationProvider();
    notificationService = new NotificationService(fakeNotificationProvider);
  });

  it('should send email notification', async () => {
    const payload: NotificationPayload = {
      to: 'test@example.com',
      subject: 'Test',
      message: 'Hello',
      channel: 'email'
    };
    await expect(notificationService.send(payload)).resolves.toBeUndefined();
    expect((fakeNotificationProvider as any).sent.length).toBe(1);
    expect((fakeNotificationProvider as any).sent[0].to).toBe('test@example.com');
  });

  it('should throw for unsupported channel', async () => {
    const payload: NotificationPayload = {
      to: 'test@example.com',
      message: 'Hello',
      channel: 'sms'
    };
    await expect(notificationService.send(payload)).rejects.toThrow();
  });
}); 