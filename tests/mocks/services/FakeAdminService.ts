import { IAdminService } from '../../../services/contracts/IAdminService';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';

export class FakeAdminService implements IAdminService {
  private users: IUserModel[] = [
    {
      _id: 'user_1',
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hashedpassword',
      createdAt: new Date(),
      profile_image: 'default.jpg',
      blocked: false,
    } as IUserModel,
  ];

  addUser = jest.fn((user: IUserModel): void => {
    this.users.push(user);
  });

  getAllUsers = jest
    .fn()
    .mockImplementation(async (): Promise<IUserModel[]> => {
      return this.users;
    });

  getUserById = jest
    .fn()
    .mockImplementation(
      async (userId: EntityId): Promise<IUserModel | null> => {
        return {
          _id: userId,
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashedpassword',
          createdAt: new Date(),
          profile_image: 'default.jpg',
          blocked: false,
        } as IUserModel;
      }
    );

  getSingleUser = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IUserModel> => {
      const user = this.users.find(u => u._id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    });

  updateUser = jest
    .fn()
    .mockImplementation(
      async (userId: EntityId, updateData: any): Promise<IUserModel | null> => {
        const user = this.users.find(u => u._id === userId);
        if (!user) {
          return null;
        }

        // User'ı güncelle
        Object.assign(user, updateData);
        return user;
      }
    );

  deleteUser = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<void> => {
      // Test ortamında hiçbir şey yapma
    });

  blockUser = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IUserModel> => {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    });

  unblockUser = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IUserModel> => {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    });

  getUsersForAdmin = jest
    .fn()
    .mockImplementation(
      async (filters: any, page: number, limit: number): Promise<any> => {
        let filteredUsers = [...this.users];

        if (filters.search) {
          filteredUsers = filteredUsers.filter(
            user =>
              user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
              user.email.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        if (filters.status) {
          filteredUsers = filteredUsers.filter(user =>
            filters.status === 'active' ? !user.blocked : user.blocked
          );
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        return {
          users: paginatedUsers,
          total: filteredUsers.length,
          page,
          limit,
          totalPages: Math.ceil(filteredUsers.length / limit),
        };
      }
    );

  updateUserByAdmin = jest
    .fn()
    .mockImplementation(
      async (userId: EntityId, userData: any): Promise<IUserModel> => {
        const user = await this.updateUser(userId, userData);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      }
    );

  toggleUserBlock = jest
    .fn()
    .mockImplementation(
      async (userId: EntityId, blocked: boolean): Promise<IUserModel> => {
        const user = await this.updateUser(userId, { blocked });
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      }
    );

  deleteUserByAdmin = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<void> => {
      const index = this.users.findIndex(u => u._id === userId);
      if (index !== -1) {
        this.users.splice(index, 1);
      }
    });

  updateUserRoles = jest
    .fn()
    .mockImplementation(async (userId: EntityId, roles: string[]): Promise<IUserModel> => {
      const user = this.users.find(u => u._id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    });

  getUserStats = jest
    .fn()
    .mockImplementation(async (): Promise<any> => {
      return {
        totalUsers: this.users.length,
        activeUsers: this.users.length
      };
    });
}
