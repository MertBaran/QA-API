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
import CustomError from '../../helpers/error/CustomError';

@injectable()
export class AdminManager {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IUserRoleService') private userRoleService: IUserRoleService,
    @inject('IRoleService') private roleService: IRoleService
  ) {}

  // Kullanıcıları admin için getir
  async getUsersForAdmin(
    filters: UserFilters,
    page: number,
    limit: number
  ): Promise<UsersResponse> {
    try {
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
              return (
                email.startsWith(searchTerm) || name.startsWith(searchTerm)
              );
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
    } catch (error) {
      throw new CustomError('Failed to fetch users', 500);
    }
  }

  // Kullanıcıyı admin tarafından güncelle
  async updateUserByAdmin(
    userId: string,
    userData: Partial<IUserModel>
  ): Promise<IUserModel> {
    try {
      const user = await this.userRepository.updateById(userId, userData);
      if (!user) {
        throw new CustomError('User not found', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update user', 500);
    }
  }

  // Kullanıcıyı admin tarafından sil
  async deleteUserByAdmin(userId: string): Promise<void> {
    try {
      const deleted = await this.userRepository.deleteById(userId);
      if (!deleted) {
        throw new CustomError('User not found', 404);
      }
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete user', 500);
    }
  }

  // Kullanıcı engelle/engel kaldır
  async toggleUserBlock(userId: string, blocked: boolean): Promise<IUserModel> {
    try {
      const user = await this.userRepository.updateById(userId, { blocked });
      if (!user) {
        throw new CustomError('User not found', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to toggle user block status', 500);
    }
  }

  // Kullanıcı rollerini güncelle
  async updateUserRoles(userId: string, roles: string[]): Promise<IUserModel> {
    try {
      // roles alanı IUserModel'de yok, bu yüzden any kullanıyoruz
      const user = await this.userRepository.updateById(userId, {
        roles,
      } as any);
      if (!user) {
        throw new CustomError('User not found', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update user roles', 500);
    }
  }

  // Kullanıcı istatistikleri
  async getUserStats(): Promise<UserStats> {
    try {
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
    } catch (error) {
      throw new CustomError('Failed to fetch user stats', 500);
    }
  }
}
