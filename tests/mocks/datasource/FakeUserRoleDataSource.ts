import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IUserRoleModel } from '../../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../../types/database';

export class FakeUserRoleDataSource implements IDataSource<IUserRoleModel> {
  private userRoles: IUserRoleModel[] = [];

  addUserRole(userRole: IUserRoleModel): void {
    this.userRoles.push(userRole);
  }

  async create(data: Partial<IUserRoleModel>): Promise<IUserRoleModel> {
    const userRole: IUserRoleModel = {
      _id: `ur_${Date.now()}_${Math.random()}`,
      userId: data.userId!,
      roleId: data.roleId!,
      assignedAt: data.assignedAt || new Date(),
      assignedBy: data.assignedBy,
      expiresAt: data.expiresAt,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IUserRoleModel;

    this.userRoles.push(userRole);
    return userRole;
  }

  async findById(id: EntityId): Promise<IUserRoleModel | null> {
    const userRole = this.userRoles.find(ur => ur._id === id);
    return userRole || null;
  }

  async findAll(): Promise<IUserRoleModel[]> {
    return this.userRoles;
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

  async deleteById(id: EntityId): Promise<IUserRoleModel | null> {
    const index = this.userRoles.findIndex(ur => ur._id === id);
    if (index === -1) return null;

    const deletedUserRole = this.userRoles[index];
    if (!deletedUserRole) return null;

    this.userRoles.splice(index, 1);
    return deletedUserRole;
  }

  async findByUserId(userId: EntityId): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => ur.userId === userId);
  }

  async findByRoleId(roleId: EntityId): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => ur.roleId === roleId);
  }

  async findActiveByUserId(userId: EntityId): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => ur.userId === userId && ur.isActive);
  }

  async findActiveByRoleId(roleId: EntityId): Promise<IUserRoleModel[]> {
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

  async findExpiredUserRoles(): Promise<IUserRoleModel[]> {
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
      const userRole = await this.create({
        userId,
        roleId,
        assignedBy,
      });
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
      const removed = await this.deactivateUserRole(userId, roleId);
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

  // IDataSource interface'den eksik metodlar
  async findByField(
    field: keyof IUserRoleModel,
    value: any
  ): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => (ur as any)[field] === value);
  }

  async findByFields(
    fields: Partial<IUserRoleModel>
  ): Promise<IUserRoleModel[]> {
    return this.userRoles.filter(ur => {
      return Object.entries(fields).every(
        ([key, value]) => (ur as any)[key] === value
      );
    });
  }

  async countAll(): Promise<number> {
    return this.userRoles.length;
  }

  async deleteAll(): Promise<number> {
    const count = this.userRoles.length;
    this.userRoles = [];
    return count;
  }
}
