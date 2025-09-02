import { IRoleService } from '../../../services/contracts/IRoleService';
import { IRoleModel } from '../../../models/interfaces/IRoleModel';
import { EntityId } from '../../../types/database';

export class FakeRoleService implements IRoleService {
  private roles: IRoleModel[] = [];

  addRole(role: IRoleModel): void {
    this.roles.push(role);
  }

  async create(roleData: Partial<IRoleModel>): Promise<IRoleModel> {
    const role: IRoleModel = {
      _id: `role_${Date.now()}`,
      name: roleData.name || 'Test Role',
      description: roleData.description || 'Test description',
      permissions: roleData.permissions || [],
      isActive: roleData.isActive !== undefined ? roleData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IRoleModel;

    this.roles.push(role);
    return role;
  }

  findById = jest.fn().mockImplementation(async (roleId: EntityId): Promise<IRoleModel | null> => {
    const role = this.roles.find(r => r._id === roleId);
    return role || null;
  });

  findAll = jest.fn().mockImplementation(async (): Promise<IRoleModel[]> => {
    return this.roles;
  });

  async updateById(
    roleId: EntityId,
    updateData: Partial<IRoleModel>
  ): Promise<IRoleModel | null> {
    const index = this.roles.findIndex(r => r._id === roleId);
    if (index === -1) return null;

    const existingRole = this.roles[index];
    if (!existingRole) return null;

    this.roles[index] = {
      ...existingRole,
      ...updateData,
      updatedAt: new Date(),
    } as IRoleModel;

    return this.roles[index];
  }

  async deleteById(roleId: EntityId): Promise<boolean> {
    const index = this.roles.findIndex(r => r._id === roleId);
    if (index === -1) return false;

    this.roles.splice(index, 1);
    return true;
  }

  async findByName(name: string): Promise<IRoleModel | null> {
    const role = this.roles.find(r => r.name === name);
    return role || null;
  }

  async findActiveRoles(): Promise<IRoleModel[]> {
    return this.roles.filter(r => r.isActive);
  }

  getAllPermissions = jest.fn().mockImplementation(async (): Promise<string[]> => {
    const allPermissions = new Set<string>();
    this.roles.forEach(role => {
      role.permissions.forEach(permission => allPermissions.add(permission));
    });
    return Array.from(allPermissions);
  });

  async addPermissionsToRole(
    roleId: EntityId,
    permissions: string[]
  ): Promise<IRoleModel | null> {
    const role = await this.findById(roleId);
    if (!role) return null;

    const updatedPermissions = [
      ...new Set([...role.permissions, ...permissions]),
    ];
    return this.updateById(roleId, { permissions: updatedPermissions });
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissions: string[]
  ): Promise<IRoleModel | null> {
    const role = await this.findById(roleId);
    if (!role) return null;

    const updatedPermissions = role.permissions.filter(
      (p: string) => !permissions.includes(p)
    );
    return this.updateById(roleId, { permissions: updatedPermissions });
  }

  async getRolePermissions(roleId: EntityId): Promise<string[]> {
    const role = await this.findById(roleId);
    return role ? role.permissions : [];
  }

  async isPermissionInRole(
    roleId: EntityId,
    permission: string
  ): Promise<boolean> {
    const role = await this.findById(roleId);
    return role ? role.permissions.includes(permission) : false;
  }

  async getRolesByPermission(permission: string): Promise<IRoleModel[]> {
    return this.roles.filter(role => role.permissions.includes(permission));
  }

  async getRoleStatistics(): Promise<{
    totalRoles: number;
    activeRoles: number;
    inactiveRoles: number;
    totalPermissions: number;
  }> {
    const totalRoles = this.roles.length;
    const activeRoles = this.roles.filter(r => r.isActive).length;
    const inactiveRoles = totalRoles - activeRoles;
    const allPermissions = new Set<string>();

    this.roles.forEach(role => {
      role.permissions.forEach(permission => allPermissions.add(permission));
    });

    return {
      totalRoles,
      activeRoles,
      inactiveRoles,
      totalPermissions: allPermissions.size,
    };
  }

  // IRoleService interface'den eksik metodlar
  async getDefaultRole(): Promise<IRoleModel> {
    const defaultRole =
      this.roles.find(r => r.name === 'user') || this.roles[0];
    if (!defaultRole) {
      throw new Error('No default role found');
    }
    return defaultRole;
  }

  async getSystemRoles(): Promise<IRoleModel[]> {
    return this.roles.filter(r => r.isSystem === true);
  }

  async getActiveRoles(): Promise<IRoleModel[]> {
    return this.roles.filter(r => r.isActive);
  }

  async assignPermissionToRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    const role = await this.findById(roleId);
    if (!role) return null;

    if (!role.permissions.includes(permissionId)) {
      role.permissions.push(permissionId);
      return this.updateById(roleId, { permissions: role.permissions });
    }
    return role;
  }

  async removePermissionFromRole(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel | null> {
    const role = await this.findById(roleId);
    if (!role) return null;

    const updatedPermissions = role.permissions.filter((p: string) => p !== permissionId);
    return this.updateById(roleId, { permissions: updatedPermissions });
  }

  async getPermissionById(permissionId: EntityId): Promise<any> {
    // Test ortamında basit bir permission objesi döndür
    return { _id: permissionId, name: 'test-permission' };
  }
}
