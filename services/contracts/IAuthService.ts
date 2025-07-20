import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';

export interface IAuthService {
  registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
  }): Promise<IUserModel>;
  loginUser(email: string, password: string): Promise<IUserModel>;
  googleLogin(token: string): Promise<IUserModel>;
  forgotPassword(email: string, locale?: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  updateProfileImage(
    userId: EntityId,
    profileImage: string
  ): Promise<IUserModel>;
  getUserById(userId: EntityId): Promise<IUserModel>;
}
