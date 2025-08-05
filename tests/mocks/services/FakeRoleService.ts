import { IRoleService } from '../../../services/contracts/IRoleService';
import { IRoleModel } from '../../../models/interfaces/IRoleModel';
import { EntityId } from '../../../types/database';

export class FakeRoleService implements IRoleService {
  private roles: IRoleModel[] = [
    {
      _id: 'role1',
      name: 'admin',
      description: 'Administrator role',
      permissions: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'role2',
      name: 'moderator',
      description: 'Moderator role',
      permissions: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'role3',
      name: 'user',
      description: 'User role',
      permissions: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async findById(roleId: EntityId): Promise<IRoleModel | null> {
    return this.roles.find(role => role._id === roleId) || null;
  }

  async findByName(name: string): Promise<IRoleModel | null> {
    return this.roles.find(role => role.name === name) || null;
  }

  async findAll(): Promise<IRoleModel[]> {
    return this.roles;
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

  async create(roleData: Partial<IRoleModel>): Promise<IRoleModel> {
    const newRole: IRoleModel = {
      _id: `role${Date.now()}`,
      name: roleData.name || 'new-role',
      description: roleData.description || '',
      permissions: roleData.permissions || [],
      isSystem: roleData.isSystem || false,
      isActive: roleData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.roles.push(newRole);
    return newRole;
  }

  async updateById(
    roleId: EntityId,
    data: Partial<IRoleModel>
  ): Promise<IRoleModel | null> {
    const roleIndex = this.roles.findIndex(role => role._id === roleId);
    if (roleIndex === -1) return null;

    this.roles[roleIndex] = {
      ...this.roles[roleIndex],
      ...data,
      updatedAt: new Date(),
    } as IRoleModel;
    return this.roles[roleIndex];
  }

  async deleteById(roleId: EntityId): Promise<boolean> {
    const roleIndex = this.roles.findIndex(role => role._id === roleId);
    if (roleIndex === -1) return false;

    this.roles.splice(roleIndex, 1);
    return true;
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
    return role || null;
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
    return role || null;
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
    return role || null;
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
    return role || null;
  }
}
