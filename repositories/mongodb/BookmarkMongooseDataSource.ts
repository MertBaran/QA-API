import { injectable, inject } from 'tsyringe';
import { IDataSource } from '../interfaces/IDataSource';
import { IBookmarkModel } from '../../models/interfaces/IBookmarkModel';
import { EntityId } from '../../types/database';
import BookmarkMongo, {
  IBookmarkMongo,
} from '../../models/mongodb/BookmarkMongoModel';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';

@injectable()
export class BookmarkMongooseDataSource implements IDataSource<IBookmarkModel> {
  constructor(@inject('ILoggerProvider') private logger: ILoggerProvider) {}

  async create(
    data: Omit<IBookmarkModel, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<IBookmarkModel> {
    const bookmark = new BookmarkMongo(data);
    const savedBookmark = await bookmark.save();

    this.logger.info('Bookmark created in MongoDB', {
      bookmarkId: savedBookmark._id.toString(),
      userId: data.user_id,
      targetType: data.target_type,
    });

    return this.mapToModel(savedBookmark);
  }

  async findById(id: EntityId): Promise<IBookmarkModel> {
    const bookmark = await BookmarkMongo.findById(id);
    if (!bookmark) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.mapToModel(bookmark);
  }

  async findAll(): Promise<IBookmarkModel[]> {
    const bookmarks = await BookmarkMongo.find().sort({ createdAt: -1 });
    return bookmarks.map(this.mapToModel);
  }

  async update(
    id: EntityId,
    data: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel> {
    const updatedBookmark = await BookmarkMongo.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (updatedBookmark) {
      this.logger.info('Bookmark updated in MongoDB', {
        bookmarkId: id.toString(),
      });
    }

    if (!updatedBookmark) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.mapToModel(updatedBookmark);
  }

  async updateById(
    id: EntityId,
    data: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel> {
    return this.update(id, data);
  }

  async deleteById(id: EntityId): Promise<IBookmarkModel> {
    const bookmark = await BookmarkMongo.findByIdAndDelete(id);
    const deleted = !!bookmark;

    if (deleted) {
      this.logger.info('Bookmark deleted from MongoDB', { bookmarkId: id });
    }

    if (!bookmark) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.DELETE_BY_ID_ERROR.en
      );
    }
    return this.mapToModel(bookmark);
  }

  async findByField(
    field: keyof IBookmarkModel,
    value: any
  ): Promise<IBookmarkModel[]> {
    const bookmarks = await BookmarkMongo.find({ [field]: value }).sort({
      createdAt: -1,
    });
    return bookmarks.map(this.mapToModel);
  }

  async findByFields(
    fields: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel[]> {
    const bookmarks = await BookmarkMongo.find(fields).sort({
      createdAt: -1,
    });
    return bookmarks.map(this.mapToModel);
  }

  async delete(id: EntityId): Promise<boolean> {
    const result = await BookmarkMongo.findByIdAndDelete(id);
    const deleted = !!result;

    if (deleted) {
      this.logger.info('Bookmark deleted from MongoDB', { bookmarkId: id });
    }

    return deleted;
  }

  async countAll(): Promise<number> {
    return await BookmarkMongo.countDocuments();
  }

  async deleteAll(): Promise<number> {
    const result = await BookmarkMongo.deleteMany({});
    this.logger.info('All bookmarks deleted from MongoDB', {
      deletedCount: result.deletedCount,
    });
    return result.deletedCount || 0;
  }

  async findOneByFields(
    fields: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel> {
    const bookmark = await BookmarkMongo.findOne(fields);
    if (!bookmark) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.mapToModel(bookmark);
  }

  private mapToModel(mongoBookmark: IBookmarkMongo): IBookmarkModel {
    return {
      _id: mongoBookmark._id.toString(),
      user_id: mongoBookmark.user_id.toString(),
      target_type: mongoBookmark.target_type,
      target_id: mongoBookmark.target_id.toString(),
      target_data: {
        title: mongoBookmark.target_data.title,
        content: mongoBookmark.target_data.content,
        author: mongoBookmark.target_data.author,
        authorId: mongoBookmark.target_data.authorId?.toString(),
        created_at: mongoBookmark.target_data.created_at,
        url: mongoBookmark.target_data.url,
      },
      tags: mongoBookmark.tags,
      notes: mongoBookmark.notes,
      is_public: mongoBookmark.is_public,
      createdAt: mongoBookmark.createdAt,
      updatedAt: mongoBookmark.updatedAt,
    };
  }
}
