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
import { EntityId } from '../../types/database';
import { ICacheProvider } from '../../infrastructure/cache/ICacheProvider';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { ApplicationError } from '../../helpers/error/ApplicationError';
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
    try {
      // Validate and sanitize to avoid Mongoose Validation/Cast errors
      const isValidObjectId = (val: any) =>
        typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);

      if (!isValidObjectId(bookmarkData.targetId)) {
        throw ApplicationError.validationError('Geçersiz hedef kimliği');
      }

      const sanitizedTargetData = {
        ...bookmarkData.targetData,
        authorId:
          bookmarkData.targetData.authorId &&
          isValidObjectId(bookmarkData.targetData.authorId)
            ? bookmarkData.targetData.authorId
            : undefined,
      } as any;
      // Check if bookmark already exists
      const existingBookmark =
        await this.bookmarkRepository.findByUserAndTarget(
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
    } catch (error: any) {
      // Duplicate key (11000) -> unique index violation
      if (
        error &&
        (error.code === 11000 ||
          (error?.name === 'MongoServerError' && error?.code === 11000))
      ) {
        throw ApplicationError.validationError(
          "Bu öğe zaten bookmark'larınızda mevcut"
        );
      }
      if (error?.name === 'ValidationError') {
        throw ApplicationError.validationError(
          error.message || 'Geçersiz bookmark verisi'
        );
      }
      if (error?.name === 'CastError') {
        throw ApplicationError.validationError('Geçersiz veri türü');
      }
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Bookmark eklenemedi');
    }
  }

  async removeBookmark(
    userId: EntityId,
    bookmarkId: EntityId
  ): Promise<boolean> {
    try {
      // Verify ownership
      const bookmark = await this.bookmarkRepository.findById(bookmarkId);
      if (!bookmark) {
        throw ApplicationError.notFoundError('Bookmark bulunamadı');
      }

      if (bookmark.user_id !== userId) {
        throw ApplicationError.forbiddenError(
          "Bu bookmark'ı silme yetkiniz yok"
        );
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Bookmark silinemedi');
    }
  }

  async updateBookmark(
    userId: EntityId,
    bookmarkId: EntityId,
    updates: UpdateBookmarkDTO
  ): Promise<IBookmarkModel | null> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Bookmark güncellenemedi');
    }
  }

  async getBookmark(
    userId: EntityId,
    bookmarkId: EntityId
  ): Promise<IBookmarkModel | null> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Bookmark yüklenemedi');
    }
  }

  // User Bookmarks
  async getUserBookmarks(userId: EntityId): Promise<IBookmarkModel[]> {
    const cacheKey = `bookmarks:user:${userId}`;
    try {
      const cached = await this.cacheProvider.get<IBookmarkModel[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const bookmarks = await this.bookmarkRepository.findByUser(userId);
      await this.cacheProvider.set<IBookmarkModel[]>(cacheKey, bookmarks, 300); // 5 minutes
      return bookmarks;
    } catch (error) {
      throw ApplicationError.databaseError(
        "Kullanıcı bookmark'ları yüklenemedi"
      );
    }
  }

  async checkBookmarkExists(
    userId: EntityId,
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<boolean> {
    try {
      const bookmark = await this.bookmarkRepository.findByUserAndTarget(
        userId,
        targetType,
        targetId
      );
      return !!bookmark;
    } catch (error) {
      throw ApplicationError.databaseError('Bookmark kontrolü başarısız');
    }
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
    try {
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
    } catch (error) {
      throw ApplicationError.databaseError('Bookmark arama başarısız');
    }
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
    try {
      const result = await this.bookmarkRepository.findPaginated(
        userId,
        filters
      );
      return result;
    } catch (error) {
      throw ApplicationError.databaseError(
        "Sayfalanmış bookmark'lar yüklenemedi"
      );
    }
  }

  // Collections
  async createCollection(
    userId: EntityId,
    collectionData: CreateCollectionDTO
  ): Promise<IBookmarkCollectionModel> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Koleksiyon oluşturulamadı');
    }
  }

  async getUserCollections(
    userId: EntityId
  ): Promise<IBookmarkCollectionModel[]> {
    const cacheKey = `collections:user:${userId}`;
    try {
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
    } catch (error) {
      throw ApplicationError.databaseError(
        'Kullanıcı koleksiyonları yüklenemedi'
      );
    }
  }

  async updateCollection(
    userId: EntityId,
    collectionId: EntityId,
    updates: UpdateCollectionDTO
  ): Promise<IBookmarkCollectionModel | null> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Koleksiyon güncellenemedi');
    }
  }

  async deleteCollection(
    userId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Koleksiyon silinemedi');
    }
  }

  // Collection Items
  async addToCollection(
    userId: EntityId,
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Bookmark koleksiyona eklenemedi');
    }
  }

  async removeFromCollection(
    userId: EntityId,
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError(
        'Bookmark koleksiyondan çıkarılamadı'
      );
    }
  }

  async getCollectionItems(
    userId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkModel[]> {
    try {
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
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.databaseError('Koleksiyon öğeleri yüklenemedi');
    }
  }

  // Analytics
  async getBookmarkStats(userId: EntityId): Promise<{
    total: number;
    byType: Record<BookmarkTargetType, number>;
    recent: IBookmarkModel[];
  }> {
    const cacheKey = `bookmarks:stats:${userId}`;
    try {
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
    } catch (error) {
      throw ApplicationError.databaseError(
        'Bookmark istatistikleri yüklenemedi'
      );
    }
  }
}
