import { injectable, inject } from 'tsyringe';
import { IPermissionService } from '../contracts/IPermissionService';
import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { EntityId } from '../../types/database';
import { IPermissionRepository } from '../../repositories/interfaces/IPermissionRepository';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { PermissionServiceMessages } from '../constants/ServiceMessages';

@injectable()
export class PermissionManager implements IPermissionService {
  constructor(
    @inject('IPermissionRepository')
    private permissionRepository: IPermissionRepository
  ) {}

  async create(
    permission: Partial<IPermissionModel>
  ): Promise<IPermissionModel> {
    try {
      const existingPermission = await this.permissionRepository.findByName(
        permission.name!
      );
      if (existingPermission) {
        throw ApplicationError.businessError(
          PermissionServiceMessages.PermissionExists.en,
          400
        );
      }

      const newPermission = await this.permissionRepository.create(permission);
      if (!newPermission) {
        throw ApplicationError.systemError(
          PermissionServiceMessages.PermissionCreateError.en,
          500
        );
      }

      return newPermission;
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.systemError(
        PermissionServiceMessages.PermissionCreateError.en,
        500
      );
    }
  }

  async findById(id: EntityId): Promise<IPermissionModel> {
    try {
      const permission = await this.permissionRepository.findById(id);
      if (!permission) {
        throw ApplicationError.notFoundError(
          PermissionServiceMessages.PermissionNotFound.en
        );
      }
      return permission;
    } catch (_error) {
      throw ApplicationError.notFoundError(
        PermissionServiceMessages.PermissionNotFound.en
      );
    }
  }

  async findByName(name: string): Promise<IPermissionModel> {
    try {
      const permission = await this.permissionRepository.findByName(name);
      if (!permission) {
        throw ApplicationError.notFoundError(
          PermissionServiceMessages.PermissionNotFound.en
        );
      }
      return permission;
    } catch (_error) {
      throw ApplicationError.notFoundError(
        PermissionServiceMessages.PermissionNotFound.en
      );
    }
  }

  async findAll(): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findAll();
    } catch (_error) {
      throw ApplicationError.systemError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }

  async updateById(
    id: EntityId,
    data: Partial<IPermissionModel>
  ): Promise<IPermissionModel> {
    try {
      const updated = await this.permissionRepository.updateById(id, data);
      if (!updated) {
        throw ApplicationError.notFoundError(
          PermissionServiceMessages.PermissionNotFound.en
        );
      }
      return updated;
    } catch (_error) {
      if (_error instanceof ApplicationError) {
        throw _error;
      }
      throw ApplicationError.systemError(
        PermissionServiceMessages.PermissionUpdateError.en,
        500
      );
    }
  }

  async deleteById(id: EntityId): Promise<IPermissionModel> {
    try {
      const deleted = await this.permissionRepository.deleteById(id);
      if (!deleted) {
        throw ApplicationError.notFoundError(
          PermissionServiceMessages.PermissionNotFound.en
        );
      }
      return deleted;
    } catch (_error) {
      if (_error instanceof ApplicationError) {
        throw _error;
      }
      throw ApplicationError.systemError(
        PermissionServiceMessages.PermissionDeleteError.en,
        500
      );
    }
  }

  async findByResource(resource: string): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findByResource(resource);
    } catch (_error) {
      throw ApplicationError.systemError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }

  async findByCategory(category: string): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findByCategory(category);
    } catch (_error) {
      throw ApplicationError.systemError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }

  async getActivePermissions(): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findActive();
    } catch (_error) {
      throw ApplicationError.systemError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }
}
