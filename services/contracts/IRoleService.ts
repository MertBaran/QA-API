import { IRoleModel } from '../../models/interfaces/IRoleModel';
import { EntityId } from '../../types/database';

export interface IRoleService {
  create(role: Partial<IRoleModel>): Promise<IRoleModel>;
  findById(id: EntityId): Promise<IRoleModel>;
  findByName(name: string): Promise<IRoleModel>;
  findAll(): Promise<IRoleModel[]>;
  updateById(
    id: EntityId,
    data: Partial<IRoleModel>
  ): Promise<IRoleModel | null>;
  deleteById(id: EntityId): Promise<boolean>;
  getDefaultRole(): Promise<IRoleModel>;
  getSystemRoles(): Promise<IRoleModel[]>;
  getActiveRoles(): Promise<IRoleModel[]>;
  assignPermissionToRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel>;
  removePermissionFromRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null>;
  getPermissionById(permissionId: EntityId): Promise<any>;
  getAllPermissions(): Promise<any[]>;
  addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel>;
  removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel>;
}
