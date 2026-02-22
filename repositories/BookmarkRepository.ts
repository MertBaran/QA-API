import { injectable, inject } from 'tsyringe';
import { IBookmarkRepository } from './interfaces/IBookmarkRepository';
import {
  IBookmarkModel,
  IBookmarkCollectionModel,
  IBookmarkCollectionItemModel,
  BookmarkTargetType,
} from '../models/interfaces/IBookmarkModel';
import { IDataSource } from './interfaces/IDataSource';
import { IBookmarkCollectionDataSource } from './interfaces/IBookmarkCollectionDataSource';
import { IBookmarkCollectionItemDataSource } from './interfaces/IBookmarkCollectionItemDataSource';
import { EntityId } from '../types/database';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../types/dto/common/pagination.dto';

@injectable()
export class BookmarkRepository implements IBookmarkRepository {
  constructor(
    @inject('IBookmarkDataSource')
    private bookmarkDataSource: IDataSource<IBookmarkModel>,
    @inject('IBookmarkCollectionDataSource')
    private collectionDataSource: IBookmarkCollectionDataSource,
    @inject('IBookmarkCollectionItemDataSource')
    private collectionItemDataSource: IBookmarkCollectionItemDataSource,
    @inject('ILoggerProvider') private logger: ILoggerProvider
  ) {}

  async create(
    data: Omit<IBookmarkModel, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<IBookmarkModel> {
    const bookmark = await this.bookmarkDataSource.create(data);
    this.logger.info('Bookmark created successfully', {
      bookmarkId: bookmark._id,
      userId: data.user_id,
    });
    return bookmark;
  }

  async findById(id: EntityId): Promise<IBookmarkModel> {
    return await this.bookmarkDataSource.findById(id);
  }

  async findAll(): Promise<IBookmarkModel[]> {
    return await this.bookmarkDataSource.findAll();
  }

  async update(
    id: EntityId,
    data: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel> {
    const updated = await this.bookmarkDataSource.updateById(id, data);
    this.logger.info('Bookmark updated successfully', { bookmarkId: id });
    return updated;
  }

  async delete(id: EntityId): Promise<boolean> {
    try {
      const deleted = await this.bookmarkDataSource.deleteById(id);
      if (deleted) {
        this.logger.info('Bookmark deleted successfully', { bookmarkId: id });
      }
      return !!deleted;
    } catch (error) {
      throw ApplicationError.databaseError('Bookmark silinemedi');
    }
  }

  async updateById(
    id: EntityId,
    data: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel> {
    return this.update(id, data);
  }

  async deleteById(id: EntityId): Promise<IBookmarkModel> {
    const deleted = await this.bookmarkDataSource.deleteById(id);
    this.logger.info('Bookmark deleted successfully', { bookmarkId: id });
    return deleted;
  }

  // User specific methods
  async findByUser(userId: EntityId): Promise<IBookmarkModel[]> {
    return await this.bookmarkDataSource.findByField('user_id', userId);
  }

  async findByTarget(
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<IBookmarkModel[]> {
    return await this.bookmarkDataSource.findByFields({
      target_type: targetType,
      target_id: targetId,
    });
  }

  async findByUserAndTarget(
    userId: EntityId,
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<IBookmarkModel | null> {
    const bookmarks = await this.bookmarkDataSource.findByFields({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
    });
    return bookmarks.length > 0 ? bookmarks[0] || null : null;
  }

  // Search & Filter methods
  async searchByUser(
    userId: EntityId,
    query: string
  ): Promise<IBookmarkModel[]> {
    // This would need to be implemented in the data source
    // For now, we'll get all user bookmarks and filter in memory
    const userBookmarks = await this.findByUser(userId);
    return userBookmarks.filter(
      bookmark =>
        bookmark.target_data.title
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        bookmark.target_data.content
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        bookmark.notes?.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.tags?.some(tag =>
          tag.toLowerCase().includes(query.toLowerCase())
        )
    );
  }

  async findByType(
    userId: EntityId,
    targetType: BookmarkTargetType
  ): Promise<IBookmarkModel[]> {
    return await this.bookmarkDataSource.findByFields({
      user_id: userId,
      target_type: targetType,
    });
  }

  async findByTags(
    userId: EntityId,
    tags: string[]
  ): Promise<IBookmarkModel[]> {
    const userBookmarks = await this.findByUser(userId);
    return userBookmarks.filter(bookmark =>
      bookmark.tags?.some(tag => tags.includes(tag))
    );
  }

  // Pagination
  async findPaginated(
    userId: EntityId,
    filters: PaginationQueryDTO & {
      targetType?: BookmarkTargetType;
      tags?: string[];
      search?: string;
    }
  ): Promise<PaginatedResponse<IBookmarkModel>> {
    // This would need to be implemented in the data source
    // For now, we'll get all user bookmarks and paginate in memory
    let userBookmarks = await this.findByUser(userId);

    // Apply filters
    if (filters.targetType) {
      userBookmarks = userBookmarks.filter(
        b => b.target_type === filters.targetType
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      userBookmarks = userBookmarks.filter(b =>
        b.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    if (filters.search) {
      userBookmarks = userBookmarks.filter(
        b =>
          b.target_data.title
            .toLowerCase()
            .includes(filters.search!.toLowerCase()) ||
          b.target_data.content
            .toLowerCase()
            .includes(filters.search!.toLowerCase())
      );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const total = userBookmarks.length;
    const data = userBookmarks.slice(skip, skip + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // Collections
  async createCollection(
    collection: Omit<
      IBookmarkCollectionModel,
      '_id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<IBookmarkCollectionModel> {
    const newCollection =
      await this.collectionDataSource.create(collection);
    this.logger.info('Bookmark collection created successfully', {
      collectionId: newCollection._id,
    });
    return newCollection;
  }

  async findCollectionsByUser(
    userId: EntityId
  ): Promise<IBookmarkCollectionModel[]> {
    return this.collectionDataSource.findByUserId(userId);
  }

  async updateCollection(
    collectionId: EntityId,
    updates: Partial<IBookmarkCollectionModel>
  ): Promise<IBookmarkCollectionModel | null> {
    return this.collectionDataSource.updateById(collectionId, updates);
  }

  async deleteCollection(collectionId: EntityId): Promise<boolean> {
    const deleted =
      await this.collectionDataSource.deleteById(collectionId);
    if (deleted) {
      this.logger.info('Bookmark collection deleted', { collectionId });
    }
    return deleted;
  }

  // Collection Items
  async addToCollection(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel> {
    const item = await this.collectionItemDataSource.add(
      bookmarkId,
      collectionId
    );
    this.logger.info('Bookmark added to collection', {
      bookmarkId,
      collectionId,
    });
    return item;
  }

  async removeFromCollection(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    const removed = await this.collectionItemDataSource.remove(
      bookmarkId,
      collectionId
    );
    if (removed) {
      this.logger.info('Bookmark removed from collection', {
        bookmarkId,
        collectionId,
      });
    }
    return removed;
  }

  async findCollectionItems(collectionId: EntityId): Promise<IBookmarkModel[]> {
    const items =
      await this.collectionItemDataSource.findByCollectionId(collectionId);
    const bookmarks: IBookmarkModel[] = [];
    for (const item of items) {
      try {
        const bookmark = await this.bookmarkDataSource.findById(item.bookmark_id);
        bookmarks.push(bookmark);
      } catch {
        // Skip if bookmark was deleted
      }
    }
    return bookmarks;
  }

  // Analytics
  async getBookmarkStats(userId: EntityId): Promise<{
    total: number;
    byType: Record<BookmarkTargetType, number>;
    recent: IBookmarkModel[];
  }> {
    const userBookmarks = await this.findByUser(userId);

    const byType: Record<BookmarkTargetType, number> = {
      question: 0,
      answer: 0,
      note: 0,
      article: 0,
      comment: 0,
    };

    userBookmarks.forEach(bookmark => {
      byType[bookmark.target_type]++;
    });

    const recent = userBookmarks
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    return {
      total: userBookmarks.length,
      byType,
      recent,
    };
  }
}
