import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { sendJwtToClient } from '../helpers/authorization/tokenHelpers';
import { injectable, inject } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { IAuthService } from '../services/contracts/IAuthService';
import { AuthConstants } from './constants/ControllerMessages';
import { AuthManager } from '../services/managers/AuthManager';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import type { RegisterDTO } from '../types/dto/auth/register.dto';
import type { LoginDTO } from '../types/dto/auth/login.dto';
import type { ForgotPasswordDTO } from '../types/dto/auth/forgot-password.dto';
import type { ResetPasswordDTO } from '../types/dto/auth/reset-password.dto';
import type { EditProfileDTO } from '../types/dto/auth/edit-profile.dto';
import type { AuthTokenResponseDTO } from '../types/dto/auth/auth-token.response.dto';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
import type { LogoutResponseDTO } from '../types/dto/auth/logout-response.dto';
import type { IUserModel } from '../models/interfaces/IUserModel';
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
    @inject('ILoggerProvider') private logger: ILoggerProvider
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

  register = asyncErrorWrapper(
    async (
      req: Request<{}, any, RegisterDTO>,
      res: Response<AuthTokenResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { firstName, lastName, email, password, role } = req.body;
      const user = await this.authService.registerUser({
        firstName,
        lastName,
        email,
        password,
        role,
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
      const { email, password } = req.body;
      const user = await this.authService.loginUser(email, password);
      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const jwt = AuthManager.generateJWTFromUser({
        id: user._id,
        name: user.name,
        lang: locale,
      });

      // Audit middleware için kullanıcı bilgisini response'a ekle
      (res as any).locals = {
        ...(res as any).locals,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      };

      sendJwtToClient(jwt, user, res);
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
        } catch (jwtError) {
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
      } catch (error) {
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
      res: Response<SuccessResponseDTO<{ id: string; name: string }>>,
      _next: NextFunction
    ): Promise<void> => {
      res.json({
        success: true,
        data: {
          id: req.user!.id,
          name: req.user!.name,
        },
      });
    }
  );

  imageUpload = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<any>,
      res: Response<SuccessResponseDTO<IUserModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const user = await this.authService.updateProfileImage(
        req.user!.id,
        req.savedProfileImage!
      );
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: user,
      });
    }
  );

  editProfile = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<EditProfileDTO>,
      res: Response<SuccessResponseDTO<IUserModel>>,
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
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
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
        req.locale ?? 'en'
      );
      res.status(200).json({
        success: true,
        message,
      });
    }
  );
}
