import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';
import { IRepository } from './IRepository';

export interface IUserRepository extends IRepository<IUserModel> {
  findByEmail(email: string): Promise<IUserModel | null>;
  findByEmailWithPassword(email: string): Promise<IUserModel | null>;
  findByResetToken(token: string): Promise<IUserModel | null>;
  updateResetToken(
    userId: EntityId,
    resetToken: string,
    resetExpire: Date
  ): Promise<IUserModel | null>;
  clearResetToken(userId: EntityId): Promise<IUserModel | null>;
  findActive(): Promise<IUserModel[]>;
  countAll(): Promise<number>;
}
