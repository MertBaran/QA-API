import { injectable } from 'tsyringe';
import { IBookmarkCollectionDataSource } from '../interfaces/IBookmarkCollectionDataSource';
import { IBookmarkCollectionModel } from '../../models/interfaces/IBookmarkModel';
import { EntityId } from '../../types/database';
import BookmarkCollectionMongo from '../../models/mongodb/BookmarkCollectionMongoModel';

@injectable()
export class BookmarkCollectionMongooseDataSource
  implements IBookmarkCollectionDataSource
{
  private toModel(doc: any): IBookmarkCollectionModel {
    return {
      _id: doc._id.toString(),
      user_id: doc.user_id.toString(),
      name: doc.name,
      description: doc.description,
      color: doc.color,
      is_public: doc.is_public,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(
    data: Omit<IBookmarkCollectionModel, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<IBookmarkCollectionModel> {
    const collection = new BookmarkCollectionMongo(data);
    const saved = await collection.save();
    return this.toModel(saved);
  }

  async findById(id: EntityId): Promise<IBookmarkCollectionModel | null> {
    const doc = await BookmarkCollectionMongo.findById(id);
    return doc ? this.toModel(doc) : null;
  }

  async findByUserId(userId: EntityId): Promise<IBookmarkCollectionModel[]> {
    const docs = await BookmarkCollectionMongo.find({ user_id: userId }).sort({
      updatedAt: -1,
    });
    return docs.map((d: any) => this.toModel(d));
  }

  async updateById(
    id: EntityId,
    data: Partial<IBookmarkCollectionModel>
  ): Promise<IBookmarkCollectionModel | null> {
    const doc = await BookmarkCollectionMongo.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );
    return doc ? this.toModel(doc) : null;
  }

  async deleteById(id: EntityId): Promise<boolean> {
    const result = await BookmarkCollectionMongo.findByIdAndDelete(id);
    return !!result;
  }
}
