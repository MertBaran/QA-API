import { injectable, inject } from 'tsyringe';
import { IPermissionService } from '../contracts/IPermissionService';
import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { EntityId } from '../../types/database';
import { IPermissionRepository } from '../../repositories/interfaces/IPermissionRepository';
import CustomError from '../../helpers/error/CustomError';
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
        throw new CustomError(
          PermissionServiceMessages.PermissionExists.en,
          400
        );
      }

      const newPermission = await this.permissionRepository.create(permission);
      if (!newPermission) {
        throw new CustomError(
          PermissionServiceMessages.PermissionCreateError.en,
          500
        );
      }

      return newPermission;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        PermissionServiceMessages.PermissionCreateError.en,
        500
      );
    }
  }

  async findById(id: EntityId): Promise<IPermissionModel | null> {
    try {
      return await this.permissionRepository.findById(id);
    } catch (_error) {
      throw new CustomError(
        PermissionServiceMessages.PermissionNotFound.en,
        404
      );
    }
  }

  async findByName(name: string): Promise<IPermissionModel | null> {
    try {
      return await this.permissionRepository.findByName(name);
    } catch (_error) {
      throw new CustomError(
        PermissionServiceMessages.PermissionNotFound.en,
        404
      );
    }
  }

  async findAll(): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findAll();
    } catch (_error) {
      throw new CustomError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }

  async updateById(
    id: EntityId,
    data: Partial<IPermissionModel>
  ): Promise<IPermissionModel | null> {
    try {
      const permission = await this.permissionRepository.updateById(id, data);
      if (!permission) {
        throw new CustomError(
          PermissionServiceMessages.PermissionNotFound.en,
          404
        );
      }
      return permission;
    } catch (_error) {
      if (_error instanceof CustomError) {
        throw _error;
      }
      throw new CustomError(
        PermissionServiceMessages.PermissionUpdateError.en,
        500
      );
    }
  }

  async deleteById(id: EntityId): Promise<boolean> {
    try {
      const deleted = await this.permissionRepository.deleteById(id);
      if (!deleted) {
        throw new CustomError(
          PermissionServiceMessages.PermissionNotFound.en,
          404
        );
      }
      return true;
    } catch (_error) {
      if (_error instanceof CustomError) {
        throw _error;
      }
      throw new CustomError(
        PermissionServiceMessages.PermissionDeleteError.en,
        500
      );
    }
  }

  async findByResource(resource: string): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findByResource(resource);
    } catch (_error) {
      throw new CustomError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }

  async findByCategory(category: string): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findByCategory(category);
    } catch (_error) {
      throw new CustomError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }

  async getActivePermissions(): Promise<IPermissionModel[]> {
    try {
      return await this.permissionRepository.findActive();
    } catch (_error) {
      throw new CustomError(
        PermissionServiceMessages.PermissionListError.en,
        500
      );
    }
  }
}
