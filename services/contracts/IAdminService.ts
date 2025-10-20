import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';
import { UserFilters, UsersResponse, UserStats } from './IUserService';

export interface IAdminService {
  blockUser(userId: EntityId): Promise<IUserModel>;
  deleteUser(userId: EntityId): Promise<void>;
  getAllUsers(): Promise<IUserModel[]>;
  getSingleUser(userId: EntityId): Promise<IUserModel | null>;

  // Admin paneli özel işlemler
  getUsersForAdmin(
    filters: UserFilters,
    page: number,
    limit: number
  ): Promise<UsersResponse>;

  updateUserByAdmin(
    userId: string,
    userData: Partial<IUserModel>
  ): Promise<IUserModel>;

  deleteUserByAdmin(userId: string): Promise<void>;

  toggleUserBlock(userId: string, blocked: boolean): Promise<IUserModel>;

  updateUserRoles(userId: string, roles: string[]): Promise<IUserModel>;

  getUserStats(): Promise<UserStats>;
}
