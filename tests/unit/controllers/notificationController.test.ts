import { Request, Response } from 'express';
import { NotificationController } from '../../../controllers/notificationController';
import { INotificationService } from '../../../services/contracts/INotificationService';
import { NotificationConstants } from '../../../controllers/constants/ControllerMessages';
import { HelperMessages } from '../../../helpers/constants/HelperMessages';
import { UserNotificationPreferences } from '../../../services/contracts/NotificationPayload';

// Mock dependencies
const mockNotificationService: jest.Mocked<INotificationService> = {
  notifyUser: jest.fn(),
  notifyToMultipleChannels: jest.fn(),
  getUserNotificationPreferences: jest.fn(),
  updateUserNotificationPreferences: jest.fn(),
  notify: jest.fn(),
  getUserNotifications: jest.fn(),
  getNotificationStats: jest.fn(),
  notifyUserWithTemplate: jest.fn(),
};

describe('NotificationController', () => {
  let notificationController: NotificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    notificationController = new NotificationController(
      mockNotificationService
    );

    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockRequest = {
      params: {},
      body: {},
      locale: 'tr',
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('sendNotificationToUser', () => {
    it('should send notification to user successfully', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      };

      await notificationController.sendNotificationToUser(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockNotificationService.notifyUser).toHaveBeenCalledWith('123', {
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    });

    it('should return error when userId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await notificationController.sendNotificationToUser(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockNotificationService.notifyUser).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: HelperMessages.UserIdRequired,
      });
    });
  });

  describe('sendNotificationToChannels', () => {
    it('should send notification to channels successfully', async () => {
      mockRequest.body = {
        channels: ['email', 'sms'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
        priority: 1,
      };

      await notificationController.sendNotificationToChannels(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.notifyToMultipleChannels
      ).toHaveBeenCalledWith({
        channels: ['email', 'sms'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
        priority: 1,
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    });
  });

  describe('getUserNotificationPreferences', () => {
    it('should get user notification preferences successfully', async () => {
      const mockPreferences: UserNotificationPreferences = {
        userId: '123',
        email: true,
        push: false,
        sms: true,
        webhook: false,
      };

      mockRequest.params = { userId: '123' };
      (
        mockNotificationService.getUserNotificationPreferences as jest.Mock
      ).mockResolvedValue(mockPreferences);

      await notificationController.getUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.getUserNotificationPreferences
      ).toHaveBeenCalledWith('123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockPreferences,
      });
    });

    it('should return error when userId is missing', async () => {
      mockRequest.params = {};

      await notificationController.getUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.getUserNotificationPreferences
      ).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: HelperMessages.UserIdRequired,
      });
    });
  });

  describe('updateUserNotificationPreferences', () => {
    it('should update user notification preferences successfully', async () => {
      const preferences: Partial<UserNotificationPreferences> = {
        email: true,
        push: false,
      };

      mockRequest.params = { userId: '123' };
      mockRequest.body = preferences;

      await notificationController.updateUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.updateUserNotificationPreferences
      ).toHaveBeenCalledWith('123', preferences);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    });

    it('should return error when userId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { email: true };

      await notificationController.updateUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.updateUserNotificationPreferences
      ).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: HelperMessages.UserIdRequired,
      });
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification successfully', async () => {
      mockRequest.params = { userId: '123' };

      await notificationController.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockNotificationService.notifyUser).toHaveBeenCalledWith('123', {
        subject: 'Test Notification',
        message: 'This is a test notification',
        html: '<h1>Test Notification</h1><p>This is a test notification</p>',
        data: expect.objectContaining({
          test: true,
          timestamp: expect.any(String),
        }),
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: HelperMessages.NotificationSentSuccess,
      });
    });

    it('should return error when userId is missing', async () => {
      mockRequest.params = {};

      await notificationController.sendTestNotification(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockNotificationService.notifyUser).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: HelperMessages.UserIdRequired,
      });
    });
  });

  describe('sendTemplateNotification', () => {
    it('should send template notification successfully', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        templateName: 'password-reset',
        locale: 'tr',
        variables: {
          userName: 'Test User',
          resetLink: 'https://example.com/reset',
        },
      };

      await notificationController.sendTemplateNotification(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.notifyUserWithTemplate
      ).toHaveBeenCalledWith('123', 'password-reset', 'tr', {
        userName: 'Test User',
        resetLink: 'https://example.com/reset',
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: HelperMessages.TemplateNotificationSentSuccess,
      });
    });

    it('should return error when userId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = {
        templateName: 'password-reset',
        locale: 'tr',
        variables: { userName: 'Test User' },
      };

      await notificationController.sendTemplateNotification(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.notifyUserWithTemplate
      ).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: HelperMessages.UserIdRequired,
      });
    });

    it('should return error when templateName is missing', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        locale: 'tr',
        variables: { userName: 'Test User' },
      };

      await notificationController.sendTemplateNotification(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(
        mockNotificationService.notifyUserWithTemplate
      ).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: HelperMessages.TemplateNameRequired,
      });
    });
  });

  describe('getQueueStatus', () => {
    it('should get queue status successfully when queue-based system is active', async () => {
      const mockQueueStatus = {
        messageCount: 5,
        consumerCount: 1,
        deadLetterCount: 0,
      };

      // Mock getQueueStatus method
      mockNotificationService.getQueueStatus = jest
        .fn()
        .mockResolvedValue(mockQueueStatus);

      await notificationController.getQueueStatus(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockQueueStatus,
      });
    });

    it('should return error when queue-based system is not active', async () => {
      // Mock getQueueStatus to return undefined (not implemented)
      mockNotificationService.getQueueStatus = undefined;

      await notificationController.getQueueStatus(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Queue status not available',
        error: 'getQueueStatus method not implemented',
      });
    });
  });
});
