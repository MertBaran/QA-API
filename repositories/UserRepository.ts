import { injectable, inject } from 'tsyringe';
import { IUserModel } from '../models/interfaces/IUserModel';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { IUserRepository } from './interfaces/IUserRepository';
import { IDataSource } from './interfaces/IDataSource';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import { RepositoryConstants } from './constants/RepositoryMessages';

@injectable()
export class UserRepository
  extends BaseRepository<IUserModel>
  implements IUserRepository
{
  constructor(@inject('IUserDataSource') dataSource: IDataSource<IUserModel>) {
    super(dataSource);
  }

  async findByEmail(email: string): Promise<IUserModel> {
    // IDataSource'a özel bir metot yoksa, findAll ile filtreleme yapılabilir veya IDataSource'a özel metot eklenebilir
    const all = await this.dataSource.findAll();
    const user = all.find(user => user.email === email);
    if (!user) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel> {
    // Eğer dataSource'da özel metot varsa onu kullan
    if (
      typeof (this.dataSource as any).findByEmailWithPassword === 'function'
    ) {
      return (this.dataSource as any).findByEmailWithPassword(email);
    }
    // Uyarı: Bu fallback, password alanı select:false ise undefined dönebilir
    const all = await this.dataSource.findAll();
    const user = all.find(user => user.email === email);
    if (!user) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return user;
  }

  async findByResetToken(token: string): Promise<IUserModel> {
    const all = await this.dataSource.findAll();
    const user = all.find(
      user =>
        user.resetPasswordToken === token &&
        user.resetPasswordExpire &&
        user.resetPasswordExpire > new Date()
    );
    if (!user) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return user;
  }

  async updateResetToken(
    userId: EntityId,
    resetToken: string,
    resetExpire: Date
  ): Promise<IUserModel> {
    const user = await this.dataSource.findById(userId);
    if (!user) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.dataSource.updateById(user._id.toString(), {
      resetPasswordToken: resetToken,
      resetPasswordExpire: resetExpire,
    });
  }

  async clearResetToken(userId: EntityId): Promise<IUserModel> {
    const user = await this.dataSource.findById(userId);
    if (!user) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.dataSource.updateById(user._id.toString(), {
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined,
    });
  }

  async findActive(): Promise<IUserModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(user => !user.blocked);
  }

  override async countAll(): Promise<number> {
    const all = await this.dataSource.findAll();
    return all.length;
  }
}
