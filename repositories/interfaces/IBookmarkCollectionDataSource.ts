import { IBookmarkCollectionModel } from '../../models/interfaces/IBookmarkModel';
import { EntityId } from '../../types/database';

export interface IBookmarkCollectionDataSource {
  create(
    data: Omit<IBookmarkCollectionModel, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<IBookmarkCollectionModel>;
  findById(id: EntityId): Promise<IBookmarkCollectionModel | null>;
  findByUserId(userId: EntityId): Promise<IBookmarkCollectionModel[]>;
  updateById(
    id: EntityId,
    data: Partial<IBookmarkCollectionModel>
  ): Promise<IBookmarkCollectionModel | null>;
  deleteById(id: EntityId): Promise<boolean>;
}
