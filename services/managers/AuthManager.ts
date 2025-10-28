import { IUserModel } from '../../models/interfaces/IUserModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { comparePassword } from '../../infrastructure/validation/inputHelpers';
import { OAuth2Client } from 'google-auth-library';
import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { IUserService } from '../contracts/IUserService';
import { IRoleService } from '../contracts/IRoleService';
import { IUserRoleService } from '../contracts/IUserRoleService';
import { EntityId } from '../../types/database';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { IAuthService } from '../contracts/IAuthService';
import { INotificationService } from '../contracts/INotificationService';
import { AuthServiceMessages } from '../constants/ServiceMessages';
import { getLanguageOrDefault } from '../../constants/supportedLanguages';

const client = new OAuth2Client(process.env['GOOGLE_CLIENT_ID']);

@injectable()
export class AuthManager implements IAuthService {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IUserService') private userService: IUserService,
    @inject('IRoleService') private roleService: IRoleService,
    @inject('IUserRoleService') private userRoleService: IUserRoleService,
    @inject('INotificationService')
    private notificationService: INotificationService
  ) {}

  async registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId?: string;
    language?: string;
  }): Promise<IUserModel> {
    const { firstName, lastName, email, password, roleId, language } = userData;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw ApplicationError.businessError(
        AuthServiceMessages.EmailExists.en,
        400
      );
    }

    const name = `${firstName} ${lastName}`.trim();
    const user = await this.userRepository.create({
      name,
      email,
      password,
      language: (language as any) || 'en',
    });

    // Role atama: Eğer roleId verilmişse onu kullan, yoksa varsayılan role'ü ata
    if (roleId) {
      // Verilen role'ün var olup olmadığını kontrol et
      const role = await this.roleService.findById(roleId);
      if (!role) {
        throw ApplicationError.businessError('Specified role not found', 400);
      }
      if (!role.isActive) {
        throw ApplicationError.businessError(
          'Specified role is not active',
          400
        );
      }
      await this.userRoleService.assignRoleToUser(user._id, roleId);
    } else {
      // Varsayılan user role'ünü al ve ata
      const defaultRole = await this.roleService.getDefaultRole();
      await this.userRoleService.assignRoleToUser(user._id, defaultRole._id);
    }

    return user;
  }

  async loginUser(email: string, password: string): Promise<IUserModel> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw ApplicationError.notFoundError(
        AuthServiceMessages.InvalidCredentials.en
      );
    }
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      throw ApplicationError.notFoundError(
        AuthServiceMessages.InvalidCredentials.en
      );
    }
    return user;
  }

  async googleLogin(token: string): Promise<IUserModel> {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env['GOOGLE_CLIENT_ID'],
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw ApplicationError.notFoundError(
        AuthServiceMessages.GooglePayloadMissing.en
      );
    }
    const { email, name } = payload;
    if (!email) {
      throw ApplicationError.notFoundError(
        AuthServiceMessages.GoogleEmailMissing.en
      );
    }
    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      user = await this.userRepository.create({
        name,
        email,
        password: Math.random().toString(36),
        language: 'en',
      });

      // Varsayılan user role'ünü al ve ata
      const defaultRole = await this.roleService.getDefaultRole();
      await this.userRoleService.assignRoleToUser(user._id, defaultRole._id);
    }
    return user;
  }

  async forgotPassword(email: string, locale: string = 'en'): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw ApplicationError.notFoundError(
        AuthServiceMessages.EmailNotFound.en
      );
    }
    const { token, expire } = AuthManager.generateResetPasswordToken();
    await this.userRepository.updateById(user._id, {
      resetPasswordToken: token,
      resetPasswordExpire: expire,
    });
    const clientUrl = process.env['CLIENT_URL'] || 'https://localhost:3001';
    const resetPasswordUrl = `${clientUrl}/reset-password?token=${token}`;

    // Select locale
    const selectedLocale = getLanguageOrDefault(locale);

    try {
      // Template sistemini kullan
      await this.notificationService.notifyUserWithTemplate(
        user._id.toString(),
        'password-reset',
        selectedLocale,
        {
          userName: user.name,
          resetLink: resetPasswordUrl,
        }
      );
    } catch (_err) {
      await this.userRepository.clearResetToken(user._id);
      throw ApplicationError.notFoundError(
        AuthServiceMessages.EmailSendError.en
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByResetToken(token);
    if (!user) {
      throw ApplicationError.notFoundError(
        AuthServiceMessages.InvalidOrExpiredToken.en
      );
    }

    // Yeni şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userRepository.updateById(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined,
      lastPasswordChange: new Date(),
    });
  }

  async updateProfileImage(
    userId: EntityId,
    profileImage: string
  ): Promise<IUserModel> {
    const user = await this.userRepository.updateById(userId, {
      profile_image: profileImage,
    });
    if (!user) {
      throw ApplicationError.notFoundError(AuthServiceMessages.UserNotFound.en);
    }
    return user;
  }

  async updateProfile(
    userId: EntityId,
    profileData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      website?: string;
      place?: string;
      title?: string;
      about?: string;
    }
  ): Promise<IUserModel> {
    // Email değişikliği varsa, email'in benzersiz olduğunu kontrol et
    if (profileData.email) {
      const existingUser = await this.userRepository.findByEmail(
        profileData.email
      );
      if (existingUser && existingUser._id !== userId) {
        throw ApplicationError.businessError(
          AuthServiceMessages.EmailExists.en,
          400
        );
      }
    }

    // İsim ve soyisim değişikliği varsa, name alanını güncelle
    const updateData: any = { ...profileData };

    if (profileData.firstName || profileData.lastName) {
      const currentUser = await this.userService.findById(userId);
      if (!currentUser) {
        throw ApplicationError.notFoundError(
          AuthServiceMessages.UserNotFound.en
        );
      }

      // Mevcut ismi parçala
      const nameParts = currentUser.name.split(' ');
      const currentFirstName = nameParts[0] || '';
      const currentLastName = nameParts.slice(1).join(' ') || ''; // Birden fazla soyisim olabilir

      // Yeni değerleri al, yoksa mevcut değerleri kullan
      const newFirstName =
        profileData.firstName !== undefined
          ? profileData.firstName
          : currentFirstName;
      const newLastName =
        profileData.lastName !== undefined
          ? profileData.lastName
          : currentLastName;

      updateData.name = `${newFirstName} ${newLastName}`.trim();

      // firstName ve lastName alanlarını kaldır çünkü veritabanında name alanı var
      delete updateData.firstName;
      delete updateData.lastName;
    }

    const user = await this.userRepository.updateById(userId, updateData);
    if (!user) {
      throw ApplicationError.notFoundError(AuthServiceMessages.UserNotFound.en);
    }
    return user;
  }

  createJwtForUser(
    user: {
      id: string;
      name: string;
      lang?: string;
    },
    rememberMe: boolean = false
  ): string {
    const secret = (process.env['JWT_SECRET_KEY'] ||
      'default_secret') as jwt.Secret;

    // Remember me durumuna göre token süresini ayarla
    const expires: string | number = rememberMe
      ? '30d' // 30 gün
      : (process.env['JWT_EXPIRE'] ?? '1d'); // 1 gün

    return jwt.sign(
      {
        id: user.id,
        name: user.name,
        lang: user.lang || 'en',
        iat: Math.floor(Date.now() / 1000), // Added iat
      },
      secret,
      {
        expiresIn: expires,
      } as jwt.SignOptions
    );
  }

  static generateResetPasswordToken(): { token: string; expire: Date } {
    const randomHexString = crypto.randomBytes(15).toString('hex');
    const { RESET_PASSWORD_EXPIRE } = process.env;
    const resetPasswordToken = crypto
      .createHash('SHA256')
      .update(randomHexString)
      .digest('hex');
    const resetPasswordExpire = new Date(
      Date.now() + parseInt(RESET_PASSWORD_EXPIRE || '3600') * 1000
    );
    return { token: resetPasswordToken, expire: resetPasswordExpire };
  }
}
