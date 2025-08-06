import { IBookmarkService } from '../../../services/contracts/IBookmarkService';
import {
  IBookmarkModel,
  IBookmarkCollectionModel,
  BookmarkTargetType,
} from '../../../models/interfaces/IBookmarkModel';
import { EntityId } from '../../../types/database';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../../types/dto/common/pagination.dto';

export class FakeBookmarkService implements IBookmarkService {
  private bookmarks: IBookmarkModel[] = [];
  private collections: IBookmarkCollectionModel[] = [];

  async addBookmark(
    userId: EntityId,
    bookmarkData: any
  ): Promise<IBookmarkModel> {
    const bookmark: IBookmarkModel = {
      _id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      target_type: bookmarkData.targetType,
      target_id: bookmarkData.targetId,
      target_data: bookmarkData.targetData,
      tags: bookmarkData.tags || [],
      notes: bookmarkData.notes || '',
      is_public: bookmarkData.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if bookmark already exists
    const existing = this.bookmarks.find(
      b =>
        b.user_id === userId &&
        b.target_type === bookmarkData.targetType &&
        b.target_id === bookmarkData.targetId
    );

    if (existing) {
      throw new Error('Bookmark already exists');
    }

    this.bookmarks.push(bookmark);
    return bookmark;
  }

  async removeBookmark(
    userId: EntityId,
    bookmarkId: EntityId
  ): Promise<boolean> {
    const index = this.bookmarks.findIndex(
      b => b._id === bookmarkId && b.user_id === userId
    );
    if (index === -1) return false;

    this.bookmarks.splice(index, 1);
    return true;
  }

  async updateBookmark(
    userId: EntityId,
    bookmarkId: EntityId,
    updates: any
  ): Promise<IBookmarkModel | null> {
    const index = this.bookmarks.findIndex(
      b => b._id === bookmarkId && b.user_id === userId
    );
    if (index === -1) return null;

    this.bookmarks[index] = {
      ...this.bookmarks[index],
      ...updates,
      updatedAt: new Date(),
    } as IBookmarkModel;

    return this.bookmarks[index];
  }

  async getBookmark(
    userId: EntityId,
    bookmarkId: EntityId
  ): Promise<IBookmarkModel | null> {
    return (
      this.bookmarks.find(b => b._id === bookmarkId && b.user_id === userId) ||
      null
    );
  }

  async getUserBookmarks(userId: EntityId): Promise<IBookmarkModel[]> {
    return this.bookmarks.filter(b => b.user_id === userId);
  }

  async checkBookmarkExists(
    userId: EntityId,
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<boolean> {
    return this.bookmarks.some(
      b =>
        b.user_id === userId &&
        b.target_type === targetType &&
        b.target_id === targetId
    );
  }

  async searchBookmarks(
    userId: EntityId,
    query: string,
    filters?: any
  ): Promise<IBookmarkModel[]> {
    const userBookmarks = await this.getUserBookmarks(userId);
    return userBookmarks.filter(bookmark => {
      const searchText = query.toLowerCase();
      return (
        bookmark.target_data.title.toLowerCase().includes(searchText) ||
        bookmark.target_data.content.toLowerCase().includes(searchText) ||
        bookmark.notes?.toLowerCase().includes(searchText) ||
        false ||
        bookmark.tags?.some(tag => tag.toLowerCase().includes(searchText)) ||
        false
      );
    });
  }

  async getPaginatedBookmarks(
    userId: EntityId,
    filters: PaginationQueryDTO & {
      targetType?: BookmarkTargetType;
      tags?: string[];
      search?: string;
    }
  ): Promise<PaginatedResponse<IBookmarkModel>> {
    let userBookmarks = await this.getUserBookmarks(userId);

    // Apply filters
    if (filters.targetType) {
      userBookmarks = userBookmarks.filter(
        b => b.target_type === filters.targetType
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      userBookmarks = userBookmarks.filter(b =>
        filters.tags!.some(tag => b.tags?.includes(tag) || false)
      );
    }

    if (filters.search) {
      userBookmarks = userBookmarks.filter(b => {
        const searchText = filters.search!.toLowerCase();
        return (
          b.target_data.title.toLowerCase().includes(searchText) ||
          b.target_data.content.toLowerCase().includes(searchText) ||
          b.notes?.toLowerCase().includes(searchText) ||
          false ||
          b.tags?.some(tag => tag.toLowerCase().includes(searchText)) ||
          false
        );
      });
    }

    // Sort
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    userBookmarks.sort((a, b) => {
      const aValue = a[sortBy as keyof IBookmarkModel];
      const bValue = b[sortBy as keyof IBookmarkModel];
      if (sortOrder === 'asc') {
        return (aValue as any) > (bValue as any) ? 1 : -1;
      }
      return (aValue as any) < (bValue as any) ? 1 : -1;
    });

    // Paginate
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBookmarks = userBookmarks.slice(startIndex, endIndex);

    return {
      data: paginatedBookmarks,
      pagination: {
        page,
        limit,
        total: userBookmarks.length,
        totalPages: Math.ceil(userBookmarks.length / limit),
        hasNext: endIndex < userBookmarks.length,
        hasPrev: page > 1,
      },
    };
  }

  async createCollection(
    userId: EntityId,
    collectionData: any
  ): Promise<IBookmarkCollectionModel> {
    const collection: IBookmarkCollectionModel = {
      _id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      name: collectionData.name,
      description: collectionData.description || '',
      color: collectionData.color || '#000000',
      is_public: collectionData.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.collections.push(collection);
    return collection;
  }

  async getUserCollections(
    userId: EntityId
  ): Promise<IBookmarkCollectionModel[]> {
    return this.collections.filter(c => c.user_id === userId);
  }

  async updateCollection(
    userId: EntityId,
    collectionId: EntityId,
    updates: any
  ): Promise<IBookmarkCollectionModel | null> {
    const index = this.collections.findIndex(
      c => c._id === collectionId && c.user_id === userId
    );
    if (index === -1) return null;

    this.collections[index] = {
      ...this.collections[index],
      ...updates,
      updatedAt: new Date(),
    } as IBookmarkCollectionModel;

    return this.collections[index];
  }

  async deleteCollection(
    userId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    const index = this.collections.findIndex(
      c => c._id === collectionId && c.user_id === userId
    );
    if (index === -1) return false;

    this.collections.splice(index, 1);
    return true;
  }

  async addToCollection(
    userId: EntityId,
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    // Simplified implementation
    return true;
  }

  async removeFromCollection(
    userId: EntityId,
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    // Simplified implementation
    return true;
  }

  async getCollectionItems(
    userId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkModel[]> {
    // Simplified implementation
    return [];
  }

  async getBookmarkStats(userId: EntityId): Promise<{
    total: number;
    byType: Record<BookmarkTargetType, number>;
    recent: IBookmarkModel[];
  }> {
    const userBookmarks = await this.getUserBookmarks(userId);

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
