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
    return await this.dataSource.create(data);
  }

  async findById(id: EntityId): Promise<TEntity | null> {
    return await this.dataSource.findById(id.toString());
  }

  async findAll(): Promise<TEntity[]> {
    return await this.dataSource.findAll();
  }

  async updateById(
    id: EntityId,
    data: Partial<TEntity>
  ): Promise<TEntity | null> {
    return await this.dataSource.updateById(id.toString(), data);
  }

  async deleteById(id: EntityId): Promise<TEntity | null> {
    return await this.dataSource.deleteById(id.toString());
  }

  public async countAll(): Promise<number> {
    return await this.dataSource.countAll();
  }

  public async deleteAll(): Promise<any> {
    return await this.dataSource.deleteAll();
  }
}
