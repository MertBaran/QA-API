import { injectable, inject } from 'tsyringe';
import {
  IUserService,
  UserFilters,
  UsersResponse,
  UserStats,
} from '../contracts/IUserService';
import { IUserModel } from '../../models/interfaces/IUserModel';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { IUserRoleService } from '../contracts/IUserRoleService';
import { IRoleService } from '../contracts/IRoleService';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { IAdminService } from '../contracts/IAdminService';
import { EntityId } from '../../types/database';

@injectable()
export class AdminManager implements IAdminService {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IUserRoleService') private userRoleService: IUserRoleService,
    @inject('IRoleService') private roleService: IRoleService
  ) {}

  // IAdminService: tek kullanıcı getir
  async getSingleUser(userId: EntityId): Promise<IUserModel | null> {
    return await this.userRepository.findById(userId);
  }

  // IAdminService: tüm kullanıcıları getir
  async getAllUsers(): Promise<IUserModel[]> {
    return await this.userRepository.findAll();
  }

  // IAdminService: kullanıcıyı engelle
  async blockUser(userId: EntityId): Promise<IUserModel> {
    const user = await this.userRepository.updateById(String(userId), {
      blocked: true,
    } as Partial<IUserModel>);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  // IAdminService: kullanıcıyı sil
  async deleteUser(userId: EntityId): Promise<void> {
    const deleted = await this.userRepository.deleteById(String(userId));
    if (!deleted) {
      throw ApplicationError.notFoundError('User not found');
    }
  }

  // Kullanıcıları admin için getir
  async getUsersForAdmin(
    filters: UserFilters,
    page: number,
    limit: number
  ): Promise<UsersResponse> {
    const offset = (page - 1) * limit;
    const users = await this.userRepository.findAll();

    // Her kullanıcı için rollerini al ve rol isimlerine çevir
    const usersWithRoles = await Promise.all(
      users.map(async user => {
        const userRoles = await this.userRoleService.getUserActiveRoles(
          user._id
        );

        // Rol ID'lerini rol isimlerine çevir
        const roleNames = await Promise.all(
          userRoles.map(async ur => {
            const role = await this.roleService.findById(ur.roleId);
            return role?.name || ur.roleId;
          })
        );

        return {
          ...user,
          roles: roleNames,
        };
      })
    );

    // Basit filtreleme - gerçek implementasyonda repository'de yapılacak
    let filteredUsers = usersWithRoles;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchType = filters.searchType || 'contains';

      filteredUsers = filteredUsers.filter(user => {
        const email = user.email.toLowerCase();
        const name = user.name?.toLowerCase() || '';

        switch (searchType) {
          case 'starts_with':
            return email.startsWith(searchTerm) || name.startsWith(searchTerm);
          case 'ends_with':
            return email.endsWith(searchTerm) || name.endsWith(searchTerm);
          case 'exact':
            return email === searchTerm || name === searchTerm;
          case 'contains':
          default:
            return email.includes(searchTerm) || name.includes(searchTerm);
        }
      });
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        filteredUsers = filteredUsers.filter(user => !user.blocked);
      } else if (filters.status === 'blocked') {
        filteredUsers = filteredUsers.filter(user => user.blocked);
      }
    }

    if (filters.role && filters.role !== 'all') {
      filteredUsers = filteredUsers.filter(
        user => user.roles && user.roles.includes(filters.role!)
      );
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateOperator = filters.dateOperator || 'after';
      const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

      filteredUsers = filteredUsers.filter(user => {
        if (!user.createdAt) return false;
        const userCreatedAt = new Date(user.createdAt);

        switch (dateOperator) {
          case 'after':
            return dateFrom ? userCreatedAt >= dateFrom : true;
          case 'before':
            return dateTo ? userCreatedAt <= dateTo : true;
          case 'between':
            return (
              (dateFrom ? userCreatedAt >= dateFrom : true) &&
              (dateTo ? userCreatedAt <= dateTo : true)
            );
          case 'exact':
            if (dateFrom && dateTo) {
              return userCreatedAt >= dateFrom && userCreatedAt <= dateTo;
            } else if (dateFrom) {
              return userCreatedAt.toDateString() === dateFrom.toDateString();
            }
            return true;
          default:
            return true;
        }
      });
    }

    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
    };
  }

  // Kullanıcıyı admin tarafından güncelle
  async updateUserByAdmin(
    userId: string,
    userData: Partial<IUserModel>
  ): Promise<IUserModel> {
    const user = await this.userRepository.updateById(userId, userData);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  // Kullanıcıyı admin tarafından sil
  async deleteUserByAdmin(userId: string): Promise<void> {
    const deleted = await this.userRepository.deleteById(userId);
    if (!deleted) {
      throw ApplicationError.notFoundError('User not found');
    }
  }

  // Kullanıcı engelle/engel kaldır
  async toggleUserBlock(userId: string, blocked: boolean): Promise<IUserModel> {
    const user = await this.userRepository.updateById(userId, { blocked });
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  // Kullanıcı rollerini güncelle
  async updateUserRoles(userId: string, roles: string[]): Promise<IUserModel> {
    // roles alanı IUserModel'de yok, bu yüzden any kullanıyoruz
    const user = await this.userRepository.updateById(userId, {
      roles,
    } as any);
    if (!user) {
      throw ApplicationError.notFoundError('User not found');
    }
    return user;
  }

  // Kullanıcı istatistikleri
  async getUserStats(): Promise<UserStats> {
    const allUsers = await this.userRepository.findAll();
    const activeUsers = allUsers.filter(user => !user.blocked);
    const blockedUsers = allUsers.filter(user => user.blocked);

    // Basit istatistikler - gerçek implementasyonda daha detaylı olacak
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = allUsers.filter(
      user => user.createdAt && new Date(user.createdAt) >= thisMonth
    ).length;

    return {
      total: allUsers.length,
      active: activeUsers.length,
      blocked: blockedUsers.length,
      online: 0, // Gerçek implementasyonda online kullanıcı sayısı hesaplanacak
      newThisMonth,
    };
  }
}
