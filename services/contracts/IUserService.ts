import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';

export interface IUserService {
  findById(userId: EntityId): Promise<IUserModel | null>;
  findByEmail(email: string): Promise<IUserModel | null>;
  findByEmailWithPassword(email: string): Promise<IUserModel | null>;
  create(userData: Partial<IUserModel>): Promise<IUserModel>;
  updateById(
    userId: EntityId,
    data: Partial<IUserModel>
  ): Promise<IUserModel | null>;
  deleteById(userId: EntityId): Promise<boolean>;
  findAll(): Promise<IUserModel[]>;
  findActive(): Promise<IUserModel[]>;
  countAll(): Promise<number>;
}
