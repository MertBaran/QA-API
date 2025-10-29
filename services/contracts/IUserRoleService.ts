import { IUserRoleModel } from '../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../types/database';

export interface IUserRoleService {
  getUserRoles(userId: EntityId): Promise<IUserRoleModel[]>;
  getUserActiveRoles(userId: EntityId): Promise<IUserRoleModel[]>;
  findByUserIdAndRoleId(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel>;
  assignRoleToUser(
    userId: EntityId,
    roleId: EntityId,
    assignedBy?: EntityId
  ): Promise<IUserRoleModel>;
  removeRoleFromUser(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel>;
  hasRole(userId: EntityId, roleId: EntityId): Promise<boolean>;
  hasAnyRole(userId: EntityId, roleIds: EntityId[]): Promise<boolean>;
  hasAllRoles(userId: EntityId, roleIds: EntityId[]): Promise<boolean>;
  deactivateExpiredRoles(): Promise<number>;
}
