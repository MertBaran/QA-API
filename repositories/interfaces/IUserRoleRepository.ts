import { IUserRoleModel } from '../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../types/database';
import { IRepository } from './IRepository';

export interface IUserRoleRepository extends IRepository<IUserRoleModel> {
  findByUserId(userId: EntityId): Promise<IUserRoleModel[]>;
  findByRoleId(roleId: EntityId): Promise<IUserRoleModel[]>;
  findByUserIdAndRoleId(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel>;
  findByUserIdAndActive(userId: EntityId): Promise<IUserRoleModel[]>;
  assignRoleToUser(
    userId: EntityId,
    roleId: EntityId,
    assignedBy?: EntityId
  ): Promise<IUserRoleModel>;
  removeRoleFromUser(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel>;
  deactivateExpiredRoles(): Promise<number>;
}
