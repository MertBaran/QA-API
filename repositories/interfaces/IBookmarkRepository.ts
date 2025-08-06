import { EntityId } from '../../types/database';
import { IRepository } from './IRepository';
import {
  IBookmarkModel,
  IBookmarkCollectionModel,
  IBookmarkCollectionItemModel,
  BookmarkTargetType,
} from '../../models/interfaces/IBookmarkModel';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/common/pagination.dto';

export interface IBookmarkRepository extends IRepository<IBookmarkModel> {
  // Basic CRUD
  findByUser(userId: EntityId): Promise<IBookmarkModel[]>;
  findByTarget(
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<IBookmarkModel[]>;
  findByUserAndTarget(
    userId: EntityId,
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<IBookmarkModel | null>;

  // Search & Filter
  searchByUser(userId: EntityId, query: string): Promise<IBookmarkModel[]>;
  findByType(
    userId: EntityId,
    targetType: BookmarkTargetType
  ): Promise<IBookmarkModel[]>;
  findByTags(userId: EntityId, tags: string[]): Promise<IBookmarkModel[]>;

  // Pagination
  findPaginated(
    userId: EntityId,
    filters: PaginationQueryDTO & {
      targetType?: BookmarkTargetType;
      tags?: string[];
      search?: string;
    }
  ): Promise<PaginatedResponse<IBookmarkModel>>;

  // Collections
  createCollection(
    collection: Omit<
      IBookmarkCollectionModel,
      '_id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<IBookmarkCollectionModel>;
  findCollectionsByUser(userId: EntityId): Promise<IBookmarkCollectionModel[]>;
  updateCollection(
    collectionId: EntityId,
    updates: Partial<IBookmarkCollectionModel>
  ): Promise<IBookmarkCollectionModel | null>;
  deleteCollection(collectionId: EntityId): Promise<boolean>;

  // Collection Items
  addToCollection(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel>;
  removeFromCollection(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean>;
  findCollectionItems(collectionId: EntityId): Promise<IBookmarkModel[]>;

  // Analytics
  getBookmarkStats(userId: EntityId): Promise<{
    total: number;
    byType: Record<BookmarkTargetType, number>;
    recent: IBookmarkModel[];
  }>;
}
