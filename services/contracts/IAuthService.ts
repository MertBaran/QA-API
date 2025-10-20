import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';

export interface IAuthService {
  registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId?: string; // Role ID'si ile role atama
    language?: string;
  }): Promise<IUserModel>;
  loginUser(email: string, password: string): Promise<IUserModel>;
  googleLogin(token: string): Promise<IUserModel>;
  forgotPassword(email: string, locale?: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  updateProfileImage(
    userId: EntityId,
    profileImage: string
  ): Promise<IUserModel>;
  updateProfile(
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
  ): Promise<IUserModel>;

  createJwtForUser(
    payload: { id: string; name: string; lang?: string },
    rememberMe?: boolean
  ): string;
}
