import { IBookmarkCollectionItemModel } from '../../models/interfaces/IBookmarkModel';
import { EntityId } from '../../types/database';

export interface IBookmarkCollectionItemDataSource {
  add(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel>;
  remove(bookmarkId: EntityId, collectionId: EntityId): Promise<boolean>;
  findByCollectionId(
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel[]>;
}
