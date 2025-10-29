import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IBookmarkService } from '../services/contracts/IBookmarkService';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import { IExceptionTracker } from '../infrastructure/error/IExceptionTracker';
import { ApplicationError } from '../infrastructure/error/ApplicationError';

interface AuthenticatedRequest<T = any> extends Request<{}, any, T> {
  user?: {
    id: string; // authMiddleware sets 'id'
    email?: string;
    roles?: string[];
  };
}
import { normalizeLocale, i18n } from '../types/i18n';
import { BookmarkConstants } from './constants/ControllerMessages';
import type {
  AddBookmarkDTO,
  UpdateBookmarkDTO,
  CreateCollectionDTO,
  UpdateCollectionDTO,
} from '../types/dto/bookmark/bookmark.dto';
import type {
  BookmarkResponseDTO,
  CollectionResponseDTO,
  BookmarkStatsResponseDTO,
} from '../types/dto/bookmark/bookmark.dto';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
import type { PaginatedResponse } from '../types/dto/common/pagination.dto';

@injectable()
export class BookmarkController {
  constructor(
    @inject('IBookmarkService') private bookmarkService: IBookmarkService,
    @inject('ILoggerProvider') private logger: ILoggerProvider,
    @inject('IExceptionTracker') private exceptionTracker: IExceptionTracker
  ) {}

  // Add bookmark
  addBookmark = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<AddBookmarkDTO>,
      res: Response<BookmarkResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const bookmarkData = req.body;

      const bookmark = await this.bookmarkService.addBookmark(
        user.id,
        bookmarkData
      );

      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const message = await i18n(BookmarkConstants.BookmarkAdded, locale);

      res.status(201).json({
        _id: bookmark._id,
        user_id: bookmark.user_id,
        target_type: bookmark.target_type,
        target_id: bookmark.target_id,
        target_data: bookmark.target_data,
        tags: bookmark.tags,
        notes: bookmark.notes,
        is_public: bookmark.is_public,
        createdAt: bookmark.createdAt.toISOString(),
        updatedAt: bookmark.updatedAt.toISOString(),
      });
    }
  );

  // Remove bookmark
  removeBookmark = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<SuccessResponseDTO<{ deleted: boolean }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { id } = req.params as { id: string };

      const deleted = await this.bookmarkService.removeBookmark(user.id, id);

      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const message = await i18n(BookmarkConstants.BookmarkRemoved, locale);

      res.status(200).json({
        success: true,
        message,
        data: { deleted },
      });
    }
  );

  // Update bookmark
  updateBookmark = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<UpdateBookmarkDTO>,
      res: Response<BookmarkResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { id } = req.params as { id: string };
      const updates = req.body;

      const bookmark = await this.bookmarkService.updateBookmark(
        user.id,
        id,
        updates
      );

      if (!bookmark) {
        throw ApplicationError.notFoundError('Bookmark bulunamadı');
      }

      res.status(200).json({
        _id: bookmark._id,
        user_id: bookmark.user_id,
        target_type: bookmark.target_type,
        target_id: bookmark.target_id,
        target_data: bookmark.target_data,
        tags: bookmark.tags,
        notes: bookmark.notes,
        is_public: bookmark.is_public,
        createdAt: bookmark.createdAt.toISOString(),
        updatedAt: bookmark.updatedAt.toISOString(),
      });
    }
  );

  // Get user bookmarks
  getUserBookmarks = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<BookmarkResponseDTO[]>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const bookmarks = await this.bookmarkService.getUserBookmarks(user.id);

      const response = bookmarks.map(bookmark => ({
        _id: bookmark._id,
        user_id: bookmark.user_id,
        target_type: bookmark.target_type,
        target_id: bookmark.target_id,
        target_data: bookmark.target_data,
        tags: bookmark.tags,
        notes: bookmark.notes,
        is_public: bookmark.is_public,
        createdAt: bookmark.createdAt.toISOString(),
        updatedAt: bookmark.updatedAt.toISOString(),
      }));

      res.status(200).json(response);
    }
  );

  // Check if bookmark exists
  checkBookmarkExists = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<{ exists: boolean }>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { targetType, targetId } = req.params as {
        targetType: string;
        targetId: string;
      };

      const exists = await this.bookmarkService.checkBookmarkExists(
        user.id,
        targetType as any,
        targetId
      );

      res.status(200).json({ exists });
    }
  );

  // Search bookmarks
  searchBookmarks = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<BookmarkResponseDTO[]>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { q, type, tags } = req.query;

      const filters = {
        targetType: type as any,
        tags: tags ? (tags as string).split(',') : undefined,
      };

      const bookmarks = await this.bookmarkService.searchBookmarks(
        user.id,
        q as string,
        filters
      );

      const response = bookmarks.map(bookmark => ({
        _id: bookmark._id,
        user_id: bookmark.user_id,
        target_type: bookmark.target_type,
        target_id: bookmark.target_id,
        target_data: bookmark.target_data,
        tags: bookmark.tags,
        notes: bookmark.notes,
        is_public: bookmark.is_public,
        createdAt: bookmark.createdAt.toISOString(),
        updatedAt: bookmark.updatedAt.toISOString(),
      }));

      res.status(200).json(response);
    }
  );

  // Get paginated bookmarks
  getPaginatedBookmarks = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<PaginatedResponse<BookmarkResponseDTO>>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { page, limit, type, tags, search } = req.query;

      const filters = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sortOrder: 'desc' as const,
        targetType: type as any,
        tags: tags ? (tags as string).split(',') : undefined,
        search: search as string,
      };

      const result = await this.bookmarkService.getPaginatedBookmarks(
        user.id,
        filters
      );

      const response: PaginatedResponse<BookmarkResponseDTO> = {
        data: result.data.map(bookmark => ({
          _id: bookmark._id,
          user_id: bookmark.user_id,
          target_type: bookmark.target_type,
          target_id: bookmark.target_id,
          target_data: bookmark.target_data,
          tags: bookmark.tags,
          notes: bookmark.notes,
          is_public: bookmark.is_public,
          createdAt: bookmark.createdAt.toISOString(),
          updatedAt: bookmark.updatedAt.toISOString(),
        })),
        pagination: result.pagination,
      };

      res.status(200).json(response);
    }
  );

  // Create collection
  createCollection = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<CreateCollectionDTO>,
      res: Response<CollectionResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const collectionData = req.body;

      const collection = await this.bookmarkService.createCollection(
        user.id,
        collectionData
      );

      res.status(201).json({
        _id: collection._id,
        user_id: collection.user_id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        is_public: collection.is_public,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      });
    }
  );

  // Get user collections
  getUserCollections = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<CollectionResponseDTO[]>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const collections = await this.bookmarkService.getUserCollections(
        user.id
      );

      const response = collections.map(collection => ({
        _id: collection._id,
        user_id: collection.user_id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        is_public: collection.is_public,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      }));

      res.status(200).json(response);
    }
  );

  // Update collection
  updateCollection = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<UpdateCollectionDTO>,
      res: Response<CollectionResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { id } = req.params as { id: string };
      const updates = req.body;

      const collection = await this.bookmarkService.updateCollection(
        user.id,
        id,
        updates
      );

      if (!collection) {
        throw ApplicationError.notFoundError('Koleksiyon bulunamadı');
      }

      res.status(200).json({
        _id: collection._id,
        user_id: collection.user_id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        is_public: collection.is_public,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      });
    }
  );

  // Delete collection
  deleteCollection = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<SuccessResponseDTO<{ deleted: boolean }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { id } = req.params as { id: string };

      const deleted = await this.bookmarkService.deleteCollection(user.id, id);

      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const message = await i18n(BookmarkConstants.CollectionDeleted, locale);

      res.status(200).json({
        success: true,
        message,
        data: { deleted },
      });
    }
  );

  // Add bookmark to collection
  addToCollection = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<SuccessResponseDTO<{ added: boolean }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { bookmarkId, collectionId } = req.params as {
        bookmarkId: string;
        collectionId: string;
      };

      const added = await this.bookmarkService.addToCollection(
        user.id,
        bookmarkId,
        collectionId
      );

      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const message = await i18n(
        BookmarkConstants.BookmarkAddedToCollection,
        locale
      );

      res.status(200).json({
        success: true,
        message,
        data: { added },
      });
    }
  );

  // Remove bookmark from collection
  removeFromCollection = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<SuccessResponseDTO<{ removed: boolean }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { bookmarkId, collectionId } = req.params as {
        bookmarkId: string;
        collectionId: string;
      };

      const removed = await this.bookmarkService.removeFromCollection(
        user.id,
        bookmarkId,
        collectionId
      );

      const locale = normalizeLocale(
        req.headers['accept-language'] as string | undefined
      );
      const message = await i18n(
        BookmarkConstants.BookmarkRemovedFromCollection,
        locale
      );

      res.status(200).json({
        success: true,
        message,
        data: { removed },
      });
    }
  );

  // Get collection items
  getCollectionItems = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<BookmarkResponseDTO[]>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }
      const { id } = req.params as { id: string };

      const bookmarks = await this.bookmarkService.getCollectionItems(
        user.id,
        id
      );

      const response = bookmarks.map(bookmark => ({
        _id: bookmark._id,
        user_id: bookmark.user_id,
        target_type: bookmark.target_type,
        target_id: bookmark.target_id,
        target_data: bookmark.target_data,
        tags: bookmark.tags,
        notes: bookmark.notes,
        is_public: bookmark.is_public,
        createdAt: bookmark.createdAt.toISOString(),
        updatedAt: bookmark.updatedAt.toISOString(),
      }));

      res.status(200).json(response);
    }
  );

  // Get bookmark stats
  getBookmarkStats = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<BookmarkStatsResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { user } = req;
      if (!user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const stats = await this.bookmarkService.getBookmarkStats(user.id);

      const response: BookmarkStatsResponseDTO = {
        total: stats.total,
        byType: stats.byType,
        recent: stats.recent.map(bookmark => ({
          _id: bookmark._id,
          user_id: bookmark.user_id,
          target_type: bookmark.target_type,
          target_id: bookmark.target_id,
          target_data: bookmark.target_data,
          tags: bookmark.tags,
          notes: bookmark.notes,
          is_public: bookmark.is_public,
          createdAt: bookmark.createdAt.toISOString(),
          updatedAt: bookmark.updatedAt.toISOString(),
        })),
      };

      res.status(200).json(response);
    }
  );
}
