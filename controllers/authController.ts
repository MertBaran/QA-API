import { Request, Response, NextFunction } from "express";
import asyncErrorWrapper from "express-async-handler";
import { sendJwtToClient } from "../helpers/authorization/tokenHelpers";
import { injectable, inject } from "tsyringe";
import { IAuthService } from "../services/contracts/IAuthService";
import { AuthConstants } from "./constants/ControllerMessages";
import { AuthManager } from "../services/managers/AuthManager";
import { ILoggerProvider } from "../infrastructure/logging/ILoggerProvider";
import { IAuditProvider } from "../infrastructure/audit/IAuditProvider";
import type { RegisterDTO } from "../types/dto/auth/register.dto";
import type { LoginDTO } from "../types/dto/auth/login.dto";
import type { ForgotPasswordDTO } from "../types/dto/auth/forgot-password.dto";
import type { ResetPasswordDTO } from "../types/dto/auth/reset-password.dto";
import type { AuthTokenResponseDTO } from "../types/dto/auth/auth-token.response.dto";
import type { SuccessResponseDTO } from "../types/dto/common/success-response.dto";
import type { IUserModel } from "../models/interfaces/IUserModel";
import { normalizeLocale, i18n } from "../types/i18n";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
  savedProfileImage?: string;
}

@injectable()
export class AuthController {
  constructor(
    @inject("AuthService") private authService: IAuthService,
    @inject("LoggerProvider") private logger: ILoggerProvider,
    @inject("AuditProvider") private audit: IAuditProvider
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
        req.headers["accept-language"] as string | undefined
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
        req.headers["accept-language"] as string | undefined
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
        req.headers["accept-language"] as string | undefined
      );
      const jwt = AuthManager.generateJWTFromUser({
        id: user._id,
        name: user.name,
        lang: locale,
      });
      this.logger.info("User logged in", {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        context: "AuthController",
      });
      await this.audit.log({
        action: "USER_LOGIN",
        actor: { id: user._id, email: user.email, role: user.role },
        ip: req.ip,
        context: "AuthController",
        details: { userId: user._id, email: user.email },
      });
      sendJwtToClient(jwt, user, res);
    }
  );

  logout = asyncErrorWrapper(
    async (
      req: Request,
      res: Response<SuccessResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { NODE_ENV } = process.env;
      res.cookie("access_token", "none", {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: NODE_ENV === "development" ? false : true,
      });
      const locale = req.locale ?? "en";
      const message = await i18n(AuthConstants.LogoutSuccess, locale);
      res.status(200).json({
        success: true,
        message,
      });
    }
  );

  getUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
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
      req: AuthenticatedRequest,
      res: Response<SuccessResponseDTO<IUserModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const user = await this.authService.updateProfileImage(
        req.user!.id,
        req.savedProfileImage!
      );
      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
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
        req.headers["accept-language"] as string | undefined
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
        req.locale ?? "en"
      );
      res.status(200).json({
        success: true,
        message,
      });
    }
  );
}
