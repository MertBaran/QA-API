import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';
import { IAdminService } from "../contracts/IAdminService";
import CustomError from "../../helpers/error/CustomError";
import { AdminServiceMessages } from "../constants/ServiceMessages";

@injectable()
export class AdminManager implements IAdminService {
  constructor(@inject("UserRepository") private userRepository: IUserRepository) {}

  async blockUser(userId: EntityId): Promise<IUserModel> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new CustomError(AdminServiceMessages.UserNotFound.en, 404);
    }
    const updatedUser = await this.userRepository.updateById(userId, {
      blocked: !user.blocked
    });
    return updatedUser as IUserModel;
  }

  async deleteUser(userId: EntityId): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new CustomError(AdminServiceMessages.UserNotFound.en, 404);
    }
    await this.userRepository.deleteById(userId);
  }

  async getAllUsers(): Promise<IUserModel[]> {
    return await this.userRepository.findAll();
  }

  async getSingleUser(userId: EntityId): Promise<IUserModel | null> {
    return await this.userRepository.findById(userId);
  }
} 