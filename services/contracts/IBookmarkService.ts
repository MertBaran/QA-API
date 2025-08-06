import { EntityId } from '../../types/database';
import { 
  IBookmarkModel, 
  IBookmarkCollectionModel,
  BookmarkTargetType 
} from '../../models/interfaces/IBookmarkModel';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/common/pagination.dto';

export interface AddBookmarkDTO {
  targetType: BookmarkTargetType;
  targetId: EntityId;
  targetData: {
    title: string;
    content: string;
    author?: string;
    authorId?: EntityId;
    created_at: string;
    url?: string;
  };
  tags?: string[];
  notes?: string;
  isPublic?: boolean;
}

export interface UpdateBookmarkDTO {
  tags?: string[];
  notes?: string;
  isPublic?: boolean;
}

export interface CreateCollectionDTO {
  name: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionDTO {
  name?: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
}

export interface IBookmarkService {
  // Basic CRUD
  addBookmark(userId: EntityId, bookmarkData: AddBookmarkDTO): Promise<IBookmarkModel>;
  removeBookmark(userId: EntityId, bookmarkId: EntityId): Promise<boolean>;
  updateBookmark(userId: EntityId, bookmarkId: EntityId, updates: UpdateBookmarkDTO): Promise<IBookmarkModel | null>;
  getBookmark(userId: EntityId, bookmarkId: EntityId): Promise<IBookmarkModel | null>;
  
  // User Bookmarks
  getUserBookmarks(userId: EntityId): Promise<IBookmarkModel[]>;
  checkBookmarkExists(userId: EntityId, targetType: BookmarkTargetType, targetId: EntityId): Promise<boolean>;
  
  // Search & Filter
  searchBookmarks(
    userId: EntityId, 
    query: string, 
    filters?: {
      targetType?: BookmarkTargetType;
      tags?: string[];
    }
  ): Promise<IBookmarkModel[]>;
  
  // Pagination
  getPaginatedBookmarks(
    userId: EntityId,
    filters: PaginationQueryDTO & {
      targetType?: BookmarkTargetType;
      tags?: string[];
      search?: string;
    }
  ): Promise<PaginatedResponse<IBookmarkModel>>;
  
  // Collections
  createCollection(userId: EntityId, collectionData: CreateCollectionDTO): Promise<IBookmarkCollectionModel>;
  getUserCollections(userId: EntityId): Promise<IBookmarkCollectionModel[]>;
  updateCollection(userId: EntityId, collectionId: EntityId, updates: UpdateCollectionDTO): Promise<IBookmarkCollectionModel | null>;
  deleteCollection(userId: EntityId, collectionId: EntityId): Promise<boolean>;
  
  // Collection Items
  addToCollection(userId: EntityId, bookmarkId: EntityId, collectionId: EntityId): Promise<boolean>;
  removeFromCollection(userId: EntityId, bookmarkId: EntityId, collectionId: EntityId): Promise<boolean>;
  getCollectionItems(userId: EntityId, collectionId: EntityId): Promise<IBookmarkModel[]>;
  
  // Analytics
  getBookmarkStats(userId: EntityId): Promise<{
    total: number;
    byType: Record<BookmarkTargetType, number>;
    recent: IBookmarkModel[];
  }>;
} 