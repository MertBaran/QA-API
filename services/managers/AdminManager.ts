import { injectable, inject } from 'tsyringe';
import { IUserService } from '../contracts/IUserService';
import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';
import { IAdminService } from '../contracts/IAdminService';
import CustomError from '../../helpers/error/CustomError';
import { AdminServiceMessages } from '../constants/ServiceMessages';

@injectable()
export class AdminManager implements IAdminService {
  constructor(
    @inject('IUserService') private userService: IUserService
  ) {}

  async blockUser(userId: EntityId): Promise<IUserModel> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new CustomError(AdminServiceMessages.UserNotFound.en, 404);
    }
    const updatedUser = await this.userService.updateById(userId, {
      blocked: !user.blocked,
    });
    return updatedUser as IUserModel;
  }

  async deleteUser(userId: EntityId): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new CustomError(AdminServiceMessages.UserNotFound.en, 404);
    }
    await this.userService.deleteById(userId);
  }

  async getAllUsers(): Promise<IUserModel[]> {
    return await this.userService.findAll();
  }

  async getSingleUser(userId: EntityId): Promise<IUserModel | null> {
    return await this.userService.findById(userId);
  }
}
