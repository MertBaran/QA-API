import 'reflect-metadata';

import { setI18nCacheProvider, clearI18nCache } from '../../../types/i18n';
import { FakeCacheProvider } from '../../mocks/cache/FakeCacheProvider';

// Mock sendJwtToClient helper BEFORE importing the modules that use it
jest.mock('../../../helpers/authorization/tokenHelpers', () => ({
  sendJwtToClient: jest.fn(),
}));

import { AuthController } from '../../../controllers/authController';
import { AuthManager } from '../../../services/managers/AuthManager';
import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';
import jwt from 'jsonwebtoken';

import { sendJwtToClient } from '../../../helpers/authorization/tokenHelpers';

const mockSendJwtToClient = sendJwtToClient as jest.MockedFunction<
  typeof sendJwtToClient
>;
const mockGenerateJWTFromUser = jest.fn(() => 'jwt-token');
(AuthManager as any).generateJWTFromUser = mockGenerateJWTFromUser;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthManager>;
  let logger: jest.Mocked<ILoggerProvider>;

  let fakeCacheProvider: FakeCacheProvider;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(async () => {
    // Setup fake cache provider for i18n
    fakeCacheProvider = new FakeCacheProvider();
    setI18nCacheProvider(fakeCacheProvider);
    await clearI18nCache();

    authService = {
      googleLogin: jest.fn(),
      registerUser: jest.fn(),
      loginUser: jest.fn(),
      updateProfileImage: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    } as any;

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    controller = new AuthController(authService, logger);

    req = {
      body: {},
      user: { id: 'u1', name: 'Test' },
      savedProfileImage: 'img.png',
      ip: '127.0.0.1',
      headers: {},
      locale: 'en',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
    mockSendJwtToClient.mockClear();
    mockGenerateJWTFromUser.mockClear();
  });

  describe('register', () => {
    it('should register user and send JWT with correct language', async () => {
      authService.registerUser.mockResolvedValue({
        _id: 'u1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        password: '',
        profile_image: '',
        blocked: false,
      });

      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
        role: 'user',
      };
      req.headers['accept-language'] = 'tr';

      await controller.register(req, res, next);

      expect(authService.registerUser).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
        role: 'user',
      });

      expect(mockGenerateJWTFromUser).toHaveBeenCalledWith({
        id: 'u1',
        name: 'Test User',
        lang: 'tr',
      });

      expect(mockSendJwtToClient).toHaveBeenCalled();
    });

    it('should handle German language in registration', async () => {
      authService.registerUser.mockResolvedValue({
        _id: 'u1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        password: '',
        profile_image: '',
        blocked: false,
      });

      req.body = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
        role: 'user',
      };
      req.headers['accept-language'] = 'de';

      await controller.register(req, res, next);

      expect(mockGenerateJWTFromUser).toHaveBeenCalledWith({
        id: 'u1',
        name: 'Test User',
        lang: 'de',
      });
    });
  });

  describe('login', () => {
    it('should login user with correct language', async () => {
      authService.loginUser.mockResolvedValue({
        _id: 'u1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        password: '',
        profile_image: '',
        blocked: false,
      });

      req.body = { email: 'test@example.com', password: 'password' };
      req.headers['accept-language'] = 'tr';

      await controller.login(req, res, next);

      expect(authService.loginUser).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      );

      expect(mockGenerateJWTFromUser).toHaveBeenCalledWith({
        id: 'u1',
        name: 'Test User',
        lang: 'tr',
      });

      expect(logger.info).toHaveBeenCalledWith('User logged in', {
        userId: 'u1',
        email: 'test@example.com',
        ip: '127.0.0.1',
        context: 'AuthController',
      });
    });
  });

  describe('logout', () => {
    it('should logout with English message', async () => {
      req.locale = 'en';
      req.cookies = { access_token: 'valid-token' };
      // Mock JWT verify
      jest
        .spyOn(jwt, 'verify')
        .mockReturnValue({ id: 'u1', name: 'Test User' } as any);

      await controller.logout(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'none',
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout success',
      });
    });

    it('should logout with Turkish message', async () => {
      req.locale = 'tr';
      req.cookies = { access_token: 'valid-token' };
      jest
        .spyOn(jwt, 'verify')
        .mockReturnValue({ id: 'u1', name: 'Test User' } as any);

      await controller.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Çıkış başarılı',
      });
    });

    it('should logout with German message', async () => {
      req.locale = 'de';
      req.cookies = { access_token: 'valid-token' };
      jest
        .spyOn(jwt, 'verify')
        .mockReturnValue({ id: 'u1', name: 'Test User' } as any);

      await controller.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Abmeldung erfolgreich',
      });
    });

    it('should default to English when locale is undefined', async () => {
      req.locale = undefined;
      req.cookies = { access_token: 'valid-token' };
      jest
        .spyOn(jwt, 'verify')
        .mockReturnValue({ id: 'u1', name: 'Test User' } as any);

      await controller.logout(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout success',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password response with Turkish message', async () => {
      authService.forgotPassword.mockResolvedValue();
      req.body = { email: 'test@example.com' };
      req.locale = 'tr';

      await controller.forgotpassword(req, res, next);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'test@example.com',
        'tr'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
      });
    });

    it('should send forgot password response with German message', async () => {
      authService.forgotPassword.mockResolvedValue();
      req.body = { email: 'test@example.com' };
      req.locale = 'de';

      await controller.forgotpassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Reset password token sent to email',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with success message in Turkish', async () => {
      authService.resetPassword.mockResolvedValue();
      req.body = { token: 'reset-token', newPassword: 'newpassword' };
      req.locale = 'tr';

      await controller.resetPassword(req, res, next);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'reset-token',
        'newpassword'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Şifre başarıyla sıfırlandı',
      });
    });

    it('should reset password with success message in German', async () => {
      authService.resetPassword.mockResolvedValue();
      req.body = { token: 'reset-token', newPassword: 'newpassword' };
      req.locale = 'de';

      await controller.resetPassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Passwort erfolgreich zurückgesetzt',
      });
    });
  });

  describe('getUser', () => {
    it('should return user data', async () => {
      await controller.getUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'u1',
          name: 'Test',
        },
      });
    });
  });

  describe('imageUpload', () => {
    it('should upload image successfully', async () => {
      const updatedUser = {
        _id: 'u1',
        name: 'Test',
        profile_image: 'new-image.png',
        email: 'test@example.com',
        role: 'user' as const,
        password: '',
        blocked: false,
      };

      authService.updateProfileImage.mockResolvedValue(updatedUser);

      await controller.imageUpload(req, res, next);

      expect(authService.updateProfileImage).toHaveBeenCalledWith(
        'u1',
        'img.png'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Image uploaded successfully',
        data: updatedUser,
      });
    });
  });

  describe('googleLogin', () => {
    it('should handle Google login with language detection', async () => {
      authService.googleLogin.mockResolvedValue({
        _id: 'u1',
        name: 'Google User',
        email: 'google@example.com',
        role: 'user',
        password: '',
        profile_image: '',
        blocked: false,
      });

      req.body = { token: 'google-token' };
      req.headers['accept-language'] = 'de-DE,de;q=0.9,en;q=0.8';

      await controller.googleLogin(req, res, next);

      expect(authService.googleLogin).toHaveBeenCalledWith('google-token');
      expect(mockGenerateJWTFromUser).toHaveBeenCalledWith({
        id: 'u1',
        name: 'Google User',
        lang: 'de',
      });
    });
  });
});
