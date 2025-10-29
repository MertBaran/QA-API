import { Request, Response } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { INotificationService } from '../services/contracts/INotificationService';
import {
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from '../services/contracts/NotificationPayload';
import { HelperMessages } from '../constants/HelperMessages';
// SupportedLanguage kullanılmıyor, kaldırıldı

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
  locale?: any;
}

@injectable()
export class NotificationController {
  constructor(
    @inject('INotificationService')
    private notificationService: INotificationService
  ) {}

  // Queue durumunu kontrol et
  getQueueStatus = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
      if (!this.notificationService.getQueueStatus) {
        res.status(400).json({
          success: false,
          message: 'Queue status not available',
          error: 'getQueueStatus method not implemented',
        });
        return;
      }

      const status = await this.notificationService.getQueueStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    }
  );

  // Kullanıcının tüm aktif kanallarına bildirim gönderme
  sendNotificationToUser = asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { userId } = req.params;
      const { subject, message, html, data } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: HelperMessages.UserIdRequired,
        });
        return;
      }

      await this.notificationService.notifyUser(userId, {
        subject,
        message,
        html,
        data,
      });

      res.status(200).json({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    }
  );

  // Belirli kanallara bildirim gönderme
  sendNotificationToChannels = asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { channels, to, subject, message, html, data, priority } = req.body;

      const payload: MultiChannelNotificationPayload = {
        channels,
        to,
        subject,
        message,
        html,
        data,
        priority,
      };

      await this.notificationService.notifyToMultipleChannels(payload);

      res.status(200).json({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    }
  );

  // Kullanıcının bildirim tercihlerini alma
  getUserNotificationPreferences = asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: HelperMessages.UserIdRequired,
        });
        return;
      }

      const preferences =
        await this.notificationService.getUserNotificationPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    }
  );

  // Kullanıcının bildirim tercihlerini güncelleme
  updateUserNotificationPreferences = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const preferences: Partial<UserNotificationPreferences> = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: HelperMessages.UserIdRequired,
        });
        return;
      }

      await this.notificationService.updateUserNotificationPreferences(
        userId,
        preferences
      );

      res.status(200).json({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    }
  );

  // Template bildirimi gönderme
  sendTemplateNotification = asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { userId } = req.params;
      const { templateName, locale, variables } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: HelperMessages.UserIdRequired,
        });
        return;
      }

      if (!templateName) {
        res.status(400).json({
          success: false,
          message: HelperMessages.TemplateNameRequired,
        });
        return;
      }

      const userLocale = locale || req.locale || 'en';

      await this.notificationService.notifyUserWithTemplate(
        userId,
        templateName,
        userLocale,
        variables || {}
      );

      res.status(200).json({
        success: true,
        message: HelperMessages.TemplateNotificationSentSuccess,
      });
    }
  );

  // Test amaçlı - tüm kanallara bildirim gönderme
  sendTestNotification = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: HelperMessages.UserIdRequired,
        });
        return;
      }

      await this.notificationService.notifyUser(userId, {
        subject: 'Test Notification',
        message: 'This is a test notification',
        html: '<h1>Test Notification</h1><p>This is a test notification</p>',
        data: { test: true, timestamp: new Date().toISOString() },
      });

      res.status(200).json({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    }
  );

  // Debug endpoint - notification'ları kontrol et
  debugNotifications = asyncErrorWrapper(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: HelperMessages.UserIdRequired,
        });
        return;
      }

      const notifications = await this.notificationService.getUserNotifications(
        userId,
        10,
        0
      );
      const stats = await this.notificationService.getNotificationStats(userId);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          stats,
          userId,
        },
        message: 'Debug information retrieved',
      });
    }
  );

  // Kullanıcının bildirimlerini getir
  getUserNotifications = asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: HelperMessages.UserIdRequired,
        });
        return;
      }

      const notifications = await this.notificationService.getUserNotifications(
        userId,
        Number(limit),
        Number(offset)
      );

      res.status(200).json({
        success: true,
        data: notifications,
        message: HelperMessages.NotificationsRetrievedSuccess,
      });
    }
  );

  // Bildirim istatistiklerini getir
  getNotificationStats = asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { userId } = req.query;

      const stats = await this.notificationService.getNotificationStats(
        userId as string
      );

      res.status(200).json({
        success: true,
        data: stats,
        message: HelperMessages.StatsRetrievedSuccess,
      });
    }
  );
}
