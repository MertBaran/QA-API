import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IUserRoleModel } from '../../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../../types/database';

export class FakeUserRoleDataSource implements IDataSource<IUserRoleModel> {
  private userRoles: IUserRoleModel[] = [];

  addUserRole = jest
    .fn()
    .mockImplementation((userRole: IUserRoleModel): void => {
      this.userRoles.push(userRole);
    });

  create = jest
    .fn()
    .mockImplementation(async (userRoleData: any): Promise<IUserRoleModel> => {
      const userRole: IUserRoleModel = {
        _id: `ur_${Date.now()}`,
        userId: userRoleData.userId,
        roleId: userRoleData.roleId,
        assignedBy: userRoleData.assignedBy,
        assignedAt: new Date(),
        isActive:
          userRoleData.isActive !== undefined ? userRoleData.isActive : true,
        expiresAt: userRoleData.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IUserRoleModel;

      this.userRoles.push(userRole);
      return userRole;
    });

  findById = jest
    .fn()
    .mockImplementation(
      async (id: EntityId): Promise<IUserRoleModel | null> => {
        const userRole = this.userRoles.find(ur => ur._id === id);
        return userRole || null;
      }
    );

  findAll = jest
    .fn()
    .mockImplementation(async (): Promise<IUserRoleModel[]> => {
      return this.userRoles;
    });

  updateById = jest
    .fn()
    .mockImplementation(
      async (id: EntityId, updateData: any): Promise<IUserRoleModel | null> => {
        const index = this.userRoles.findIndex(ur => ur._id === id);
        if (index === -1) return null;

        const existingUserRole = this.userRoles[index];
        if (!existingUserRole) return null;

        this.userRoles[index] = {
          ...existingUserRole,
          ...updateData,
          updatedAt: new Date(),
        } as IUserRoleModel;

        return this.userRoles[index];
      }
    );

  deleteById = jest
    .fn()
    .mockImplementation(
      async (id: EntityId): Promise<IUserRoleModel | null> => {
        const index = this.userRoles.findIndex(ur => ur._id === id);
        if (index === -1) return null;

        const deletedUserRole = this.userRoles[index];
        if (!deletedUserRole) return null;

        this.userRoles.splice(index, 1);
        return deletedUserRole;
      }
    );

  findByUserId = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IUserRoleModel[]> => {
      return this.userRoles.filter(ur => ur.userId === userId);
    });

  findByRoleId = jest
    .fn()
    .mockImplementation(async (roleId: EntityId): Promise<IUserRoleModel[]> => {
      return this.userRoles.filter(ur => ur.roleId === roleId);
    });

  findActiveByUserId = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IUserRoleModel[]> => {
      return this.userRoles.filter(ur => ur.userId === userId && ur.isActive);
    });

  findActiveByRoleId = jest
    .fn()
    .mockImplementation(async (roleId: EntityId): Promise<IUserRoleModel[]> => {
      return this.userRoles.filter(ur => ur.roleId === roleId && ur.isActive);
    });

  deactivateByUserId = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<boolean> => {
      const userRoles = this.userRoles.filter(ur => ur.userId === userId);
      userRoles.forEach(ur => {
        ur.isActive = false;
      });
      return userRoles.length > 0;
    });

  deactivateByRoleId = jest
    .fn()
    .mockImplementation(async (roleId: EntityId): Promise<boolean> => {
      const userRoles = this.userRoles.filter(ur => ur.roleId === roleId);
      userRoles.forEach(ur => {
        ur.isActive = false;
      });
      return userRoles.length > 0;
    });

  isUserAssignedToRole = jest
    .fn()
    .mockImplementation(
      async (userId: EntityId, roleId: EntityId): Promise<boolean> => {
        return this.userRoles.some(
          ur => ur.userId === userId && ur.roleId === roleId && ur.isActive
        );
      }
    );

  assignRoleToUser = jest
    .fn()
    .mockImplementation(
      async (
        userId: EntityId,
        roleId: EntityId,
        assignedBy: EntityId
      ): Promise<IUserRoleModel> => {
        const userRole: IUserRoleModel = {
          _id: `ur_${Date.now()}`,
          userId,
          roleId,
          assignedBy,
          assignedAt: new Date(),
          isActive: true,
          expiresAt: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as IUserRoleModel;

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

  getRoleUsers = jest
    .fn()
    .mockImplementation(async (roleId: EntityId): Promise<IUserRoleModel[]> => {
      return this.userRoles.filter(ur => ur.roleId === roleId && ur.isActive);
    });

  // IDataSource interface'den eksik metodlar
  findByField = jest
    .fn()
    .mockImplementation(
      async (
        field: keyof IUserRoleModel,
        value: any
      ): Promise<IUserRoleModel[]> => {
        return this.userRoles.filter(ur => (ur as any)[field] === value);
      }
    );

  findByFields = jest
    .fn()
    .mockImplementation(
      async (fields: Partial<IUserRoleModel>): Promise<IUserRoleModel[]> => {
        return this.userRoles.filter(ur => {
          return Object.entries(fields).every(
            ([key, value]) => (ur as any)[key] === value
          );
        });
      }
    );

  countAll = jest.fn().mockImplementation(async (): Promise<number> => {
    return this.userRoles.length;
  });

  deleteAll = jest.fn().mockImplementation(async (): Promise<number> => {
    const count = this.userRoles.length;
    this.userRoles = [];
    return count;
  });
}
