import { IAuthService } from '../../../services/contracts/IAuthService';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';

export class FakeAuthManager implements IAuthService {
  async registerUser(userData: any): Promise<IUserModel> {
    // Test ortamında basit user oluştur
    const user: IUserModel = {
      _id: `user_${Date.now()}`,
      name: userData.firstName + ' ' + userData.lastName,
      email: userData.email,
      password: 'hashedpassword',
      createdAt: new Date(),
      profile_image: 'default.jpg',
      blocked: false,
    } as IUserModel;

    return user;
  }

  async loginUser(email: string, password: string): Promise<IUserModel> {
    // Test ortamında basit user döndür
    const user: IUserModel = {
      _id: 'user_1',
      name: 'Test User',
      email: email,
      password: 'hashedpassword',
      createdAt: new Date(),
      profile_image: 'default.jpg',
      blocked: false,
    } as IUserModel;

    return user;
  }

  async googleLogin(token: string): Promise<IUserModel> {
    return this.loginUser('google@test.com', 'password');
  }

  async logoutUser(userId: EntityId): Promise<void> {
    // Test ortamında hiçbir şey yapma
  }

  async forgotPassword(email: string): Promise<void> {
    // Test ortamında hiçbir şey yapma
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Test ortamında hiçbir şey yapma
  }

  async getUserProfile(userId: EntityId): Promise<IUserModel> {
    const user: IUserModel = {
      _id: userId,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      createdAt: new Date(),
      profile_image: 'default.jpg',
      blocked: false,
    } as IUserModel;

    return user;
  }

  async editUserProfile(userId: EntityId, userData: any): Promise<IUserModel> {
    return this.getUserProfile(userId);
  }

  async updateProfileImage(
    userId: EntityId,
    imagePath: string
  ): Promise<IUserModel> {
    return this.getUserProfile(userId);
  }

  async updateProfile(userId: EntityId, profileData: any): Promise<IUserModel> {
    return this.getUserProfile(userId);
  }

  createJwtForUser(
    payload: { id: string; name: string; lang?: string },
    rememberMe?: boolean
  ): string {
    return 'fake-jwt-token';
  }
}
