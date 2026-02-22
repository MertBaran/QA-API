import { injectable } from 'tsyringe';
import { IBookmarkCollectionItemDataSource } from '../interfaces/IBookmarkCollectionItemDataSource';
import { IBookmarkCollectionItemModel } from '../../models/interfaces/IBookmarkModel';
import { EntityId } from '../../types/database';
import BookmarkCollectionItemMongo from '../../models/mongodb/BookmarkCollectionItemMongoModel';

@injectable()
export class BookmarkCollectionItemMongooseDataSource
  implements IBookmarkCollectionItemDataSource
{
  private toModel(doc: any): IBookmarkCollectionItemModel {
    return {
      _id: doc._id.toString(),
      bookmark_id: doc.bookmark_id.toString(),
      collection_id: doc.collection_id.toString(),
      added_at: doc.added_at,
    };
  }

  async add(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel> {
    const item = new BookmarkCollectionItemMongo({
      bookmark_id: bookmarkId,
      collection_id: collectionId,
    });
    const saved = await item.save();
    return this.toModel(saved);
  }

  async remove(bookmarkId: EntityId, collectionId: EntityId): Promise<boolean> {
    const result = await BookmarkCollectionItemMongo.findOneAndDelete({
      bookmark_id: bookmarkId,
      collection_id: collectionId,
    });
    return !!result;
  }

  async findByCollectionId(
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel[]> {
    const docs = await BookmarkCollectionItemMongo.find({
      collection_id: collectionId,
    }).sort({ added_at: -1 });
    return docs.map((d: any) => this.toModel(d));
  }
}
