import { container } from 'tsyringe';
import { BookmarkManager } from '../../../services/managers/BookmarkManager';
import { IBookmarkService } from '../../../services/contracts/IBookmarkService';
import { IBookmarkRepository } from '../../../repositories/interfaces/IBookmarkRepository';
import {
  IBookmarkModel,
  BookmarkTargetType,
} from '../../../models/interfaces/IBookmarkModel';
import { ApplicationError } from '../../../infrastructure/error/ApplicationError';
import { FakeBookmarkRepository } from '../../mocks/repositories/FakeBookmarkRepository';
import { FakeLoggerProvider } from '../../mocks/logger/FakeLoggerProvider';
import { FakeCacheProvider } from '../../mocks/cache/FakeCacheProvider';

describe('BookmarkService', () => {
  let bookmarkService: IBookmarkService;
  let bookmarkRepository: IBookmarkRepository;
  let fakeLogger: FakeLoggerProvider;
  let fakeCache: FakeCacheProvider;

  beforeEach(() => {
    // Clear container and register fake dependencies
    container.clearInstances();

    fakeLogger = new FakeLoggerProvider();
    container.registerInstance('ILoggerProvider', fakeLogger);

    fakeCache = new FakeCacheProvider();
    container.registerInstance('ICacheProvider', fakeCache);

    bookmarkRepository = new FakeBookmarkRepository();
    container.registerInstance('IBookmarkRepository', bookmarkRepository);

    bookmarkService = container.resolve(BookmarkManager);
  });

  afterEach(() => {
    container.clearInstances();
  });

  describe('addBookmark', () => {
    it('should add a bookmark successfully', async () => {
      const addBookmarkDTO = {
        targetType: 'question' as BookmarkTargetType,
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Test Question',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test', 'question'],
        notes: 'Test bookmark',
        isPublic: false,
      };

      const userId = '507f1f77bcf86cd799439012';

      const result = await bookmarkService.addBookmark(userId, addBookmarkDTO);

      expect(result).toBeDefined();
      expect(result.target_type).toBe('question');
      expect(result.target_id).toBe('507f1f77bcf86cd799439013');
      expect(result.user_id).toBe(userId);
    });

    it('should throw error if bookmark already exists', async () => {
      const addBookmarkDTO = {
        targetType: 'question' as BookmarkTargetType,
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Test',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark',
        isPublic: false,
      };

      const userId = '507f1f77bcf86cd799439012';

      await bookmarkService.addBookmark(userId, addBookmarkDTO);

      // Try to add the same bookmark again
      await expect(
        bookmarkService.addBookmark(userId, addBookmarkDTO)
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('removeBookmark', () => {
    it('should remove a bookmark successfully', async () => {
      const addBookmarkDTO = {
        targetType: 'question' as BookmarkTargetType,
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Test',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark',
        isPublic: false,
      };

      const userId = '507f1f77bcf86cd799439012';
      const bookmark = await bookmarkService.addBookmark(
        userId,
        addBookmarkDTO
      );

      const result = await bookmarkService.removeBookmark(userId, bookmark._id);

      expect(result).toBe(true);
    });

    it('should throw error if bookmark does not exist', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const bookmarkId = '507f1f77bcf86cd799439014';

      await expect(
        bookmarkService.removeBookmark(userId, bookmarkId)
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe('getUserBookmarks', () => {
    it('should return user bookmarks', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkService.addBookmark(userId, {
        targetType: 'question',
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Test 1',
          content: 'Test content 1',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark 1',
        isPublic: false,
      });

      await bookmarkService.addBookmark(userId, {
        targetType: 'answer',
        targetId: '507f1f77bcf86cd799439014',
        targetData: {
          title: 'Test 2',
          content: 'Test content 2',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark 2',
        isPublic: false,
      });

      const bookmarks = await bookmarkService.getUserBookmarks(userId);

      expect(Array.isArray(bookmarks)).toBe(true);
      expect(bookmarks.length).toBeGreaterThan(0);
      expect(bookmarks.every(b => b.user_id === userId)).toBe(true);
    });

    it('should return empty array for user with no bookmarks', async () => {
      const userId = '507f1f77bcf86cd799439015';

      const bookmarks = await bookmarkService.getUserBookmarks(userId);

      expect(Array.isArray(bookmarks)).toBe(true);
      expect(bookmarks.length).toBe(0);
    });
  });

  describe('checkBookmarkExists', () => {
    it('should return true if bookmark exists', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const targetType = 'question' as BookmarkTargetType;
      const targetId = '507f1f77bcf86cd799439013';

      await bookmarkService.addBookmark(userId, {
        targetType,
        targetId,
        targetData: {
          title: 'Test',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark',
        isPublic: false,
      });

      const exists = await bookmarkService.checkBookmarkExists(
        userId,
        targetType,
        targetId
      );

      expect(exists).toBe(true);
    });

    it('should return false if bookmark does not exist', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const targetType = 'question' as BookmarkTargetType;
      const targetId = '507f1f77bcf86cd799439014';

      const exists = await bookmarkService.checkBookmarkExists(
        userId,
        targetType,
        targetId
      );

      expect(exists).toBe(false);
    });
  });

  describe('searchBookmarks', () => {
    it('should search bookmarks by query', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkService.addBookmark(userId, {
        targetType: 'question',
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'JavaScript Question',
          content: 'JavaScript content',
          created_at: new Date().toISOString(),
        },
        tags: ['javascript'],
        notes: 'About JavaScript',
        isPublic: false,
      });

      await bookmarkService.addBookmark(userId, {
        targetType: 'answer',
        targetId: '507f1f77bcf86cd799439014',
        targetData: {
          title: 'Python Answer',
          content: 'Python content',
          created_at: new Date().toISOString(),
        },
        tags: ['python'],
        notes: 'About Python',
        isPublic: false,
      });

      const results = await bookmarkService.searchBookmarks(
        userId,
        'JavaScript'
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(b => b.target_data.title.includes('JavaScript'))
      ).toBe(true);
    });
  });

  describe('getBookmarkStats', () => {
    it('should return bookmark statistics', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkService.addBookmark(userId, {
        targetType: 'question',
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Question 1',
          content: 'Question content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test question',
        isPublic: false,
      });

      await bookmarkService.addBookmark(userId, {
        targetType: 'answer',
        targetId: '507f1f77bcf86cd799439014',
        targetData: {
          title: 'Answer 1',
          content: 'Answer content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test answer',
        isPublic: false,
      });

      const stats = await bookmarkService.getBookmarkStats(userId);

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('recent');
      expect(typeof stats.total).toBe('number');
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byType.question).toBeGreaterThan(0);
      expect(stats.byType.answer).toBeGreaterThan(0);
    });
  });

  describe('updateBookmark', () => {
    it('should update bookmark successfully', async () => {
      const userId = '507f1f77bcf86cd799439012';

      const bookmark = await bookmarkService.addBookmark(userId, {
        targetType: 'question',
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Original Title',
          content: 'Original content',
          created_at: new Date().toISOString(),
        },
        tags: ['original'],
        notes: 'Original notes',
        isPublic: false,
      });

      const updateData = {
        tags: ['updated'],
        notes: 'Updated notes',
        is_public: true,
      };

      const updatedBookmark = await bookmarkService.updateBookmark(
        userId,
        bookmark._id,
        updateData
      );

      expect(updatedBookmark).toBeDefined();
      expect(updatedBookmark?.tags).toEqual(['updated']);
      expect(updatedBookmark?.notes).toBe('Updated notes');
      expect(updatedBookmark?.is_public).toBe(true);
    });

    it('should throw error if bookmark does not exist', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const bookmarkId = '507f1f77bcf86cd799439014';

      await expect(
        bookmarkService.updateBookmark(userId, bookmarkId, {
          notes: 'Updated notes',
        })
      ).rejects.toThrow(ApplicationError);
    });
  });
});
