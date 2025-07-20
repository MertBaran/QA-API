import { EntityId } from '../../types/database';

export interface IUserModel {
  _id: EntityId;
  name: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  profile_image: string;
  blocked: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt?: Date;
}
