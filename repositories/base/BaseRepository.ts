import { EntityId } from '../../types/database';
import { IDataSource } from '../interfaces/IDataSource';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

export abstract class BaseRepository<TEntity> {
  protected readonly dataSource: IDataSource<TEntity>;

  constructor(dataSource: IDataSource<TEntity>) {
    this.dataSource = dataSource;
  }

  async create(data: Partial<TEntity>): Promise<TEntity> {
    return await this.dataSource.create(data);
  }

  async findById(id: EntityId): Promise<TEntity> {
    const entity = await this.dataSource.findById(id.toString());
    if (!entity) {
      throw ApplicationError.notFoundError('Resource not found');
    }
    return entity;
  }

  async findAll(): Promise<TEntity[]> {
    return await this.dataSource.findAll();
  }

  async updateById(id: EntityId, data: Partial<TEntity>): Promise<TEntity> {
    const entity = await this.dataSource.updateById(id.toString(), data);
    if (!entity) {
      throw ApplicationError.notFoundError('Resource not found');
    }
    return entity;
  }

  async deleteById(id: EntityId): Promise<TEntity> {
    const entity = await this.dataSource.deleteById(id.toString());
    if (!entity) {
      throw ApplicationError.notFoundError('Resource not found');
    }
    return entity;
  }

  public async countAll(): Promise<number> {
    return await this.dataSource.countAll();
  }

  public async deleteAll(): Promise<any> {
    return await this.dataSource.deleteAll();
  }
}
