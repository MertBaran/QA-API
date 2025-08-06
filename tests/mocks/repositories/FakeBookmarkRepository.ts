import { IBookmarkRepository } from '../../../repositories/interfaces/IBookmarkRepository';
import {
  IBookmarkModel,
  IBookmarkCollectionModel,
  IBookmarkCollectionItemModel,
  BookmarkTargetType,
} from '../../../models/interfaces/IBookmarkModel';
import { EntityId } from '../../../types/database';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../../types/dto/common/pagination.dto';

export class FakeBookmarkRepository implements IBookmarkRepository {
  private bookmarks: IBookmarkModel[] = [];
  private collections: IBookmarkCollectionModel[] = [];
  private collectionItems: IBookmarkCollectionItemModel[] = [];

  async create(
    data: Omit<IBookmarkModel, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<IBookmarkModel> {
    const bookmark: IBookmarkModel = {
      _id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookmarks.push(bookmark);
    return bookmark;
  }

  async findById(id: EntityId): Promise<IBookmarkModel | null> {
    return this.bookmarks.find(b => b._id === id) || null;
  }

  async findAll(): Promise<IBookmarkModel[]> {
    return [...this.bookmarks];
  }

  async update(
    id: EntityId,
    data: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel | null> {
    const index = this.bookmarks.findIndex(b => b._id === id);
    if (index === -1) return null;

    this.bookmarks[index] = {
      ...this.bookmarks[index],
      ...data,
      updatedAt: new Date(),
    } as IBookmarkModel;
    return this.bookmarks[index];
  }

  async delete(id: EntityId): Promise<boolean> {
    const index = this.bookmarks.findIndex(b => b._id === id);
    if (index === -1) return false;

    this.bookmarks.splice(index, 1);
    return true;
  }

  async updateById(
    id: EntityId,
    data: Partial<IBookmarkModel>
  ): Promise<IBookmarkModel | null> {
    return this.update(id, data);
  }

  async deleteById(id: EntityId): Promise<IBookmarkModel | null> {
    const bookmark = await this.findById(id);
    if (!bookmark) return null;

    const deleted = await this.delete(id);
    return deleted ? bookmark : null;
  }

  async findByUser(userId: EntityId): Promise<IBookmarkModel[]> {
    return this.bookmarks.filter(b => b.user_id === userId);
  }

  async findByTarget(
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<IBookmarkModel[]> {
    return this.bookmarks.filter(
      b => b.target_type === targetType && b.target_id === targetId
    );
  }

  async findByUserAndTarget(
    userId: EntityId,
    targetType: BookmarkTargetType,
    targetId: EntityId
  ): Promise<IBookmarkModel | null> {
    return (
      this.bookmarks.find(
        b =>
          b.user_id === userId &&
          b.target_type === targetType &&
          b.target_id === targetId
      ) || null
    );
  }

  async searchByUser(
    userId: EntityId,
    query: string
  ): Promise<IBookmarkModel[]> {
    const userBookmarks = await this.findByUser(userId);
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

  async findByType(
    userId: EntityId,
    targetType: BookmarkTargetType
  ): Promise<IBookmarkModel[]> {
    return this.bookmarks.filter(
      b => b.user_id === userId && b.target_type === targetType
    );
  }

  async findByTags(
    userId: EntityId,
    tags: string[]
  ): Promise<IBookmarkModel[]> {
    const userBookmarks = await this.findByUser(userId);
    return userBookmarks.filter(bookmark =>
      tags.some(tag => bookmark.tags?.includes(tag) || false)
    );
  }

  async findPaginated(
    userId: EntityId,
    filters: PaginationQueryDTO & {
      targetType?: BookmarkTargetType;
      tags?: string[];
      search?: string;
    }
  ): Promise<PaginatedResponse<IBookmarkModel>> {
    let userBookmarks = await this.findByUser(userId);

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

  // Collection methods (simplified for now)
  async createCollection(
    collection: Omit<
      IBookmarkCollectionModel,
      '_id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<IBookmarkCollectionModel> {
    const newCollection: IBookmarkCollectionModel = {
      _id: Math.random().toString(36).substr(2, 9),
      ...collection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.collections.push(newCollection);
    return newCollection;
  }

  async findCollectionsByUser(
    userId: EntityId
  ): Promise<IBookmarkCollectionModel[]> {
    return this.collections.filter(c => c.user_id === userId);
  }

  async updateCollection(
    collectionId: EntityId,
    updates: Partial<IBookmarkCollectionModel>
  ): Promise<IBookmarkCollectionModel | null> {
    const index = this.collections.findIndex(c => c._id === collectionId);
    if (index === -1) return null;

    this.collections[index] = {
      ...this.collections[index],
      ...updates,
      updatedAt: new Date(),
    } as IBookmarkCollectionModel;
    return this.collections[index];
  }

  async deleteCollection(collectionId: EntityId): Promise<boolean> {
    const index = this.collections.findIndex(c => c._id === collectionId);
    if (index === -1) return false;

    this.collections.splice(index, 1);
    return true;
  }

  async addToCollection(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel> {
    const item: IBookmarkCollectionItemModel = {
      _id: Math.random().toString(36).substr(2, 9),
      bookmark_id: bookmarkId,
      collection_id: collectionId,
      added_at: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.collectionItems.push(item);
    return item;
  }

  async removeFromCollection(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<boolean> {
    const index = this.collectionItems.findIndex(
      item =>
        item.bookmark_id === bookmarkId && item.collection_id === collectionId
    );
    if (index === -1) return false;

    this.collectionItems.splice(index, 1);
    return true;
  }

  async findCollectionItems(collectionId: EntityId): Promise<IBookmarkModel[]> {
    const itemIds = this.collectionItems
      .filter(item => item.collection_id === collectionId)
      .map(item => item.bookmark_id);

    return this.bookmarks.filter(bookmark => itemIds.includes(bookmark._id));
  }

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
