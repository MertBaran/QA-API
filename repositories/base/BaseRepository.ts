import { EntityId } from '../../types/database';
import { IDataSource } from '../interfaces/IDataSource';
import CustomError from '../../helpers/error/CustomError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

export abstract class BaseRepository<TEntity> {
  protected readonly dataSource: IDataSource<TEntity>;

  constructor(dataSource: IDataSource<TEntity>) {
    this.dataSource = dataSource;
  }

  async create(data: Partial<TEntity>): Promise<TEntity> {
    try {
      return await this.dataSource.create(data);
    } catch (_err) {
      console.error('BaseRepository create error:', _err);
      throw new CustomError(RepositoryConstants.BASE.CREATE_ERROR.en, 500);
    }
  }

  async findById(id: EntityId): Promise<TEntity | null> {
    try {
      return await this.dataSource.findById(id.toString());
    } catch (_err) {
      console.error('BaseRepository findById error:', _err);
      throw new CustomError(RepositoryConstants.BASE.FIND_BY_ID_ERROR.en, 500);
    }
  }

  async findAll(): Promise<TEntity[]> {
    try {
      return await this.dataSource.findAll();
    } catch (_err) {
      throw new CustomError(RepositoryConstants.BASE.FIND_ALL_ERROR.en, 500);
    }
  }

  async updateById(
    id: EntityId,
    data: Partial<TEntity>
  ): Promise<TEntity | null> {
    try {
      return await this.dataSource.updateById(id.toString(), data);
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en,
        500
      );
    }
  }

  async deleteById(id: EntityId): Promise<TEntity | null> {
    try {
      return await this.dataSource.deleteById(id.toString());
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.BASE.DELETE_BY_ID_ERROR.en,
        500
      );
    }
  }

  public async countAll(): Promise<number> {
    try {
      return await this.dataSource.countAll();
    } catch (_err) {
      throw new CustomError(RepositoryConstants.BASE.COUNT_ALL_ERROR.en, 500);
    }
  }

  public async deleteAll(): Promise<any> {
    try {
      return await this.dataSource.deleteAll();
    } catch (_err) {
      throw new CustomError(RepositoryConstants.BASE.DELETE_ALL_ERROR.en, 500);
    }
  }
}
