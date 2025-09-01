import { IAdminService } from '../../../services/contracts/IAdminService';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';

export class FakeAdminManager implements IAdminService {
  private users: IUserModel[] = [];

  addUser(user: IUserModel): void {
    this.users.push(user);
  }

  async getAllUsers(): Promise<IUserModel[]> {
    return this.users;
  }

  async getUserById(userId: EntityId): Promise<IUserModel | null> {
    const user = this.users.find(u => u._id === userId);
    return user || null;
  }

  async getSingleUser(userId: EntityId): Promise<IUserModel> {
    const user = this.users.find(u => u._id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(
    userId: EntityId,
    updateData: any
  ): Promise<IUserModel | null> {
    const index = this.users.findIndex(u => u._id === userId);
    if (index === -1) return null;

    const existingUser = this.users[index];
    if (!existingUser) return null;

    this.users[index] = { ...existingUser, ...updateData };
    return this.users[index] || null;
  }

  async deleteUser(userId: EntityId): Promise<void> {
    const index = this.users.findIndex(u => u._id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }

  async blockUser(userId: EntityId): Promise<IUserModel> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.updateUser(userId, { blocked: true }) as Promise<IUserModel>;
  }

  async unblockUser(userId: EntityId): Promise<IUserModel> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.updateUser(userId, { blocked: false }) as Promise<IUserModel>;
  }

  async getUsersForAdmin(
    filters: any,
    page: number,
    limit: number
  ): Promise<any> {
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

  async updateUserByAdmin(
    userId: EntityId,
    userData: any
  ): Promise<IUserModel> {
    const user = await this.updateUser(userId, userData);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async toggleUserBlock(
    userId: EntityId,
    blocked: boolean
  ): Promise<IUserModel> {
    const user = await this.updateUser(userId, { blocked });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async findById(id: EntityId): Promise<IUserModel | null> {
    const index = this.users.findIndex(u => u._id === id);
    if (index === -1) return null;

    const user = this.users[index];
    if (!user) return null;

    return user;
  }
}
