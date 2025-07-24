import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';
import bcrypt from 'bcryptjs';

export class FakeUserDataSource implements IDataSource<IUserModel> {
  private store: Map<string, IUserModel> = new Map();

  async create(data: Partial<IUserModel>): Promise<IUserModel> {
    const _id = (data._id ||
      Math.random().toString(36).substr(2, 9)) as EntityId;

    // Hash password like Mongoose pre-save hook
    let password = data.password || '';
    if (password) {
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);
    }

    const user: IUserModel = {
      _id,
      name: data.name || '',
      email: data.email || '',
      // roles: data.roles || [], // TODO: UserRole tablosundan al
      password, // Use hashed password
      profile_image: data.profile_image || 'default.jpg',
      blocked: data.blocked ?? false,
      // Don't spread data here to avoid overriding hashed password
      title: data.title,
      about: data.about,
      place: data.place,
      website: data.website,
      resetPasswordToken: data.resetPasswordToken,
      resetPasswordExpire: data.resetPasswordExpire,
      lastPasswordChange: data.lastPasswordChange,
      createdAt: data.createdAt || new Date(),
    };
    this.store.set(_id, user);
    return user;
  }

  async findById(id: string): Promise<IUserModel | null> {
    return this.store.get(id) || null;
  }

  async findAll(): Promise<IUserModel[]> {
    return Array.from(this.store.values());
  }

  async updateById(
    id: string,
    data: Partial<IUserModel>
  ): Promise<IUserModel | null> {
    const user = this.store.get(id);
    if (!user) return null;
    const updated = { ...user, ...data };
    this.store.set(id, updated);
    return updated;
  }

  async deleteById(id: string): Promise<IUserModel | null> {
    const user = this.store.get(id);
    if (!user) return null;
    this.store.delete(id);
    return user;
  }

  async countAll(): Promise<number> {
    return this.store.size;
  }

  async deleteAll(): Promise<number> {
    const count = this.store.size;
    this.store.clear();
    return count;
  }

  // Add this method to support findByEmailWithPassword like UserMongooseDataSource
  async findByEmailWithPassword(email: string): Promise<IUserModel | null> {
    const users = Array.from(this.store.values());
    return users.find(user => user.email === email) || null;
  }

  // Add findByEmail method for test compatibility
  async findByEmail(email: string): Promise<IUserModel | null> {
    return this.findByEmailWithPassword(email);
  }
}
