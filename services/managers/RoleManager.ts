import { injectable, inject } from 'tsyringe';
import { IRoleService } from '../contracts/IRoleService';
import { IRoleModel } from '../../models/interfaces/IRoleModel';
import { EntityId } from '../../types/database';
import { IRoleRepository } from '../../repositories/interfaces/IRoleRepository';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RoleServiceMessages } from '../constants/ServiceMessages';

@injectable()
export class RoleManager implements IRoleService {
  constructor(
    @inject('IRoleRepository') private roleRepository: IRoleRepository
  ) {}

  async create(role: Partial<IRoleModel>): Promise<IRoleModel> {
    try {
      const existingRole = await this.roleRepository.findByName(role.name!);
      if (existingRole) {
        throw ApplicationError.businessError(
          RoleServiceMessages.RoleExists.en,
          400
        );
      }

      return await this.roleRepository.create(role);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleCreateError.en,
        500
      );
    }
  }

  async findById(id: EntityId): Promise<IRoleModel> {
    try {
      const role = await this.roleRepository.findById(id);
      if (!role) {
        throw ApplicationError.notFoundError(
          RoleServiceMessages.RoleNotFound.en
        );
      }
      return role;
    } catch (_error) {
      throw ApplicationError.notFoundError(RoleServiceMessages.RoleNotFound.en);
    }
  }

  async findByName(name: string): Promise<IRoleModel> {
    try {
      const role = await this.roleRepository.findByName(name);
      if (!role) {
        throw ApplicationError.notFoundError(
          RoleServiceMessages.RoleNotFound.en
        );
      }
      return role;
    } catch (_error) {
      throw ApplicationError.notFoundError(RoleServiceMessages.RoleNotFound.en);
    }
  }

  async findAll(): Promise<IRoleModel[]> {
    try {
      return await this.roleRepository.findAll();
    } catch (_error) {
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleListError.en,
        500
      );
    }
  }

  async updateById(
    id: EntityId,
    data: Partial<IRoleModel>
  ): Promise<IRoleModel | null> {
    try {
      const role = await this.roleRepository.updateById(id, data);
      if (!role) {
        throw ApplicationError.notFoundError(
          RoleServiceMessages.RoleNotFound.en
        );
      }
      return role;
    } catch (_error) {
      if (_error instanceof ApplicationError) {
        throw _error;
      }
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleUpdateError.en,
        500
      );
    }
  }

  async deleteById(id: EntityId): Promise<boolean> {
    try {
      const deleted = await this.roleRepository.deleteById(id);
      if (!deleted) {
        throw ApplicationError.notFoundError(
          RoleServiceMessages.RoleNotFound.en
        );
      }
      return true;
    } catch (_error) {
      if (_error instanceof ApplicationError) {
        throw _error;
      }
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleDeleteError.en,
        500
      );
    }
  }

  async getDefaultRole(): Promise<IRoleModel> {
    try {
      const defaultRole = await this.roleRepository.findByName('user');
      if (!defaultRole) {
        throw ApplicationError.notFoundError(
          RoleServiceMessages.DefaultRoleNotFound.en
        );
      }
      return defaultRole;
    } catch (_error) {
      if (_error instanceof ApplicationError) {
        throw _error;
      }
      throw ApplicationError.notFoundError(
        RoleServiceMessages.DefaultRoleNotFound.en
      );
    }
  }

  async getSystemRoles(): Promise<IRoleModel[]> {
    try {
      return await this.roleRepository.findSystemRoles();
    } catch (_error) {
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleListError.en,
        500
      );
    }
  }

  async getActiveRoles(): Promise<IRoleModel[]> {
    try {
      return await this.roleRepository.findActive();
    } catch (_error) {
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleListError.en,
        500
      );
    }
  }

  async assignPermissionToRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel> {
    try {
      return await this.roleRepository.assignPermission(roleId, permissionId);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleUpdateError.en,
        500
      );
    }
  }

  async removePermissionFromRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel> {
    try {
      return await this.roleRepository.removePermission(roleId, permissionId);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleUpdateError.en,
        500
      );
    }
  }

  async getPermissionById(permissionId: EntityId): Promise<any> {
    try {
      return await this.roleRepository.getPermissionById(permissionId);
    } catch (error) {
      throw ApplicationError.notFoundError('Permission not found');
    }
  }

  async getAllPermissions(): Promise<any[]> {
    try {
      return await this.roleRepository.getAllPermissions();
    } catch (error) {
      throw ApplicationError.systemError('Failed to get permissions', 500);
    }
  }

  async addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel> {
    try {
      return await this.roleRepository.addPermissionsToRole(
        roleId,
        permissionIds
      );
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleUpdateError.en,
        500
      );
    }
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel> {
    try {
      return await this.roleRepository.removePermissionsFromRole(
        roleId,
        permissionIds
      );
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.systemError(
        RoleServiceMessages.RoleUpdateError.en,
        500
      );
    }
  }
}
