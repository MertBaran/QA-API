import { injectable, inject } from 'tsyringe';
import { IRoleRepository } from './interfaces/IRoleRepository';
import { IRoleModel } from '../models/interfaces/IRoleModel';
import { IRoleDataSource } from './interfaces/IRoleDataSource';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { RepositoryConstants } from './constants/RepositoryMessages';
import { ApplicationError } from '../infrastructure/error/ApplicationError';

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

  async findByName(name: string): Promise<IRoleModel> {
    const role = await this.roleDataSource.findByName(name);
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return role;
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
  ): Promise<IRoleModel> {
    return this.roleDataSource.assignPermission(roleId, permissionId);
  }

  async removePermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel> {
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
  ): Promise<IRoleModel> {
    return this.roleDataSource.addPermissionsToRole(roleId, permissionIds);
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel> {
    return this.roleDataSource.removePermissionsFromRole(roleId, permissionIds);
  }
}
