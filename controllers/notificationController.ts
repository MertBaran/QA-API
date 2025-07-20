import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { INotificationService } from '../services/contracts/INotificationService';
import {
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from '../services/contracts/NotificationPayload';
import { NotificationConstants } from './constants/ControllerMessages';
import { getLocalizedNotificationMessage } from '../helpers/i18n/messageHelper';
import { SupportedLanguage } from '../constants/supportedLanguages';

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

  // Kullanıcının tüm aktif kanallarına bildirim gönderme
  async sendNotificationToUser(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { subject, message, html, data } = req.body;
      const userLanguage = (req.locale as SupportedLanguage) || 'tr';

      if (!userId) {
        res.status(400).json({
          success: false,
          message: getLocalizedNotificationMessage(
            NotificationConstants.UserIdRequired,
            userLanguage
          ),
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
        message: getLocalizedNotificationMessage(
          NotificationConstants.NotificationSentSuccess,
          userLanguage
        ),
      });
    } catch (error) {
      const userLanguage = (req.locale as SupportedLanguage) || 'tr';
      res.status(500).json({
        success: false,
        message: getLocalizedNotificationMessage(
          NotificationConstants.NotificationSendError,
          userLanguage
        ),
        error:
          error instanceof Error
            ? error.message
            : getLocalizedNotificationMessage(
                NotificationConstants.UnknownError,
                userLanguage
              ),
      });
    }
  }

  // Belirli kanallara bildirim gönderme
  async sendNotificationToChannels(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { channels, to, subject, message, html, data, priority } = req.body;
      const userLanguage = (req.locale as SupportedLanguage) || 'tr';

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
        message: getLocalizedNotificationMessage(
          NotificationConstants.NotificationsSentSuccess,
          userLanguage
        ),
      });
    } catch (error) {
      const userLanguage = (req.locale as SupportedLanguage) || 'tr';
      res.status(500).json({
        success: false,
        message: getLocalizedNotificationMessage(
          NotificationConstants.NotificationsSendError,
          userLanguage
        ),
        error:
          error instanceof Error
            ? error.message
            : getLocalizedNotificationMessage(
                NotificationConstants.UnknownError,
                userLanguage
              ),
      });
    }
  }

  // Kullanıcının bildirim tercihlerini alma
  async getUserNotificationPreferences(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const userLanguage = (req.locale as SupportedLanguage) || 'tr';

      if (!userId) {
        res.status(400).json({
          success: false,
          message: getLocalizedNotificationMessage(
            NotificationConstants.UserIdRequired,
            userLanguage
          ),
        });
        return;
      }

      const preferences =
        await this.notificationService.getUserNotificationPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      const userLanguage = (req.locale as SupportedLanguage) || 'tr';
      res.status(500).json({
        success: false,
        message: getLocalizedNotificationMessage(
          NotificationConstants.PreferencesGetError,
          userLanguage
        ),
        error:
          error instanceof Error
            ? error.message
            : getLocalizedNotificationMessage(
                NotificationConstants.UnknownError,
                userLanguage
              ),
      });
    }
  }

  // Kullanıcının bildirim tercihlerini güncelleme
  async updateUserNotificationPreferences(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const preferences = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: NotificationConstants.UserIdRequired.tr,
        });
        return;
      }

      await this.notificationService.updateUserNotificationPreferences(
        userId,
        preferences
      );

      res.status(200).json({
        success: true,
        message: NotificationConstants.PreferencesUpdateSuccess.tr,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: NotificationConstants.PreferencesUpdateError.tr,
        error:
          error instanceof Error
            ? error.message
            : NotificationConstants.UnknownError.tr,
      });
    }
  }

  // Test amaçlı - tüm kanallara bildirim gönderme
  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: NotificationConstants.UserIdRequired.tr,
        });
        return;
      }

      await this.notificationService.notifyUser(userId, {
        subject: 'Test Bildirimi',
        message:
          'Bu bir test bildirimidir. Tüm aktif kanallarınıza gönderildi.',
        html: '<h1>Test Bildirimi</h1><p>Bu bir test bildirimidir.</p>',
        data: { test: true, timestamp: new Date().toISOString() },
      });

      res.status(200).json({
        success: true,
        message: NotificationConstants.TestNotificationSentSuccess.tr,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: NotificationConstants.TestNotificationSendError.tr,
        error:
          error instanceof Error
            ? error.message
            : NotificationConstants.UnknownError.tr,
      });
    }
  }
}
