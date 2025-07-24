import { injectable, inject } from 'tsyringe';
import { IUserService } from '../contracts/IUserService';
import { IUserModel } from '../../models/interfaces/IUserModel';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { EntityId } from '../../types/database';
import CustomError from '../../helpers/error/CustomError';
import { UserServiceMessages } from '../constants/ServiceMessages';

@injectable()
export class UserManager implements IUserService {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async findById(userId: EntityId): Promise<IUserModel | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      throw new CustomError(UserServiceMessages.UserNotFound.en, 404);
    }
  }

  async findByEmail(email: string): Promise<IUserModel | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      throw new CustomError(UserServiceMessages.UserNotFound.en, 404);
    }
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel | null> {
    try {
      return await this.userRepository.findByEmailWithPassword(email);
    } catch (error) {
      throw new CustomError(UserServiceMessages.UserNotFound.en, 404);
    }
  }

  async create(userData: Partial<IUserModel>): Promise<IUserModel> {
    try {
      const user = await this.userRepository.create(userData);
      if (!user) {
        throw new CustomError(UserServiceMessages.UserCreateError.en, 500);
      }
      return user;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(UserServiceMessages.UserCreateError.en, 500);
    }
  }

  async updateById(
    userId: EntityId,
    data: Partial<IUserModel>
  ): Promise<IUserModel | null> {
    try {
      const user = await this.userRepository.updateById(userId, data);
      if (!user) {
        throw new CustomError(UserServiceMessages.UserNotFound.en, 404);
      }
      return user;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(UserServiceMessages.UserUpdateError.en, 500);
    }
  }

  async deleteById(userId: EntityId): Promise<boolean> {
    try {
      const deleted = await this.userRepository.deleteById(userId);
      if (!deleted) {
        throw new CustomError(UserServiceMessages.UserNotFound.en, 404);
      }
      return true;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(UserServiceMessages.UserDeleteError.en, 500);
    }
  }

  async findAll(): Promise<IUserModel[]> {
    try {
      return await this.userRepository.findAll();
    } catch (error) {
      throw new CustomError(UserServiceMessages.UserListError.en, 500);
    }
  }

  async findActive(): Promise<IUserModel[]> {
    try {
      return await this.userRepository.findActive();
    } catch (error) {
      throw new CustomError(UserServiceMessages.UserListError.en, 500);
    }
  }

  async countAll(): Promise<number> {
    try {
      return await this.userRepository.countAll();
    } catch (error) {
      throw new CustomError(UserServiceMessages.UserCountError.en, 500);
    }
  }
}
