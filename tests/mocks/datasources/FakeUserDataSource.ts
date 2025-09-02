import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';
import bcrypt from 'bcryptjs';

export class FakeUserDataSource implements IDataSource<IUserModel> {
  private users: IUserModel[] = [];

  create = jest
    .fn()
    .mockImplementation(
      async (data: Partial<IUserModel>): Promise<IUserModel> => {
        let storedPassword = data.password || 'hashedpassword';
        // Eğer password zaten bcrypt hash değilse hashle
        if (storedPassword && !/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
          storedPassword = await bcrypt.hash(storedPassword, 10);
        }
        const user: IUserModel = {
          _id: `u_${Date.now()}_${Math.random()}`,
          email: data.email || 'test@example.com',
          password: storedPassword,
          name: data.name || 'Test User',
          profile_image: data.profile_image || 'default-avatar.jpg',
          blocked: data.blocked !== undefined ? data.blocked : false,
          createdAt: data.createdAt || new Date(),
        };
        this.users.push(user);
        return user;
      }
    );

  findById = jest
    .fn()
    .mockImplementation(async (id: string): Promise<IUserModel | null> => {
      return this.users.find(u => u._id === id) || null;
    });

  findAll = jest.fn().mockImplementation(async (): Promise<IUserModel[]> => {
    return [...this.users];
  });

  updateById = jest
    .fn()
    .mockImplementation(
      async (
        id: string,
        data: Partial<IUserModel>
      ): Promise<IUserModel | null> => {
        const index = this.users.findIndex(u => u._id === id);
        if (index === -1) return null;

        const user = this.users[index];
        if (!user) return null;

        this.users[index] = { ...user, ...data };
        return this.users[index];
      }
    );

  deleteById = jest
    .fn()
    .mockImplementation(async (id: string): Promise<IUserModel | null> => {
      const index = this.users.findIndex(u => u._id === id);
      if (index === -1) return null;

      const deletedUser = this.users[index];
      if (!deletedUser) return null;

      this.users.splice(index, 1);
      return deletedUser;
    });

  findByField = jest
    .fn()
    .mockImplementation(
      async (field: keyof IUserModel, value: any): Promise<IUserModel[]> => {
        return this.users.filter(u => u[field] === value);
      }
    );

  findByFields = jest
    .fn()
    .mockImplementation(
      async (fields: Partial<IUserModel>): Promise<IUserModel[]> => {
        return this.users.filter(u => {
          return Object.entries(fields).every(
            ([key, value]) => u[key as keyof IUserModel] === value
          );
        });
      }
    );

  countAll = jest.fn().mockImplementation(async (): Promise<number> => {
    return this.users.length;
  });

  deleteAll = jest.fn().mockImplementation(async (): Promise<number> => {
    const count = this.users.length;
    this.users = [];
    return count;
  });

  findByEmail = jest
    .fn()
    .mockImplementation(async (email: string): Promise<IUserModel | null> => {
      return this.users.find(u => u.email === email) || null;
    });

  clear = jest.fn().mockImplementation((): void => {
    this.users = [];
  });
}
