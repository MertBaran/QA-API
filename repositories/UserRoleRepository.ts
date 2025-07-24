import { injectable, inject } from 'tsyringe';
import { IUserRoleModel } from '../models/interfaces/IUserRoleModel';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { IUserRoleRepository } from './interfaces/IUserRoleRepository';
import { IDataSource } from './interfaces/IDataSource';

@injectable()
export class UserRoleRepository
  extends BaseRepository<IUserRoleModel>
  implements IUserRoleRepository
{
  constructor(
    @inject('IUserRoleDataSource') dataSource: IDataSource<IUserRoleModel>
  ) {
    super(dataSource);
  }

  async findByUserId(userId: EntityId): Promise<IUserRoleModel[]> {
    const allUserRoles = await this.dataSource.findAll();
    return allUserRoles.filter(userRole => userRole.userId === userId);
  }

  async findByUserIdAndActive(userId: EntityId): Promise<IUserRoleModel[]> {
    const allUserRoles = await this.dataSource.findAll();
    return allUserRoles.filter(
      userRole => userRole.userId === userId && userRole.isActive
    );
  }

  async findByRoleId(roleId: EntityId): Promise<IUserRoleModel[]> {
    const allUserRoles = await this.dataSource.findAll();
    return allUserRoles.filter(userRole => userRole.roleId === roleId);
  }

  async findByUserIdAndRoleId(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel | null> {
    const allUserRoles = await this.dataSource.findAll();
    return (
      allUserRoles.find(
        userRole => userRole.userId === userId && userRole.roleId === roleId
      ) || null
    );
  }

  async assignRoleToUser(
    userId: EntityId,
    roleId: EntityId,
    assignedBy?: EntityId
  ): Promise<IUserRoleModel> {
    return await this.dataSource.create({
      userId,
      roleId,
      assignedAt: new Date(),
      assignedBy,
      isActive: true,
    });
  }

  async removeRoleFromUser(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel | null> {
    const userRole = await this.findByUserIdAndRoleId(userId, roleId);
    if (!userRole) return null;

    return await this.dataSource.updateById(userRole._id, { isActive: false });
  }

  async deactivateExpiredRoles(): Promise<number> {
    const allUserRoles = await this.dataSource.findAll();
    const now = new Date();
    let deactivatedCount = 0;

    for (const userRole of allUserRoles) {
      if (userRole.expiresAt && userRole.expiresAt < now && userRole.isActive) {
        await this.dataSource.updateById(userRole._id, { isActive: false });
        deactivatedCount++;
      }
    }

    return deactivatedCount;
  }
}
