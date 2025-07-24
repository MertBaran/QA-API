import { injectable, inject } from 'tsyringe';
import { IRoleRepository } from './interfaces/IRoleRepository';
import { IRoleModel } from '../models/interfaces/IRoleModel';
import { IRoleDataSource } from './interfaces/IRoleDataSource';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';

@injectable()
export class RoleRepository
  extends BaseRepository<IRoleModel>
  implements IRoleRepository
{
  constructor(
    @inject('IRoleDataSource') private roleDataSource: IRoleDataSource
  ) {
    super(roleDataSource);
  }

  async findByName(name: string): Promise<IRoleModel | null> {
    return this.roleDataSource.findByName(name);
  }

  async findSystemRoles(): Promise<IRoleModel[]> {
    return this.roleDataSource.findSystemRoles();
  }

  async findActive(): Promise<IRoleModel[]> {
    return this.roleDataSource.findActive();
  }

  async assignPermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    return this.roleDataSource.assignPermission(roleId, permissionId);
  }

  async removePermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    return this.roleDataSource.removePermission(roleId, permissionId);
  }

  async getPermissionById(permissionId: EntityId): Promise<any> {
    return this.roleDataSource.getPermissionById(permissionId);
  }

  async getAllPermissions(): Promise<any[]> {
    return this.roleDataSource.getAllPermissions();
  }

  async addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null> {
    return this.roleDataSource.addPermissionsToRole(roleId, permissionIds);
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null> {
    return this.roleDataSource.removePermissionsFromRole(roleId, permissionIds);
  }
}
