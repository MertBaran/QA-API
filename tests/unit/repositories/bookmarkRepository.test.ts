import { BookmarkRepository } from '../../../repositories/BookmarkRepository';
import { IBookmarkRepository } from '../../../repositories/interfaces/IBookmarkRepository';
import {
  IBookmarkModel,
  BookmarkTargetType,
} from '../../../models/interfaces/IBookmarkModel';
import { FakeBookmarkRepository } from '../../mocks/repositories/FakeBookmarkRepository';
import { FakeLoggerProvider } from '../../mocks/logger/FakeLoggerProvider';
import { ApplicationError } from '../../../helpers/error/ApplicationError';

describe('BookmarkRepository', () => {
  let bookmarkRepository: IBookmarkRepository;
  let fakeLogger: FakeLoggerProvider;

  beforeEach(() => {
    fakeLogger = new FakeLoggerProvider();
    bookmarkRepository = new FakeBookmarkRepository();
  });

  describe('create', () => {
    it('should create a bookmark successfully', async () => {
      const bookmarkData = {
        user_id: '507f1f77bcf86cd799439012',
        target_type: 'question' as BookmarkTargetType,
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Test Question',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test', 'question'],
        notes: 'Test bookmark',
        is_public: false,
      };

      const result = await bookmarkRepository.create(bookmarkData);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.user_id).toBe(bookmarkData.user_id);
      expect(result.target_type).toBe(bookmarkData.target_type);
      expect(result.target_id).toBe(bookmarkData.target_id);
    });
  });

  describe('findById', () => {
    it('should find bookmark by id', async () => {
      const bookmarkData = {
        user_id: '507f1f77bcf86cd799439012',
        target_type: 'question' as BookmarkTargetType,
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Test Question',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark',
        is_public: false,
      };

      const created = await bookmarkRepository.create(bookmarkData);
      const found = await bookmarkRepository.findById(created._id);

      expect(found).toBeDefined();
      expect(found?._id).toBe(created._id);
    });

    it('should return null for non-existent bookmark', async () => {
      const result = await bookmarkRepository.findById(
        '507f1f77bcf86cd799439014'
      );

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return user bookmarks', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'question',
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Question 1',
          content: 'Content 1',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Bookmark 1',
        is_public: false,
      });

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'answer',
        target_id: '507f1f77bcf86cd799439014',
        target_data: {
          title: 'Answer 1',
          content: 'Content 2',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Bookmark 2',
        is_public: false,
      });

      const bookmarks = await bookmarkRepository.findByUser(userId);

      expect(Array.isArray(bookmarks)).toBe(true);
      expect(bookmarks.length).toBe(2);
      expect(bookmarks.every(b => b.user_id === userId)).toBe(true);
    });
  });

  describe('findByUserAndTarget', () => {
    it('should find bookmark by user and target', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const targetType = 'question' as BookmarkTargetType;
      const targetId = '507f1f77bcf86cd799439013';

      await bookmarkRepository.create({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        target_data: {
          title: 'Test Question',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark',
        is_public: false,
      });

      const result = await bookmarkRepository.findByUserAndTarget(
        userId,
        targetType,
        targetId
      );

      expect(result).toBeDefined();
      expect(result?.user_id).toBe(userId);
      expect(result?.target_type).toBe(targetType);
      expect(result?.target_id).toBe(targetId);
    });

    it('should return null if bookmark does not exist', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const targetType = 'question' as BookmarkTargetType;
      const targetId = '507f1f77bcf86cd799439014';

      const result = await bookmarkRepository.findByUserAndTarget(
        userId,
        targetType,
        targetId
      );

      expect(result).toBeNull();
    });
  });

  describe('searchByUser', () => {
    it('should search bookmarks by query', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'question',
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'JavaScript Question',
          content: 'JavaScript content',
          created_at: new Date().toISOString(),
        },
        tags: ['javascript'],
        notes: 'About JavaScript',
        is_public: false,
      });

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'answer',
        target_id: '507f1f77bcf86cd799439014',
        target_data: {
          title: 'Python Answer',
          content: 'Python content',
          created_at: new Date().toISOString(),
        },
        tags: ['python'],
        notes: 'About Python',
        is_public: false,
      });

      const results = await bookmarkRepository.searchByUser(
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

  describe('findByType', () => {
    it('should return bookmarks by type', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'question',
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Question 1',
          content: 'Content 1',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test question',
        is_public: false,
      });

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'answer',
        target_id: '507f1f77bcf86cd799439014',
        target_data: {
          title: 'Answer 1',
          content: 'Content 2',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test answer',
        is_public: false,
      });

      const questionBookmarks = await bookmarkRepository.findByType(
        userId,
        'question'
      );

      expect(Array.isArray(questionBookmarks)).toBe(true);
      expect(questionBookmarks.every(b => b.target_type === 'question')).toBe(
        true
      );
    });
  });

  describe('findByTags', () => {
    it('should return bookmarks by tags', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'question',
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Question 1',
          content: 'Content 1',
          created_at: new Date().toISOString(),
        },
        tags: ['javascript', 'frontend'],
        notes: 'Test question',
        is_public: false,
      });

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'answer',
        target_id: '507f1f77bcf86cd799439014',
        target_data: {
          title: 'Answer 1',
          content: 'Content 2',
          created_at: new Date().toISOString(),
        },
        tags: ['python', 'backend'],
        notes: 'Test answer',
        is_public: false,
      });

      const javascriptBookmarks = await bookmarkRepository.findByTags(userId, [
        'javascript',
      ]);

      expect(Array.isArray(javascriptBookmarks)).toBe(true);
      expect(
        javascriptBookmarks.every(b => b.tags?.includes('javascript') || false)
      ).toBe(true);
    });
  });

  describe('update', () => {
    it('should update bookmark successfully', async () => {
      const bookmarkData = {
        user_id: '507f1f77bcf86cd799439012',
        target_type: 'question' as BookmarkTargetType,
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Original Title',
          content: 'Original content',
          created_at: new Date().toISOString(),
        },
        tags: ['original'],
        notes: 'Original notes',
        is_public: false,
      };

      const created = await bookmarkRepository.create(bookmarkData);

      const updateData = {
        tags: ['updated'],
        notes: 'Updated notes',
        is_public: true,
      };

      const updated = await bookmarkRepository.updateById(
        created._id,
        updateData
      );

      expect(updated).toBeDefined();
      expect(updated?.tags).toEqual(['updated']);
      expect(updated?.notes).toBe('Updated notes');
      expect(updated?.is_public).toBe(true);
    });

    it('should return null if bookmark does not exist', async () => {
      const result = await bookmarkRepository.updateById(
        '507f1f77bcf86cd799439014',
        {
          notes: 'Updated notes',
        }
      );

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete bookmark successfully', async () => {
      const bookmarkData = {
        user_id: '507f1f77bcf86cd799439012',
        target_type: 'question' as BookmarkTargetType,
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Test Question',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark',
        is_public: false,
      };

      const created = await bookmarkRepository.create(bookmarkData);
      const deleted = await bookmarkRepository.deleteById(created._id);

      expect(deleted).toBe(true);

      const found = await bookmarkRepository.findById(created._id);
      expect(found).toBeNull();
    });

    it('should return false if bookmark does not exist', async () => {
      const result = await bookmarkRepository.deleteById(
        '507f1f77bcf86cd799439014'
      );

      expect(result).toBe(false);
    });
  });

  describe('getBookmarkStats', () => {
    it('should return bookmark statistics', async () => {
      const userId = '507f1f77bcf86cd799439012';

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'question',
        target_id: '507f1f77bcf86cd799439013',
        target_data: {
          title: 'Question 1',
          content: 'Content 1',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test question',
        is_public: false,
      });

      await bookmarkRepository.create({
        user_id: userId,
        target_type: 'answer',
        target_id: '507f1f77bcf86cd799439014',
        target_data: {
          title: 'Answer 1',
          content: 'Content 2',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test answer',
        is_public: false,
      });

      const stats = await bookmarkRepository.getBookmarkStats(userId);

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('recent');
      expect(typeof stats.total).toBe('number');
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byType.question).toBeGreaterThan(0);
      expect(stats.byType.answer).toBeGreaterThan(0);
    });
  });
});
