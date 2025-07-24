import { EntityId } from '../../types/database';
import { SupportedLanguage } from '../../constants/supportedLanguages';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  webhook: boolean;
}

export interface IUserModel {
  _id: EntityId;
  name: string;
  email: string;

  password: string;
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  profile_image: string;
  blocked: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  lastPasswordChange?: Date;
  createdAt?: Date;
  // Notification için yeni alanlar
  phoneNumber?: string;
  webhookUrl?: string;
  notificationPreferences?: NotificationPreferences;
  // Dil tercihi
  language?: SupportedLanguage;
}
