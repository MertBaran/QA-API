import { injectable, inject } from 'tsyringe';
import { IUserService } from '../contracts/IUserService';
import { IUserModel } from '../../models/interfaces/IUserModel';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { EntityId } from '../../types/database';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { UserServiceMessages } from '../constants/ServiceMessages';

@injectable()
export class UserManager implements IUserService {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async findById(userId: EntityId): Promise<IUserModel> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<IUserModel> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  async create(userData: Partial<IUserModel>): Promise<IUserModel> {
    const user = await this.userRepository.create(userData);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  async updateById(
    userId: EntityId,
    data: Partial<IUserModel>
  ): Promise<IUserModel> {
    const user = await this.userRepository.updateById(userId, data);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  async deleteById(userId: EntityId): Promise<boolean> {
    const deleted = await this.userRepository.deleteById(userId);
    if (!deleted) {
      throw ApplicationError.businessError(
        UserServiceMessages.UserDeleteError.en,
        500
      );
    }
    return true;
  }

  async findAll(): Promise<IUserModel[]> {
    const users = await this.userRepository.findAll();
    if (users === null || users === undefined) {
      throw ApplicationError.notFoundError('Users not found');
    }
    return users;
  }

  async findActive(): Promise<IUserModel[]> {
    const users = await this.userRepository.findActive();
    if (users === null || users === undefined) {
      throw ApplicationError.notFoundError('Users not found');
    }
    return users;
  }

  async countAll(): Promise<number> {
    const count = await this.userRepository.countAll();
    if (count === null || count === undefined) {
      throw ApplicationError.notFoundError('Count not found');
    }
    return count;
  }

  async followUser(userId: EntityId, followerId: EntityId): Promise<IUserModel> {
    return await this.userRepository.followUser(userId, followerId);
  }

  async unfollowUser(userId: EntityId, followerId: EntityId): Promise<IUserModel> {
    return await this.userRepository.unfollowUser(userId, followerId);
  }

  async getFollowers(userId: EntityId): Promise<IUserModel[]> {
    return await this.userRepository.getFollowers(userId);
  }

  async getFollowing(userId: EntityId): Promise<IUserModel[]> {
    return await this.userRepository.getFollowing(userId);
  }
}
