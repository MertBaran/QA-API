import { injectable, inject } from 'tsyringe';
import { IBookmarkRepository } from '../../repositories/interfaces/IBookmarkRepository';
import {
  IBookmarkModel,
  IBookmarkCollectionModel,
  BookmarkTargetType,
} from '../../models/interfaces/IBookmarkModel';
import {
  IBookmarkService,
  AddBookmarkDTO,
  UpdateBookmarkDTO,
  CreateCollectionDTO,
  UpdateCollectionDTO,
} from '../contracts/IBookmarkService';
import { EntityId, isValidEntityId } from '../../types/database';
import { ICacheProvider } from '../../infrastructure/cache/ICacheProvider';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/common/pagination.dto';

@injectable()
export class BookmarkManager implements IBookmarkService {
  constructor(
    @inject('IBookmarkRepository')
    private bookmarkRepository: IBookmarkRepository,
    @inject('ICacheProvider') private cacheProvider: ICacheProvider,
    @inject('ILoggerProvider') private logger: ILoggerProvider
  ) {}

  // Basic CRUD
  async addBookmark(
    userId: EntityId,
    bookmarkData: AddBookmarkDTO
  ): Promise<IBookmarkModel> {
    if (!isValidEntityId(bookmarkData.targetId)) {
      throw ApplicationError.validationError('Geçersiz hedef kimliği');
    }

    const sanitizedTargetData = {
      ...bookmarkData.targetData,
      authorId:
        bookmarkData.targetData.authorId && isValidEntityId(bookmarkData.targetData.authorId)
          ? bookmarkData.targetData.authorId
          : undefined,
    } as any;
    // Check if bookmark already exists
    const existingBookmark = await this.bookmarkRepository.findByUserAndTarget(
      userId,
      bookmarkData.targetType,
      bookmarkData.targetId
    );

    if (existingBookmark) {
      throw ApplicationError.validationError(
        "Bu öğe zaten bookmark'larınızda mevcut"
      );
    }

    const bookmark = await this.bookmarkRepository.create({
      user_id: userId,
      target_type: bookmarkData.targetType,
      target_id: bookmarkData.targetId,
      target_data: sanitizedTargetData,
      tags: bookmarkData.tags || [],
      notes: bookmarkData.notes || '',
      is_public: bookmarkData.isPublic || false,
    });

    // Clear cache
    await this.cacheProvider.del(`bookmarks:user:${userId}`);
    await this.cacheProvider.del(`bookmarks:stats:${userId}`);

    this.logger.info('Bookmark added successfully', {
      userId,
      bookmarkId: bookmark._id,
      targetType: bookmarkData.targetType,
      targetId: bookmarkData.targetId,
    });

    return bookmark;
  }

  async removeBookmark(
    userId: EntityId,
    bookmarkId: EntityId
  ): Promise<boolean> {
    // Verify ownership
    const bookmark = await this.bookmarkRepository.findById(bookmarkId);
    if (!bookmark) {
      throw ApplicationError.notFoundError('Bookmark bulunamadı');
    }

    if (bookmark.user_id !== userId) {
      throw ApplicationError.forbiddenError("Bu bookmark'ı silme yetkiniz yok");
    }

    const deleted = await this.bookmarkRepository.deleteById(bookmarkId);

    if (deleted) {
      // Clear cache
      await this.cacheProvider.del(`bookmarks:user:${userId}`);
      await this.cacheProvider.del(`bookmarks:stats:${userId}`);

      this.logger.info('Bookmark removed successfully', {
        userId,
        bookmarkId,
      });
    }

    return !!deleted;
  }

  async updateBookmark(
    userId: EntityId,
    bookmarkId: EntityId,
    updates: UpdateBookmarkDTO
  ): Promise<IBookmarkModel | null> {
    // Verify ownership
    const bookmark = await this.bookmarkRepository.findById(bookmarkId);
    if (!bookmark) {
      throw ApplicationError.notFoundError('Bookmark bulunamadı');
    }

    if (bookmark.user_id !== userId) {
      throw ApplicationError.forbiddenError(
        "Bu bookmark'ı güncelleme yetkiniz yok"
      );
    }

    const updatedBookmark = await this.bookmarkRepository.updateById(
      bookmarkId,
      updates
    );

    if (updatedBookmark) {
      // Clear cache
      await this.cacheProvider.del(`bookmarks:user:${userId}`);
      await this.cacheProvider.del(`bookmarks:stats:${userId}`);

      this.logger.info('Bookmark updated successfully', {
        userId,
        bookmarkId,
      });
    }

    return updatedBookmark;
  }

  async getBookmark(
    userId: EntityId,
    bookmarkId: EntityId
  ): Promise<IBookmarkModel | null> {
    const bookmark = await this.bookmarkRepository.findById(bookmarkId);

    if (!bookmark) {
      return null;
    }

    // Check if user can access this bookmark
    if (bookmark.user_id !== userId && !bookmark.is_public) {
      throw ApplicationError.forbiddenError(
        "Bu bookmark'a erişim yetkiniz yok"
      );
    }

    return bookmark;
  }

  // User Bookmarks
  async getUserBookmarks(userId: EntityId): Promise<IBookmarkModel[]> {
    const cacheKey = `bookmarks:user:${userId}`;
    const cached = await this.cacheProvider.get<IBookmarkModel[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const bookmarks = await this.bookmarkRepository.findByUser(userId);
    await this.cacheProvider.set<IBookmarkModel[]>(cacheKey, bookmarks, 300); // 5 minutes
    return bookmarks;
  }

  async checkBookmarkExists(
    userId: EntityId,
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<boolean> {
    const bookmark = await this.bookmarkRepository.findByUserAndTarget(
      userId,
      targetType,
      targetId
    );
    return !!bookmark;
  }

  // Search & Filter
  async searchBookmarks(
    userId: EntityId,
    query: string,
    filters?: {
      targetType?: BookmarkTargetType;
      tags?: string[];
    }
  ): Promise<IBookmarkModel[]> {
    let bookmarks = await this.bookmarkRepository.searchByUser(userId, query);

    // Apply additional filters
    if (filters?.targetType) {
      bookmarks = bookmarks.filter(b => b.target_type === filters.targetType);
    }

    if (filters?.tags && filters.tags.length > 0) {
      bookmarks = bookmarks.filter(b =>
        b.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    return bookmarks;
  }

  // Pagination
  async getPaginatedBookmarks(
    userId: EntityId,
    filters: PaginationQueryDTO & {
      targetType?: BookmarkTargetType;
      tags?: string[];
      search?: string;
    }
  ): Promise<PaginatedResponse<IBookmarkModel>> {
    const result = await this.bookmarkRepository.findPaginated(userId, filters);
    return result;
  }

  // Collections
  async createCollection(
    userId: EntityId,
    collectionData: CreateCollectionDTO
  ): Promise<IBookmarkCollectionModel> {
    const collection = await this.bookmarkRepository.createCollection({
      user_id: userId,
      name: collectionData.name,
      description: collectionData.description,
      color: collectionData.color,
      is_public: collectionData.isPublic || false,
    });

    // Clear cache
    await this.cacheProvider.del(`collections:user:${userId}`);

    this.logger.info('Bookmark collection created successfully', {
      userId,
      collectionId: collection._id,
      name: collection.name,
    });

    return collection;
  }

  async getUserCollections(
    userId: EntityId
  ): Promise<IBookmarkCollectionModel[]> {
    const cacheKey = `collections:user:${userId}`;
    const cached =
      await this.cacheProvider.get<IBookmarkCollectionModel[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const collections =
      await this.bookmarkRepository.findCollectionsByUser(userId);
    await this.cacheProvider.set<IBookmarkCollectionModel[]>(
      cacheKey,
      collections,
      300
    ); // 5 minutes
    return collections;
  }

  async updateCollection(
    userId: EntityId,
    collectionId: EntityId,
    updates: UpdateCollectionDTO
  ): Promise<IBookmarkCollectionModel | null> {
    // Verify ownership
    const collections =
      await this.bookmarkRepository.findCollectionsByUser(userId);
    const collection = collections.find(c => c._id === collectionId);

    if (!collection) {
      throw ApplicationError.notFoundError('Koleksiyon bulunamadı');
    }

    const updatedCollection = await this.bookmarkRepository.updateCollection(
      collectionId,
      updates
    );

    if (updatedCollection) {
      // Clear cache
      await this.cacheProvider.del(`collections:user:${userId}`);

      this.logger.info('Collection updated successfully', {
        userId,
        collectionId,
      });
    }

    return updatedCollection;
  }

  async deleteCollection(
    userId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    // Verify ownership
    const collections =
      await this.bookmarkRepository.findCollectionsByUser(userId);
    const collection = collections.find(c => c._id === collectionId);

    if (!collection) {
      throw ApplicationError.notFoundError('Koleksiyon bulunamadı');
    }

    const deleted =
      await this.bookmarkRepository.deleteCollection(collectionId);

    if (deleted) {
      // Clear cache
      await this.cacheProvider.del(`collections:user:${userId}`);

      this.logger.info('Collection deleted successfully', {
        userId,
        collectionId,
      });
    }

    return deleted;
  }

  // Collection Items
  async addToCollection(
    userId: EntityId,
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    // Verify bookmark ownership
    const bookmark = await this.bookmarkRepository.findById(bookmarkId);
    if (!bookmark || bookmark.user_id !== userId) {
      throw ApplicationError.forbiddenError(
        "Bu bookmark'ı koleksiyona ekleme yetkiniz yok"
      );
    }

    // Verify collection ownership
    const collections =
      await this.bookmarkRepository.findCollectionsByUser(userId);
    const collection = collections.find(c => c._id === collectionId);
    if (!collection) {
      throw ApplicationError.forbiddenError(
        'Bu koleksiyona ekleme yetkiniz yok'
      );
    }

    await this.bookmarkRepository.addToCollection(bookmarkId, collectionId);

    this.logger.info('Bookmark added to collection successfully', {
      userId,
      bookmarkId,
      collectionId,
    });

    return true;
  }

  async removeFromCollection(
    userId: EntityId,
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    // Verify ownership
    const bookmark = await this.bookmarkRepository.findById(bookmarkId);
    if (!bookmark || bookmark.user_id !== userId) {
      throw ApplicationError.forbiddenError(
        "Bu bookmark'ı koleksiyondan çıkarma yetkiniz yok"
      );
    }

    const collections =
      await this.bookmarkRepository.findCollectionsByUser(userId);
    const collection = collections.find(c => c._id === collectionId);
    if (!collection) {
      throw ApplicationError.forbiddenError(
        'Bu koleksiyondan çıkarma yetkiniz yok'
      );
    }

    const removed = await this.bookmarkRepository.removeFromCollection(
      bookmarkId,
      collectionId
    );

    if (removed) {
      this.logger.info('Bookmark removed from collection successfully', {
        userId,
        bookmarkId,
        collectionId,
      });
    }

    return removed;
  }

  async getCollectionItems(
    userId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkModel[]> {
    // Verify collection ownership
    const collections =
      await this.bookmarkRepository.findCollectionsByUser(userId);
    const collection = collections.find(c => c._id === collectionId);
    if (!collection) {
      throw ApplicationError.forbiddenError(
        'Bu koleksiyona erişim yetkiniz yok'
      );
    }

    const bookmarks =
      await this.bookmarkRepository.findCollectionItems(collectionId);
    return bookmarks;
  }

  // Analytics
  async getBookmarkStats(userId: EntityId): Promise<{
    total: number;
    byType: Record<BookmarkTargetType, number>;
    recent: IBookmarkModel[];
  }> {
    const cacheKey = `bookmarks:stats:${userId}`;
    const cached = await this.cacheProvider.get<{
      total: number;
      byType: Record<BookmarkTargetType, number>;
      recent: IBookmarkModel[];
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const stats = await this.bookmarkRepository.getBookmarkStats(userId);
    await this.cacheProvider.set(cacheKey, stats, 600); // 10 minutes
    return stats;
  }
}
