import { injectable, inject } from 'tsyringe';
import { IRoleService } from '../contracts/IRoleService';
import { IRoleModel } from '../../models/interfaces/IRoleModel';
import { EntityId } from '../../types/database';
import { IRoleRepository } from '../../repositories/interfaces/IRoleRepository';
import CustomError from '../../helpers/error/CustomError';
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
        throw new CustomError(RoleServiceMessages.RoleExists.en, 400);
      }

      const newRole = await this.roleRepository.create(role);
      if (!newRole) {
        throw new CustomError(RoleServiceMessages.RoleCreateError.en, 500);
      }

      return newRole;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(RoleServiceMessages.RoleCreateError.en, 500);
    }
  }

  async findById(id: EntityId): Promise<IRoleModel | null> {
    try {
      return await this.roleRepository.findById(id);
    } catch (_error) {
      throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
    }
  }

  async findByName(name: string): Promise<IRoleModel | null> {
    try {
      return await this.roleRepository.findByName(name);
    } catch (_error) {
      throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
    }
  }

  async findAll(): Promise<IRoleModel[]> {
    try {
      return await this.roleRepository.findAll();
    } catch (_error) {
      throw new CustomError(RoleServiceMessages.RoleListError.en, 500);
    }
  }

  async updateById(
    id: EntityId,
    data: Partial<IRoleModel>
  ): Promise<IRoleModel | null> {
    try {
      const role = await this.roleRepository.updateById(id, data);
      if (!role) {
        throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
      }
      return role;
    } catch (_error) {
      if (_error instanceof CustomError) {
        throw _error;
      }
      throw new CustomError(RoleServiceMessages.RoleUpdateError.en, 500);
    }
  }

  async deleteById(id: EntityId): Promise<boolean> {
    try {
      const deleted = await this.roleRepository.deleteById(id);
      if (!deleted) {
        throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
      }
      return true;
    } catch (_error) {
      if (_error instanceof CustomError) {
        throw _error;
      }
      throw new CustomError(RoleServiceMessages.RoleDeleteError.en, 500);
    }
  }

  async getDefaultRole(): Promise<IRoleModel> {
    try {
      const defaultRole = await this.roleRepository.findByName('user');
      if (!defaultRole) {
        throw new CustomError(RoleServiceMessages.DefaultRoleNotFound.en, 404);
      }
      return defaultRole;
    } catch (_error) {
      if (_error instanceof CustomError) {
        throw _error;
      }
      throw new CustomError(RoleServiceMessages.DefaultRoleNotFound.en, 404);
    }
  }

  async getSystemRoles(): Promise<IRoleModel[]> {
    try {
      return await this.roleRepository.findSystemRoles();
    } catch (_error) {
      throw new CustomError(RoleServiceMessages.RoleListError.en, 500);
    }
  }

  async getActiveRoles(): Promise<IRoleModel[]> {
    try {
      return await this.roleRepository.findActive();
    } catch (_error) {
      throw new CustomError(RoleServiceMessages.RoleListError.en, 500);
    }
  }

  async assignPermissionToRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    try {
      const role = await this.roleRepository.assignPermission(
        roleId,
        permissionId
      );
      if (!role) {
        throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
      }
      return role;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(RoleServiceMessages.RoleUpdateError.en, 500);
    }
  }

  async removePermissionFromRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    try {
      const role = await this.roleRepository.removePermission(
        roleId,
        permissionId
      );
      if (!role) {
        throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
      }
      return role;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(RoleServiceMessages.RoleUpdateError.en, 500);
    }
  }

  async getPermissionById(permissionId: EntityId): Promise<any> {
    try {
      return await this.roleRepository.getPermissionById(permissionId);
    } catch (error) {
      throw new CustomError('Permission not found', 404);
    }
  }

  async getAllPermissions(): Promise<any[]> {
    try {
      return await this.roleRepository.getAllPermissions();
    } catch (error) {
      throw new CustomError('Failed to get permissions', 500);
    }
  }

  async addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null> {
    try {
      const role = await this.roleRepository.addPermissionsToRole(
        roleId,
        permissionIds
      );
      if (!role) {
        throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
      }
      return role;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(RoleServiceMessages.RoleUpdateError.en, 500);
    }
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null> {
    try {
      const role = await this.roleRepository.removePermissionsFromRole(
        roleId,
        permissionIds
      );
      if (!role) {
        throw new CustomError(RoleServiceMessages.RoleNotFound.en, 404);
      }
      return role;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(RoleServiceMessages.RoleUpdateError.en, 500);
    }
  }
}
