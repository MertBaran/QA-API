import { IPermissionService } from '../../../services/contracts/IPermissionService';
import { IPermissionModel } from '../../../models/interfaces/IPermissionModel';
import { EntityId } from '../../../types/database';

export class FakePermissionService implements IPermissionService {
  async findById(id: EntityId): Promise<IPermissionModel | null> {
    return {
      _id: id,
      name: 'fake-permission',
      description: 'Fake permission for testing',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IPermissionModel;
  }

  async findByName(name: string): Promise<IPermissionModel | null> {
    return {
      _id: 'fake-id',
      name,
      description: 'Fake permission for testing',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IPermissionModel;
  }

  async findAll(): Promise<IPermissionModel[]> {
    return [
      {
        _id: 'permission1',
        name: 'system:admin',
        description: 'Admin permission',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'permission2',
        name: 'user:read',
        description: 'User read permission',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as IPermissionModel[];
  }

  async create(
    permissionData: Partial<IPermissionModel>
  ): Promise<IPermissionModel> {
    return {
      _id: 'new-permission-id',
      name: permissionData.name || 'new-permission',
      description: permissionData.description || 'New permission',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IPermissionModel;
  }

  async updateById(
    id: EntityId,
    permissionData: Partial<IPermissionModel>
  ): Promise<IPermissionModel | null> {
    return {
      _id: id,
      name: permissionData.name || 'updated-permission',
      description: permissionData.description || 'Updated permission',
      isActive:
        permissionData.isActive !== undefined ? permissionData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IPermissionModel;
  }

  async deleteById(id: EntityId): Promise<boolean> {
    return true;
  }

  async findByResource(resource: string): Promise<IPermissionModel[]> {
    return [
      {
        _id: 'resource-permission',
        name: `${resource}:read`,
        description: `Read permission for ${resource}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as IPermissionModel[];
  }

  async findByCategory(category: string): Promise<IPermissionModel[]> {
    return [
      {
        _id: 'category-permission',
        name: `${category}:permission`,
        description: `Permission for ${category}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as IPermissionModel[];
  }

  async getActivePermissions(): Promise<IPermissionModel[]> {
    return [
      {
        _id: 'active-permission1',
        name: 'system:admin',
        description: 'Admin permission',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'active-permission2',
        name: 'user:read',
        description: 'User read permission',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as IPermissionModel[];
  }

  // Legacy methods for backward compatibility
  async update(
    id: string,
    permissionData: Partial<IPermissionModel>
  ): Promise<IPermissionModel | null> {
    return this.updateById(id, permissionData);
  }

  async delete(id: string): Promise<boolean> {
    return this.deleteById(id);
  }

  async activate(id: string): Promise<IPermissionModel | null> {
    return this.findById(id);
  }

  async deactivate(id: string): Promise<IPermissionModel | null> {
    return this.findById(id);
  }
}
