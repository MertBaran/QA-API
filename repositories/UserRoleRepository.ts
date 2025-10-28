import { injectable, inject } from 'tsyringe';
import { IUserRoleModel } from '../models/interfaces/IUserRoleModel';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { IUserRoleRepository } from './interfaces/IUserRoleRepository';
import { IDataSource } from './interfaces/IDataSource';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import { RepositoryConstants } from './constants/RepositoryMessages';

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

  async findByRoleId(roleId: EntityId): Promise<IUserRoleModel[]> {
    return await this.dataSource.findByField('roleId', roleId);
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
  ): Promise<IUserRoleModel> {
    const userRole = (await this.dataSource.findByField(
      'userId',
      userId
    )) as IUserRoleModel[];
    const userRoleToUpdate = userRole.find(
      userRole => userRole.roleId === roleId
    );
    if (!userRoleToUpdate) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.USER_ROLE.NOT_FOUND_ERROR.en
      );
    }
    return (await this.updateById(userRoleToUpdate._id.toString(), {
      isActive: false,
    })) as IUserRoleModel;
  }

  async findByUserId(userId: EntityId): Promise<IUserRoleModel[]> {
    return await this.dataSource.findByField('userId', userId);
  }

  async findByUserIdAndRoleId(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel> {
    const userRoles = await this.findByUserId(userId);
    const userRole = userRoles.find(userRole => userRole.roleId === roleId);
    if (!userRole) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.USER_ROLE.NOT_FOUND_ERROR.en
      );
    }
    return userRole;
  }
}
