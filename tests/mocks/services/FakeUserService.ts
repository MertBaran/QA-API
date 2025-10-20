import { IUserService } from '../../../services/contracts/IUserService';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';

export class FakeUserService implements IUserService {
  private users: IUserModel[] = [];

  findById = jest
    .fn()
    .mockImplementation(
      async (userId: EntityId): Promise<IUserModel | null> => {
        return this.users.find(user => user._id === userId) || null;
      }
    );

  async findByEmail(email: string): Promise<IUserModel | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel | null> {
    return this.users.find(user => user.email === email) || null;
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
  ): Promise<IUserModel | null> {
    const index = this.users.findIndex(user => user._id === userId);
    if (index === -1) return null;

    this.users[index] = { ...this.users[index], ...data } as IUserModel;
    return this.users[index];
  }

  async deleteById(userId: EntityId): Promise<boolean> {
    const index = this.users.findIndex(user => user._id === userId);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
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
}
