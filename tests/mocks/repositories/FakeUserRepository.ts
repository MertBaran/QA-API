import { IUserRepository } from '../../../repositories/interfaces/IUserRepository';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';

export class FakeUserRepository implements IUserRepository {
  private users: IUserModel[] = [];

  async findById(userId: EntityId): Promise<IUserModel> {
    const user = this.users.find(user => user._id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<IUserModel> {
    const user = this.users.find(user => user.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel> {
    const user = this.users.find(user => user.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async create(userData: Partial<IUserModel>): Promise<IUserModel> {
    const user: IUserModel = {
      _id: `user_${Date.now()}`,
      name: userData.name || 'Test User',
      email: userData.email || 'test@example.com',
      password: userData.password || 'hashedpassword',
      createdAt: new Date(),
      profile_image: 'default.jpg',
      blocked: false,
      ...userData,
    } as IUserModel;

    this.users.push(user);
    return user;
  }

  async updateById(
    userId: EntityId,
    data: Partial<IUserModel>
  ): Promise<IUserModel> {
    const index = this.users.findIndex(user => user._id === userId);
    if (index === -1) {
      throw new Error('User not found');
    }

    const existingUser = this.users[index];
    if (!existingUser) {
      throw new Error('User not found');
    }

    this.users[index] = { ...existingUser, ...data } as IUserModel;
    return this.users[index];
  }

  async deleteById(userId: EntityId): Promise<IUserModel> {
    const index = this.users.findIndex(user => user._id === userId);
    if (index === -1) {
      throw new Error('User not found');
    }

    const user = this.users[index];
    if (!user) {
      throw new Error('User not found');
    }

    this.users.splice(index, 1);
    return user;
  }

  async findAll(): Promise<IUserModel[]> {
    return [...this.users];
  }

  async findActive(): Promise<IUserModel[]> {
    return this.users.filter(user => !user.blocked);
  }

  async countAll(): Promise<number> {
    return this.users.length;
  }

  async findByResetToken(token: string): Promise<IUserModel> {
    const user = this.users.find(
      user => (user as any).resetPasswordToken === token
    );
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async clearResetToken(userId: EntityId): Promise<IUserModel> {
    return this.updateById(userId, {
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined,
    });
  }

  async updateResetToken(
    userId: EntityId,
    resetToken: string,
    resetExpire: Date
  ): Promise<IUserModel> {
    return this.updateById(userId, {
      resetPasswordToken: resetToken,
      resetPasswordExpire: resetExpire,
    });
  }
}
