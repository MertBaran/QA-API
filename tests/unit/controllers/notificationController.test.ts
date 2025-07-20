import 'reflect-metadata';
import { NotificationController } from '../../../controllers/notificationController';
import { INotificationService } from '../../../services/contracts/INotificationService';
import { Request, Response } from 'express';
import { NotificationConstants } from '../../../controllers/constants/ControllerMessages';

describe('NotificationController Unit Tests', () => {
  let notificationController: NotificationController;
  let fakeNotificationService: INotificationService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: {},
      body: {},
      locale: 'tr',
    } as any;

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    fakeNotificationService = {
      notify: jest.fn(),
      notifyToMultipleChannels: jest.fn(),
      notifyUser: jest.fn(),
      getUserNotificationPreferences: jest.fn(),
      updateUserNotificationPreferences: jest.fn(),
    } as any;

    notificationController = new NotificationController(
      fakeNotificationService
    );
  });

  describe('sendNotificationToUser()', () => {
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
        mockResponse as Response
      );

      expect(fakeNotificationService.notifyUser).toHaveBeenCalledWith('123', {
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: NotificationConstants.NotificationSentSuccess.tr,
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
        mockResponse as Response
      );

      expect(fakeNotificationService.notifyUser).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.UserIdRequired.tr,
      });
    });

    it('should handle notification service error', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      const error = new Error('User not found');
      (fakeNotificationService.notifyUser as jest.Mock).mockRejectedValue(
        error
      );

      await notificationController.sendNotificationToUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.NotificationSendError.tr,
        error: 'User not found',
      });
    });

    it('should handle unknown error', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      const error = 'Unknown error';
      (fakeNotificationService.notifyUser as jest.Mock).mockRejectedValue(
        error
      );

      await notificationController.sendNotificationToUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.NotificationSendError.tr,
        error: NotificationConstants.UnknownError.tr,
      });
    });

    it('should use default locale when not provided', async () => {
      mockRequest.locale = undefined;
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await notificationController.sendNotificationToUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: NotificationConstants.NotificationSentSuccess.tr, // default tr
      });
    });
  });

  describe('sendNotificationToChannels()', () => {
    it('should send notification to multiple channels successfully', async () => {
      mockRequest.body = {
        channels: ['email', 'sms'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
        priority: 'high',
      };

      await notificationController.sendNotificationToChannels(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.notifyToMultipleChannels
      ).toHaveBeenCalledWith({
        channels: ['email', 'sms'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
        priority: 'high',
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: NotificationConstants.NotificationsSentSuccess.tr,
      });
    });

    it('should handle notification service error', async () => {
      mockRequest.body = {
        channels: ['email'],
        to: 'test@example.com',
        message: 'Test message',
      };

      const error = new Error('Channel not supported');
      (
        fakeNotificationService.notifyToMultipleChannels as jest.Mock
      ).mockRejectedValue(error);

      await notificationController.sendNotificationToChannels(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.NotificationsSendError.tr,
        error: 'Channel not supported',
      });
    });

    it('should handle empty channels array', async () => {
      mockRequest.body = {
        channels: [],
        to: 'test@example.com',
        message: 'Test message',
      };

      await notificationController.sendNotificationToChannels(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.notifyToMultipleChannels
      ).toHaveBeenCalledWith({
        channels: [],
        to: 'test@example.com',
        message: 'Test message',
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should handle missing optional fields', async () => {
      mockRequest.body = {
        channels: ['email'],
        to: 'test@example.com',
        message: 'Test message',
      };

      await notificationController.sendNotificationToChannels(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.notifyToMultipleChannels
      ).toHaveBeenCalledWith({
        channels: ['email'],
        to: 'test@example.com',
        message: 'Test message',
      });
    });
  });

  describe('getUserNotificationPreferences()', () => {
    it('should return user notification preferences successfully', async () => {
      mockRequest.params = { userId: '123' };

      const mockPreferences = {
        userId: '123',
        email: true,
        sms: false,
        push: true,
        webhook: false,
        emailAddress: 'user@example.com',
        phoneNumber: '+1234567890',
        webhookUrl: 'https://webhook.example.com',
      };

      (
        fakeNotificationService.getUserNotificationPreferences as jest.Mock
      ).mockResolvedValue(mockPreferences);

      await notificationController.getUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.getUserNotificationPreferences
      ).toHaveBeenCalledWith('123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockPreferences,
      });
    });

    it('should handle service error', async () => {
      mockRequest.params = { userId: '123' };

      const error = new Error('User not found');
      (
        fakeNotificationService.getUserNotificationPreferences as jest.Mock
      ).mockRejectedValue(error);

      await notificationController.getUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.PreferencesGetError.tr,
        error: 'User not found',
      });
    });

    it('should return error when userId is missing', async () => {
      mockRequest.params = {};

      await notificationController.getUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.getUserNotificationPreferences
      ).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.UserIdRequired.tr,
      });
    });
  });

  describe('updateUserNotificationPreferences()', () => {
    it('should update user notification preferences successfully', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        email: false,
        sms: true,
        push: false,
        webhook: true,
      };

      await notificationController.updateUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.updateUserNotificationPreferences
      ).toHaveBeenCalledWith('123', {
        email: false,
        sms: true,
        push: false,
        webhook: true,
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: NotificationConstants.PreferencesUpdateSuccess.tr,
      });
    });

    it('should handle service error', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        email: false,
      };

      const error = new Error('Update failed');
      (
        fakeNotificationService.updateUserNotificationPreferences as jest.Mock
      ).mockRejectedValue(error);

      await notificationController.updateUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.PreferencesUpdateError.tr,
        error: 'Update failed',
      });
    });

    it('should return error when userId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = {
        email: false,
      };

      await notificationController.updateUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.updateUserNotificationPreferences
      ).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.UserIdRequired.tr,
      });
    });

    it('should handle partial preferences update', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        email: false, // sadece email güncelle
      };

      await notificationController.updateUserNotificationPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        fakeNotificationService.updateUserNotificationPreferences
      ).toHaveBeenCalledWith('123', {
        email: false,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle different error types', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      // String error
      (fakeNotificationService.notifyUser as jest.Mock).mockRejectedValue(
        'String error'
      );

      await notificationController.sendNotificationToUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.NotificationSendError.tr,
        error: NotificationConstants.UnknownError.tr,
      });
    });

    it('should handle null error', async () => {
      mockRequest.params = { userId: '123' };
      mockRequest.body = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      (fakeNotificationService.notifyUser as jest.Mock).mockRejectedValue(null);

      await notificationController.sendNotificationToUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: NotificationConstants.NotificationSendError.tr,
        error: NotificationConstants.UnknownError.tr,
      });
    });
  });
});
