import { IUserRoleService } from '../../../services/contracts/IUserRoleService';
import { IUserRoleModel } from '../../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../../types/database';

export class FakeUserRoleService implements IUserRoleService {
  private userRoles: IUserRoleModel[] = [];

  async getUserRoles(userId: EntityId): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => ur.userId === userId);
  }

  async getUserActiveRoles(userId: EntityId): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => ur.userId === userId && ur.isActive);
  }

  async assignRoleToUser(
    userId: EntityId,
    roleId: EntityId,
    assignedBy?: EntityId
  ): Promise<IUserRoleModel> {
    const userRole: IUserRoleModel = {
      _id: `userrole_${Date.now()}`,
      userId,
      roleId,
      assignedAt: new Date(),
      assignedBy,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userRoles.push(userRole);
    return userRole;
  }

  async removeRoleFromUser(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel | null> {
    const index = this.userRoles.findIndex(
      ur => ur.userId === userId && ur.roleId === roleId
    );
    if (index === -1) return null;

    const userRole = this.userRoles[index];
    if (userRole) {
      userRole.isActive = false;
      userRole.updatedAt = new Date();
      return userRole;
    }
    return null;
  }

  async hasRole(userId: EntityId, roleId: EntityId): Promise<boolean> {
    return this.userRoles.some(
      ur => ur.userId === userId && ur.roleId === roleId && ur.isActive
    );
  }

  async hasAnyRole(userId: EntityId, roleIds: EntityId[]): Promise<boolean> {
    return this.userRoles.some(
      ur => ur.userId === userId && roleIds.includes(ur.roleId) && ur.isActive
    );
  }

  async hasAllRoles(userId: EntityId, roleIds: EntityId[]): Promise<boolean> {
    const userRoleIds = this.userRoles
      .filter(ur => ur.userId === userId && ur.isActive)
      .map(ur => ur.roleId);

    return roleIds.every(roleId => userRoleIds.includes(roleId));
  }

  async deactivateExpiredRoles(): Promise<number> {
    const now = new Date();
    let count = 0;

    this.userRoles.forEach(ur => {
      if (ur.expiresAt && ur.expiresAt < now && ur.isActive) {
        ur.isActive = false;
        ur.updatedAt = new Date();
        count++;
      }
    });

    return count;
  }
}
