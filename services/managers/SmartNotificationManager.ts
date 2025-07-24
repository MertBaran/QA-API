import { injectable, inject } from 'tsyringe';
import { INotificationService } from '../contracts/INotificationService';
import {
  INotificationStrategy,
  NotificationContext,
} from '../contracts/INotificationStrategy';
import { SystemMetricsCollector } from '../metrics/SystemMetricsCollector';
import { QueueBasedNotificationManager } from './QueueBasedNotificationManager';
import { MultiChannelNotificationManager } from './MultiChannelNotificationManager';
import {
  NotificationPayload,
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from '../contracts/NotificationPayload';
import { IUserService } from '../contracts/IUserService';
import { INotificationRepository } from '../../repositories/interfaces/INotificationRepository';
import { IEnvironmentProvider } from '../contracts/IEnvironmentProvider';
import { EntityId } from '../../types/database';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';

@injectable()
export class SmartNotificationManager implements INotificationService {
  private queueManager?: QueueBasedNotificationManager;
  private directManager?: MultiChannelNotificationManager;

  constructor(
    @inject('INotificationStrategy') private strategy: INotificationStrategy,
    @inject('SystemMetricsCollector')
    private metricsCollector: SystemMetricsCollector,
    @inject('IUserService') private userService: IUserService,
    @inject('INotificationRepository')
    private notificationRepository: INotificationRepository,
    @inject('IEnvironmentProvider')
    private environmentProvider: IEnvironmentProvider,
    @inject('ILoggerProvider') private logger: ILoggerProvider
  ) {
    // Lazy initialization - sadece gerektiğinde oluştur
  }

  private async getQueueManager(): Promise<QueueBasedNotificationManager> {
    if (!this.queueManager) {
      const { container } = await import('tsyringe');
      this.queueManager = container.resolve(QueueBasedNotificationManager);
    }
    return this.queueManager;
  }

  private async getDirectManager(): Promise<MultiChannelNotificationManager> {
    if (!this.directManager) {
      const { container } = await import('tsyringe');
      this.directManager = container.resolve(MultiChannelNotificationManager);
    }
    return this.directManager;
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const context = this.createDefaultContext(payload);
    const metrics = await this.metricsCollector.getMetrics();
    const strategy = this.strategy.getStrategy(context, metrics);

    // User ID'yi payload'dan veya context'ten al
    const userId = payload.userId || context.userId;

    // Önce veritabanına kaydet
    const notification = await this.notificationRepository.createNotification({
      userId: userId as any,
      type: payload.channel,
      status: 'pending',
      subject: payload.subject,
      message: payload.message,
      html: payload.html,
      from: (() => {
        const smtpUser =
          this.environmentProvider.getEnvironmentVariable('SMTP_USER');
        if (!smtpUser) {
          throw new Error('SMTP_USER environment variable is required');
        }

        return payload.from || smtpUser;
      })(),
      to: payload.to,
      strategy: strategy,
      priority: this.determinePriority(payload),
      tags: payload.tags || [],
    });

    try {
      if (strategy === 'queue') {
        const queueManager = await this.getQueueManager();
        await queueManager.notify(payload);
      } else {
        const directManager = await this.getDirectManager();
        await directManager.notify(payload);
      }

      // Başarılı gönderim sonrası status'u güncelle
      await this.notificationRepository.updateNotificationStatus(
        notification._id as string,
        'sent',
        { messageId: `msg_${Date.now()}` }
      );
    } catch (error) {
      // Hata durumunda status'u güncelle
      await this.notificationRepository.updateNotificationStatus(
        notification._id as string,
        'failed',
        {
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'SEND_FAILED',
        }
      );
      throw error;
    }
  }

  async notifyToMultipleChannels(
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    const context = this.createDefaultContext(payload);
    const metrics = await this.metricsCollector.getMetrics();
    const strategy = this.strategy.getStrategy(context, metrics);

    if (strategy === 'queue') {
      const queueManager = await this.getQueueManager();
      await queueManager.notifyToMultipleChannels(payload);
    } else {
      const directManager = await this.getDirectManager();
      await directManager.notifyToMultipleChannels(payload);
    }
  }

  async notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void> {
    const user = await this.userService.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // User type'ını belirle
    const userType = this.determineUserType(user);

    // Notification type ve priority'yi payload'dan çıkar
    const notificationType = this.determineNotificationType(payload);
    const priority = this.determinePriority(payload);

    const context = this.strategy.createContext(
      userId,
      userType,
      notificationType,
      priority
    );

    const metrics = await this.metricsCollector.getMetrics();
    const strategy = this.strategy.getStrategy(context, metrics);

    // Önce veritabanına kaydet
    const notification = await this.notificationRepository.createNotification({
      userId: userId as any,
      type: 'email', // Varsayılan olarak email
      status: 'pending',
      subject: payload.subject,
      message: payload.message,
      html: payload.html,
      from: (() => {
        const smtpUser =
          this.environmentProvider.getEnvironmentVariable('SMTP_USER');
        if (!smtpUser) {
          throw new Error('SMTP_USER environment variable is required');
        }

        return smtpUser;
      })(),
      to: user.email,
      strategy: strategy,
      priority: priority,
      tags: payload.data?.tags || [],
    });

    try {
      if (strategy === 'queue') {
        const queueManager = await this.getQueueManager();
        await queueManager.notifyUser(userId, payload);
      } else {
        const directManager = await this.getDirectManager();
        await directManager.notifyUser(userId, payload);
      }

      // Başarılı gönderim sonrası status'u güncelle
      await this.notificationRepository.updateNotificationStatus(
        notification._id as string,
        'sent',
        { messageId: `msg_${Date.now()}` }
      );
    } catch (error) {
      // Hata durumunda status'u güncelle
      await this.notificationRepository.updateNotificationStatus(
        notification._id as string,
        'failed',
        {
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'SEND_FAILED',
        }
      );
      throw error;
    }
  }

  async getUserNotificationPreferences(
    userId: string
  ): Promise<UserNotificationPreferences> {
    const queueManager = await this.getQueueManager();
    return queueManager.getUserNotificationPreferences(userId);
  }

  async updateUserNotificationPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    const queueManager = await this.getQueueManager();
    await queueManager.updateUserNotificationPreferences(userId, preferences);
  }

  private createDefaultContext(
    _payload: NotificationPayload | MultiChannelNotificationPayload
  ): NotificationContext {
    return this.strategy.createContext(
      'unknown',
      'standard',
      'NORMAL',
      'normal'
    );
  }

  private determineUserType(user: any): 'premium' | 'standard' | 'admin' {
    // User model'ine göre type belirle
    if (user.role === 'admin') return 'admin';
    if (user.isPremium || user.subscriptionType === 'premium') return 'premium';
    return 'standard';
  }

  private determineNotificationType(
    payload: any
  ): 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' {
    // Payload'dan notification type'ını belirle
    if (payload.data?.type === 'CRITICAL') return 'CRITICAL';
    if (payload.data?.type === 'HIGH') return 'HIGH';
    if (payload.data?.type === 'LOW') return 'LOW';
    return 'NORMAL';
  }

  private determinePriority(
    payload: any
  ): 'urgent' | 'high' | 'normal' | 'low' {
    // Payload'dan priority'yi belirle
    if (payload.data?.priority === 'urgent') return 'urgent';
    if (payload.data?.priority === 'high') return 'high';
    if (payload.data?.priority === 'low') return 'low';
    return 'normal';
  }

  // Queue status metodları
  async getQueueStatus() {
    const queueManager = await this.getQueueManager();
    return queueManager.getQueueStatus();
  }

  // Database operations
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      return await this.notificationRepository.getNotificationsByUserId(
        userId,
        limit,
        offset
      );
    } catch (error) {
      this.logger.error('Error getting user notifications', { error, userId });
      throw error;
    }
  }

  async getNotificationStats(userId?: string): Promise<any> {
    try {
      return await this.notificationRepository.getNotificationStats(userId);
    } catch (error) {
      this.logger.error('Error getting notification stats', { error, userId });
      throw error;
    }
  }

  async notifyUserWithTemplate(
    userId: string,
    templateName: string,
    locale: string,
    _variables: Record<string, any>
  ): Promise<void> {
    try {
      // Template'i veritabanından al
      const template =
        await this.notificationRepository.getTemplateByName(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      if (!template.isActive) {
        throw new Error(`Template '${templateName}' is not active`);
      }

      // Template içeriğini locale'e göre al
      const subject =
        template.subject[locale as keyof typeof template.subject] ||
        template.subject.en;
      const message =
        template.message[locale as keyof typeof template.message] ||
        template.message.en;
      const html =
        template.html?.[locale as keyof typeof template.html] ||
        template.html?.en;

      // Template variables'ları replace et
      let processedSubject = subject;
      let processedMessage = message;
      let processedHtml = html;

      for (const [key, value] of Object.entries(_variables)) {
        const placeholder = `{{${key}}}`;
        processedSubject = processedSubject.replace(
          new RegExp(placeholder, 'g'),
          String(value)
        );
        processedMessage = processedMessage.replace(
          new RegExp(placeholder, 'g'),
          String(value)
        );
        if (processedHtml) {
          processedHtml = processedHtml.replace(
            new RegExp(placeholder, 'g'),
            String(value)
          );
        }
      }

      // Kullanıcı bilgilerini al
      const user = await this.userService.findById(userId as any);
      if (!user) {
        throw new Error(`User '${userId}' not found`);
      }

      // Notification gönder
      await this.notifyUser(userId, {
        subject: processedSubject,
        message: processedMessage,
        html: processedHtml,
        data: _variables,
      });
    } catch (error) {
      this.logger.error('Template notification failed', {
        userId,
        templateName,
        locale,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
