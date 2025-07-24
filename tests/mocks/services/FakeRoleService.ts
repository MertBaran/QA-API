import { IRoleService } from '../../../services/contracts/IRoleService';
import { IRoleModel } from '../../../models/interfaces/IRoleModel';
import { EntityId } from '../../../types/database';

export class FakeRoleService implements IRoleService {
  private roles: IRoleModel[] = [];

  async create(roleData: Partial<IRoleModel>): Promise<IRoleModel> {
    const role: IRoleModel = {
      _id: `role_${Date.now()}`,
      name: roleData.name || 'default',
      description: roleData.description || '',
      permissions: roleData.permissions || [],
      isSystem: roleData.isSystem || false,
      isActive: roleData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.roles.push(role);
    return role;
  }

  async findById(id: EntityId): Promise<IRoleModel | null> {
    return this.roles.find(role => role._id === id) || null;
  }

  async findByName(name: string): Promise<IRoleModel | null> {
    return this.roles.find(role => role.name === name) || null;
  }

  async findAll(): Promise<IRoleModel[]> {
    return this.roles;
  }

  async updateById(
    id: EntityId,
    updateData: Partial<IRoleModel>
  ): Promise<IRoleModel | null> {
    const index = this.roles.findIndex(role => role._id === id);
    if (index === -1) return null;

    const updatedRole: IRoleModel = {
      ...this.roles[index],
      ...updateData,
      updatedAt: new Date(),
    } as IRoleModel;
    this.roles[index] = updatedRole;
    return updatedRole;
  }

  async deleteById(id: EntityId): Promise<boolean> {
    const index = this.roles.findIndex(role => role._id === id);
    if (index === -1) return false;

    this.roles.splice(index, 1);
    return true;
  }

  async getDefaultRole(): Promise<IRoleModel> {
    const defaultRole = this.roles.find(role => role.name === 'user');
    if (!defaultRole) {
      throw new Error('Default role not found');
    }
    return defaultRole;
  }

  async getSystemRoles(): Promise<IRoleModel[]> {
    return this.roles.filter(role => role.isSystem);
  }

  async getActiveRoles(): Promise<IRoleModel[]> {
    return this.roles.filter(role => role.isActive);
  }

  async assignPermissionToRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    const role = this.roles.find(r => r._id === roleId);
    if (!role) return null;

    if (!role.permissions.includes(permissionId)) {
      role.permissions.push(permissionId);
      role.updatedAt = new Date();
    }
    return role;
  }

  async removePermissionFromRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    const role = this.roles.find(r => r._id === roleId);
    if (!role) return null;

    const index = role.permissions.indexOf(permissionId);
    if (index > -1) {
      role.permissions.splice(index, 1);
      role.updatedAt = new Date();
    }
    return role;
  }

  async getPermissionById(permissionId: EntityId): Promise<any> {
    return { _id: permissionId, name: 'test-permission' };
  }

  async getAllPermissions(): Promise<any[]> {
    return [
      { _id: 'perm1', name: 'test-permission-1' },
      { _id: 'perm2', name: 'test-permission-2' },
    ];
  }

  async addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null> {
    const role = this.roles.find(r => r._id === roleId);
    if (!role) return null;

    permissionIds.forEach(permissionId => {
      if (!role.permissions.includes(permissionId)) {
        role.permissions.push(permissionId);
      }
    });
    role.updatedAt = new Date();
    return role;
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel | null> {
    const role = this.roles.find(r => r._id === roleId);
    if (!role) return null;

    permissionIds.forEach(permissionId => {
      const index = role.permissions.indexOf(permissionId);
      if (index > -1) {
        role.permissions.splice(index, 1);
      }
    });
    role.updatedAt = new Date();
    return role;
  }
}
