import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { sendJwtToClient } from '../helpers/authorization/tokenHelpers';
import { injectable, inject } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { IAuthService } from '../services/contracts/IAuthService';
import { IUserService } from '../services/contracts/IUserService';
import { IUserRoleService } from '../services/contracts/IUserRoleService';
import { IRoleService } from '../services/contracts/IRoleService';
import { IPermissionService } from '../services/contracts/IPermissionService';
import { AuthConstants } from './constants/ControllerMessages';
import { AuthManager } from '../services/managers/AuthManager';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import { IExceptionTracker } from '../infrastructure/error/IExceptionTracker';
import { ApplicationError } from '../helpers/error/ApplicationError';
import type { RegisterDTO } from '../types/dto/auth/register.dto';
import type { LoginDTO } from '../types/dto/auth/login.dto';
import type { ForgotPasswordDTO } from '../types/dto/auth/forgot-password.dto';
import type { ResetPasswordDTO } from '../types/dto/auth/reset-password.dto';
import type { EditProfileDTO } from '../types/dto/auth/edit-profile.dto';
import type { AuthTokenResponseDTO } from '../types/dto/auth/auth-token.response.dto';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
import type { LogoutResponseDTO } from '../types/dto/auth/logout-response.dto';
// IUserModel kullanılmıyor, kaldırıldı
import type { UploadImageResponseDTO } from '../types/dto/auth/upload-image.response.dto';
import type { UserResponseDTO } from '../types/dto/user/user-response.dto';
import { normalizeLocale, i18n } from '../types/i18n';

interface AuthenticatedRequest<T = any> extends Request<{}, any, T> {
  user?: {
    id: string;
    name: string;
  };
  savedProfileImage?: string;
}

@injectable()
export class AuthController {
  constructor(
    @inject('IAuthService') private authService: IAuthService,
    @inject('IUserService') private userService: IUserService,
    @inject('IUserRoleService') private userRoleService: IUserRoleService,
    @inject('IRoleService') private roleService: IRoleService,
    @inject('IPermissionService') private permissionService: IPermissionService,
    @inject('ILoggerProvider') private logger: ILoggerProvider,
    @inject('IExceptionTracker') private exceptionTracker: IExceptionTracker
  ) {}

  googleLogin = asyncErrorWrapper(
    async (
      req: Request,
      res: Response<AuthTokenResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { token } = req.body;
      console.log(token);
      const user = await this.authService.googleLogin(token);
      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const jwt = AuthManager.generateJWTFromUser({
        id: user._id,
        name: user.name,
        lang: locale,
      });
      sendJwtToClient(jwt, user, res);
    }
  );

  // Test için özel hata endpoint'i
  testError = asyncErrorWrapper(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
      const { errorType } = req.query;

      switch (errorType) {
        case 'user-error':
          // Kullanıcı hatası - Pino'ya gidecek
          throw ApplicationError.userError('Test user error', 400);

        case 'system-error':
          // Sistem hatası - Sentry'ye gidecek
          throw ApplicationError.systemError('Test system error', 500);

        case 'validation-error':
          // Validation hatası - Pino'ya gidecek
          throw ApplicationError.validationError('Test validation error');

        case 'database-error':
          // Database hatası - Sentry'ye gidecek
          throw ApplicationError.databaseError('Test database error');

        case 'unexpected-error':
          // Beklenmeyen hata - Sentry'ye gidecek
          throw new Error('Unexpected system error');

        default:
          res.json({
            message:
              'Use ?errorType=user-error|system-error|validation-error|database-error|unexpected-error',
          });
      }
    }
  );

  register = asyncErrorWrapper(
    async (
      req: Request<{}, any, RegisterDTO>,
      res: Response<AuthTokenResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { firstName, lastName, email, password } = req.body;
      const user = await this.authService.registerUser({
        firstName,
        lastName,
        email,
        password,
      });
      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const jwt = AuthManager.generateJWTFromUser({
        id: user._id,
        name: user.name,
        lang: locale,
      });
      sendJwtToClient(jwt, user, res);
    }
  );

  login = asyncErrorWrapper(
    async (
      req: Request<{}, any, LoginDTO>,
      res: Response<AuthTokenResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { email, password, rememberMe = false } = req.body;
      const captchaToken = req.body.captchaToken;

      // reCAPTCHA doğrulaması
      if (!captchaToken) {
        const locale = normalizeLocale(
          req.headers['accept-language'] as string | undefined
        );
        const message = await i18n(AuthConstants.CaptchaRequired, locale);
        throw ApplicationError.validationError(message);
      }

      // reCAPTCHA token'ını doğrula (basit kontrol)
      if (captchaToken === 'test' || captchaToken.length < 10) {
        const locale = normalizeLocale(
          req.headers['accept-language'] as string | undefined
        );
        const message = await i18n(AuthConstants.CaptchaInvalid, locale);
        throw ApplicationError.validationError(message);
      }

      // Kullanıcı girişi denemesi
      const user = await this.authService.loginUser(email, password);

      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const jwt = AuthManager.generateJWTFromUser(
        {
          id: user._id,
          name: user.name,
          lang: locale,
        },
        rememberMe
      );

      // Audit middleware için kullanıcı bilgisini response'a ekle
      (res as any).locals = {
        ...(res as any).locals,
        user: {
          id: user._id,
          email: user.email,
        },
      };

      // Başarılı login log'u
      this.logger.info('User login successful', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      sendJwtToClient(jwt, user, res, rememberMe);
    }
  );

  logout = asyncErrorWrapper(
    async (
      req: Request,
      res: Response<LogoutResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      try {
        // Cookie'den veya Authorization header'dan token'ı al
        let token = req.cookies?.access_token;

        if (!token || token === 'none') {
          // Authorization header'dan Bearer token'ı al
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // "Bearer " kısmını çıkar
          }
        }

        if (!token || token === 'none') {
          const locale = req.locale ?? 'en';
          const message = await i18n(AuthConstants.NotLoggedIn, locale);
          res.status(401).json({
            success: false,
            message,
          });
          return;
        }

        // Token'ı doğrula ve kullanıcı bilgisini al
        let userInfo;
        try {
          const { JWT_SECRET_KEY } = process.env;
          const secret = JWT_SECRET_KEY || 'default_secret';
          const decoded = jwt.verify(token, secret) as any;
          userInfo = {
            id: decoded.id,
            name: decoded.name,
          };
        } catch (_jwtError) {
          const locale = req.locale ?? 'en';
          const message = await i18n(AuthConstants.NotLoggedIn, locale);
          res.status(401).json({
            success: false,
            message,
          });
          return;
        }

        const { NODE_ENV } = process.env;

        // Cookie'yi temizle
        res.cookie('access_token', 'none', {
          httpOnly: true,
          expires: new Date(Date.now()),
          secure: NODE_ENV === 'development' ? false : true,
        });

        // Audit log için kullanıcı bilgisini response'a ekle
        (res as any).locals = {
          ...(res as any).locals,
          user: userInfo,
        };

        const locale = req.locale ?? 'en';
        const message = await i18n(AuthConstants.LogoutSuccess, locale);
        res.status(200).json({
          success: true,
          message,
        });
      } catch (_error) {
        const locale = req.locale ?? 'en';
        const message = await i18n(AuthConstants.LogoutError, locale);
        res.status(500).json({
          success: false,
          message,
        });
      }
    }
  );

  getUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<any>,
      res: Response<SuccessResponseDTO<UserResponseDTO>>,
      _next: NextFunction
    ): Promise<void> => {
      // Kullanıcının tam bilgilerini al
      const user = await this.userService.findById(req.user!.id);
      if (!user) {
        throw ApplicationError.userError('User not found', 404);
      }

      // UserRole tablosundan role'leri çek
      const userRoles = await this.userRoleService.getUserActiveRoles(user._id);
      const roleIds = userRoles.map(userRole => userRole.roleId);

      // Güvenli response - password ve diğer hassas bilgileri çıkar
      const safeUser: UserResponseDTO = {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: roleIds,
        title: user.title,
        about: user.about,
        place: user.place,
        website: user.website,
        profile_image: user.profile_image,
        blocked: user.blocked,
        createdAt: user.createdAt,
        language: user.language,
        notificationPreferences: user.notificationPreferences,
      };

      res.json({
        success: true,
        data: safeUser,
      });
    }
  );

  imageUpload = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<any>,
      res: Response<UploadImageResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const user = await this.authService.updateProfileImage(
        req.user!.id,
        req.savedProfileImage!
      );
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          profile_image: user.profile_image,
        },
      });
    }
  );

  editProfile = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<EditProfileDTO>,
      res: Response<SuccessResponseDTO<UserResponseDTO>>,
      _next: NextFunction
    ): Promise<void> => {
      const { firstName, lastName, email, website, place, title, about } =
        req.body;

      const user = await this.authService.updateProfile(req.user!.id, {
        firstName,
        lastName,
        email,
        website,
        place,
        title,
        about,
      });

      // UserRole tablosundan role'leri çek
      const userRoles = await this.userRoleService.getUserActiveRoles(user._id);
      const roleIds = userRoles.map(userRole => userRole.roleId);

      // Güvenli response - password ve diğer hassas bilgileri çıkar
      const safeUser: UserResponseDTO = {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: roleIds,
        title: user.title,
        about: user.about,
        place: user.place,
        website: user.website,
        profile_image: user.profile_image,
        blocked: user.blocked,
        createdAt: user.createdAt,
        language: user.language,
        notificationPreferences: user.notificationPreferences,
      };

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: safeUser,
      });
    }
  );

  forgotpassword = asyncErrorWrapper(
    async (
      req: Request<{}, any, ForgotPasswordDTO>,
      res: Response<SuccessResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { email } = req.body;
      // Use Accept-Language header since this is a public route (no JWT)
      const userLocale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      await this.authService.forgotPassword(email, userLocale);
      const message = await i18n(
        AuthConstants.ResetPasswordTokenSent,
        userLocale
      );
      res.status(200).json({
        success: true,
        message,
      });
    }
  );

  resetPassword = asyncErrorWrapper(
    async (
      req: Request<{}, any, ResetPasswordDTO>,
      res: Response<SuccessResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { token, newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      const message = await i18n(
        AuthConstants.PasswordResetSuccess,
        req.locale
      );
      res.status(200).json({
        success: true,
        message,
      });
    }
  );

  // Admin permission check endpoint'i
  checkAdminPermissions = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<{
        success: boolean;
        hasAdminPermission: boolean;
        permissions: string[];
      }>,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      try {
        // Kullanıcının tüm permission'larını al
        const userRoles = await this.userRoleService.getUserActiveRoles(
          req.user.id
        );

        if (userRoles.length === 0) {
          res.status(200).json({
            success: true,
            hasAdminPermission: false,
            permissions: [],
          });
          return;
        }

        // Role'lerin permission'larını al
        const roleIds = userRoles.map(userRole => userRole.roleId);
        const roles = await Promise.all(
          roleIds.map((roleId: string) => this.roleService.findById(roleId))
        );

        // Tüm permission ID'lerini topla
        const permissionIds: string[] = [];
        roles.forEach((role: any) => {
          if (role && role.isActive && role.permissions) {
            role.permissions.forEach((permission: any) => {
              if (typeof permission === 'string') {
                permissionIds.push(permission);
              } else if (permission && permission._id) {
                permissionIds.push(permission._id.toString());
              }
            });
          }
        });

        // Permission'ları al
        const permissions = await Promise.all(
          permissionIds.map((permissionId: string) =>
            this.permissionService.findById(permissionId)
          )
        );

        // Aktif permission'ların name'lerini al
        const activePermissions = permissions
          .filter((permission: any) => permission && permission.isActive)
          .map((permission: any) => permission!.name);

        const hasAdminPermission = activePermissions.includes('system:admin');

        res.status(200).json({
          success: true,
          hasAdminPermission,
          permissions: activePermissions,
        });
      } catch (error) {
        // Database veya service hatalarını system error olarak ele al
        if (error instanceof ApplicationError) {
          throw error; // Zaten ApplicationError ise direkt fırlat
        }

        // Diğer hataları system error'a çevir
        throw ApplicationError.systemError(
          'Failed to check admin permissions',
          500
        );
      }
    }
  );
}
