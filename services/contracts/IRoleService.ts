import { IRoleModel } from '../../models/interfaces/IRoleModel';
import { EntityId } from '../../types/database';

export interface IRoleService {
  create(role: Partial<IRoleModel>): Promise<IRoleModel>;
  findById(id: EntityId): Promise<IRoleModel | null>;
  findByName(name: string): Promise<IRoleModel | null>;
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
  ): Promise<IRoleModel | null>;
  removePermissionFromRole(
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
