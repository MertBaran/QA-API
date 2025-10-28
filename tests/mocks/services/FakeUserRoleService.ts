import { IUserRoleService } from '../../../services/contracts/IUserRoleService';
import { IUserRoleModel } from '../../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../../types/database';

export class FakeUserRoleService implements IUserRoleService {
  private userRoles: IUserRoleModel[] = [];

  addUserRole(userId: string, roleId: string, assignedBy: string): void {
    this.userRoles.push({
      _id: `ur_${Date.now()}_${Math.random()}`,
      userId,
      roleId,
      assignedAt: new Date(),
      assignedBy,
      expiresAt: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  assignRoleToUser = jest
    .fn()
    .mockImplementation(
      async (
        userId: EntityId,
        roleId: EntityId,
        assignedBy: EntityId
      ): Promise<IUserRoleModel> => {
        const userRole: IUserRoleModel = {
          _id: `ur_${Date.now()}_${Math.random()}`,
          userId,
          roleId,
          assignedAt: new Date(),
          assignedBy,
          expiresAt: undefined,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.userRoles.push(userRole);
        return userRole;
      }
    );

  removeRoleFromUser = jest
    .fn()
    .mockImplementation(
      async (
        userId: EntityId,
        roleId: EntityId
      ): Promise<IUserRoleModel | null> => {
        const index = this.userRoles.findIndex(
          ur => ur.userId === userId && ur.roleId === roleId && ur.isActive
        );
        if (index === -1) return null;

        const userRole = this.userRoles[index];
        if (!userRole) return null;

        userRole.isActive = false;
        userRole.updatedAt = new Date();
        return userRole;
      }
    );

  getUserActiveRoles = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IUserRoleModel[]> => {
      return this.userRoles.filter(ur => ur.userId === userId && ur.isActive);
    });

  getUserRoles = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IUserRoleModel[]> => {
      return this.userRoles.filter(ur => ur.userId === userId);
    });

  async getRoleUsers(roleId: EntityId): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => ur.roleId === roleId && ur.isActive);
  }

  async isUserAssignedToRole(
    userId: EntityId,
    roleId: EntityId
  ): Promise<boolean> {
    return this.userRoles.some(
      ur => ur.userId === userId && ur.roleId === roleId && ur.isActive
    );
  }

  async updateById(
    id: EntityId,
    data: Partial<IUserRoleModel>
  ): Promise<IUserRoleModel | null> {
    const index = this.userRoles.findIndex(ur => ur._id === id);
    if (index === -1) return null;

    const existingUserRole = this.userRoles[index];
    if (!existingUserRole) return null;

    this.userRoles[index] = {
      ...existingUserRole,
      ...data,
      updatedAt: new Date(),
    } as IUserRoleModel;

    return this.userRoles[index];
  }

  async deactivateUserRole(
    userId: EntityId,
    roleId: EntityId
  ): Promise<boolean> {
    const index = this.userRoles.findIndex(
      ur => ur.userId === userId && ur.roleId === roleId && ur.isActive
    );
    if (index === -1) return false;

    const userRole = this.userRoles[index];
    if (!userRole) return false;

    userRole.isActive = false;
    userRole.updatedAt = new Date();
    return true;
  }

  async activateUserRole(userId: EntityId, roleId: EntityId): Promise<boolean> {
    const index = this.userRoles.findIndex(
      ur => ur.userId === userId && ur.roleId === roleId
    );
    if (index === -1) return false;

    const userRole = this.userRoles[index];
    if (!userRole) return false;

    userRole.isActive = true;
    userRole.updatedAt = new Date();
    return true;
  }

  async getExpiredUserRoles(): Promise<IUserRoleModel[]> {
    const now = new Date();
    return this.userRoles.filter(
      ur => ur.expiresAt && ur.expiresAt < now && ur.isActive
    );
  }

  async extendUserRole(
    userId: EntityId,
    roleId: EntityId,
    newExpiryDate: Date
  ): Promise<boolean> {
    const index = this.userRoles.findIndex(
      ur => ur.userId === userId && ur.roleId === roleId
    );
    if (index === -1) return false;

    const userRole = this.userRoles[index];
    if (!userRole) return false;

    userRole.expiresAt = newExpiryDate;
    userRole.updatedAt = new Date();
    return true;
  }

  async getRoleAssignmentHistory(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(
      ur => ur.userId === userId && ur.roleId === roleId
    );
  }

  async getBulkUserRoles(userIds: EntityId[]): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => userIds.includes(ur.userId));
  }

  async assignMultipleRolesToUser(
    userId: EntityId,
    roleIds: EntityId[],
    assignedBy: EntityId
  ): Promise<IUserRoleModel[]> {
    const userRoles: IUserRoleModel[] = [];

    for (const roleId of roleIds) {
      const userRole = await this.assignRoleToUser(userId, roleId, assignedBy);
      userRoles.push(userRole);
    }

    return userRoles;
  }

  async removeMultipleRolesFromUser(
    userId: EntityId,
    roleIds: EntityId[]
  ): Promise<boolean> {
    let allRemoved = true;

    for (const roleId of roleIds) {
      const removed = await this.removeRoleFromUser(userId, roleId);
      if (!removed) {
        allRemoved = false;
      }
    }

    return allRemoved;
  }

  async getRoleStatistics(): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    expiredAssignments: number;
  }> {
    const totalAssignments = this.userRoles.length;
    const activeAssignments = this.userRoles.filter(ur => ur.isActive).length;
    const expiredAssignments = this.userRoles.filter(
      ur => ur.expiresAt && ur.expiresAt < new Date()
    ).length;

    return {
      totalAssignments,
      activeAssignments,
      expiredAssignments,
    };
  }

  // IUserRoleService interface'den eksik metodlar
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
    const userRoles = this.userRoles.filter(
      ur => ur.userId === userId && ur.isActive
    );
    const userRoleIds = userRoles.map(ur => ur.roleId);
    return roleIds.every(roleId => userRoleIds.includes(roleId));
  }

  async deactivateExpiredRoles(): Promise<number> {
    const now = new Date();
    let deactivatedCount = 0;

    for (let i = 0; i < this.userRoles.length; i++) {
      const userRole = this.userRoles[i];
      if (
        userRole &&
        userRole.expiresAt &&
        userRole.expiresAt < now &&
        userRole.isActive
      ) {
        userRole.isActive = false;
        userRole.updatedAt = new Date();
        deactivatedCount++;
      }
    }

    return deactivatedCount;
  }

  async findByUserIdAndRoleId(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel> {
    const userRole = this.userRoles.find(
      ur => ur.userId === userId && ur.roleId === roleId
    );
    if (!userRole) {
      throw new Error('UserRole not found');
    }
    return userRole;
  }
}
