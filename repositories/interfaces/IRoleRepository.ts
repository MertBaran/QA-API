import { IRoleModel } from '../../models/interfaces/IRoleModel';
import { EntityId } from '../../types/database';
import { IRepository } from './IRepository';

export interface IRoleRepository extends IRepository<IRoleModel> {
  findByName(name: string): Promise<IRoleModel | null>;
  findSystemRoles(): Promise<IRoleModel[]>;
  findActive(): Promise<IRoleModel[]>;
  assignPermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null>;
  removePermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null>;
  getPermissionById(permissionId: EntityId): Promise<any>;
  getAllPermissions(): Promise<any[]>;
  addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null>;
  removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null>;
}
