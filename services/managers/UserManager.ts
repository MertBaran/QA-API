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
    return await this.userRepository.findById(userId);
  }

  async findByEmail(email: string): Promise<IUserModel | null> {
    return await this.userRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel | null> {
    return await this.userRepository.findByEmailWithPassword(email);
  }

  async create(userData: Partial<IUserModel>): Promise<IUserModel> {
    const user = await this.userRepository.create(userData);
    if (!user) {
      throw new CustomError(UserServiceMessages.UserCreateError.en, 500);
    }
    return user;
  }

  async updateById(
    userId: EntityId,
    data: Partial<IUserModel>
  ): Promise<IUserModel | null> {
    const user = await this.userRepository.updateById(userId, data);
    if (!user) {
      throw new CustomError(UserServiceMessages.UserNotFound.en, 404);
    }
    return user;
  }

  async deleteById(userId: EntityId): Promise<boolean> {
    const deleted = await this.userRepository.deleteById(userId);
    if (!deleted) {
      throw new CustomError(UserServiceMessages.UserNotFound.en, 404);
    }
    return true;
  }

  async findAll(): Promise<IUserModel[]> {
    return await this.userRepository.findAll();
  }

  async findActive(): Promise<IUserModel[]> {
    return await this.userRepository.findActive();
  }

  async countAll(): Promise<number> {
    return await this.userRepository.countAll();
  }
}
