import { injectable, inject } from 'tsyringe';
import { IUserRoleRepository } from '../../repositories/interfaces/IUserRoleRepository';
import { IUserRoleModel } from '../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../types/database';
import { IUserRoleService } from '../contracts/IUserRoleService';

@injectable()
export class UserRoleManager implements IUserRoleService {
  constructor(
    @inject('IUserRoleRepository')
    private userRoleRepository: IUserRoleRepository
  ) {}

  async getUserRoles(userId: EntityId): Promise<IUserRoleModel[]> {
    console.log('getUserRoles', userId);
    return await this.userRoleRepository.findByUserId(userId);
  }

  async getUserActiveRoles(userId: EntityId): Promise<IUserRoleModel[]> {
    return await this.userRoleRepository.findByUserIdAndActive(userId);
  }

  async assignRoleToUser(
    userId: EntityId,
    roleId: EntityId,
    assignedBy?: EntityId
  ): Promise<IUserRoleModel> {
    return await this.userRoleRepository.assignRoleToUser(
      userId,
      roleId,
      assignedBy
    );
  }

  async removeRoleFromUser(
    userId: EntityId,
    roleId: EntityId
  ): Promise<IUserRoleModel> {
    return await this.userRoleRepository.removeRoleFromUser(userId, roleId);
  }

  async hasRole(userId: EntityId, roleId: EntityId): Promise<boolean> {
    const userRole = await this.userRoleRepository.findByUserIdAndRoleId(
      userId,
      roleId
    );
    return userRole !== null && userRole.isActive;
  }

  async hasAnyRole(userId: EntityId, roleIds: EntityId[]): Promise<boolean> {
    const userRoles =
      await this.userRoleRepository.findByUserIdAndActive(userId);
    return userRoles.some(userRole => roleIds.includes(userRole.roleId));
  }

  async hasAllRoles(userId: EntityId, roleIds: EntityId[]): Promise<boolean> {
    const userRoles =
      await this.userRoleRepository.findByUserIdAndActive(userId);
    const userRoleIds = userRoles.map(userRole => userRole.roleId);
    return roleIds.every(roleId => userRoleIds.includes(roleId));
  }

  async deactivateExpiredRoles(): Promise<number> {
    return await this.userRoleRepository.deactivateExpiredRoles();
  }
}
