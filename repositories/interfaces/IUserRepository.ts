import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';
import { IRepository } from './IRepository';

export interface IUserRepository extends IRepository<IUserModel> {
  findByEmail(email: string): Promise<IUserModel>;
  findByEmailWithPassword(email: string): Promise<IUserModel>;
  findByResetToken(token: string): Promise<IUserModel>;
  updateResetToken(
    userId: EntityId,
    resetToken: string,
    resetExpire: Date
  ): Promise<IUserModel>;
  clearResetToken(userId: EntityId): Promise<IUserModel>;
  findActive(): Promise<IUserModel[]>;
  countAll(): Promise<number>;
}
