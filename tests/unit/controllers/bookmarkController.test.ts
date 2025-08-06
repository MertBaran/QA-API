import { container } from 'tsyringe';
import { BookmarkController } from '../../../controllers/bookmarkController';
import { IBookmarkService } from '../../../services/contracts/IBookmarkService';
import { FakeBookmarkService } from '../../mocks/services/FakeBookmarkService';
import { FakeLoggerProvider } from '../../mocks/logger/FakeLoggerProvider';
import { Request, Response } from 'express';
import { ApplicationError } from '../../../helpers/error/ApplicationError';

describe('BookmarkController', () => {
  let bookmarkController: BookmarkController;
  let bookmarkService: IBookmarkService;
  let fakeLogger: FakeLoggerProvider;
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    container.clearInstances();

    fakeLogger = new FakeLoggerProvider();
    container.registerInstance('ILoggerProvider', fakeLogger);

    bookmarkService = new FakeBookmarkService();
    container.registerInstance('IBookmarkService', bookmarkService);

    bookmarkController = container.resolve(BookmarkController);

    mockRequest = {
      user: { _id: '507f1f77bcf86cd799439012' },
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    container.clearInstances();
  });

  describe('addBookmark', () => {
    it('should add bookmark successfully', async () => {
      const bookmarkData = {
        targetType: 'question' as const,
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Test Question',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
        tags: ['test'],
        notes: 'Test bookmark',
        isPublic: false,
      };

      mockRequest.body = bookmarkData;

      await bookmarkController.addBookmark(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            target_type: 'question',
            target_id: '507f1f77bcf86cd799439013',
          }),
        })
      );
    });

    it('should return 401 without user', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        targetType: 'question',
        targetId: '507f1f77bcf86cd799439013',
        targetData: {
          title: 'Test',
          content: 'Test content',
          created_at: new Date().toISOString(),
        },
      };

      await bookmarkController.addBookmark(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getUserBookmarks', () => {
    it('should return user bookmarks', async () => {
      await bookmarkController.getUserBookmarks(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });

    it('should return 401 without user', async () => {
      mockRequest.user = undefined;

      await bookmarkController.getUserBookmarks(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('checkBookmarkExists', () => {
    it('should check if bookmark exists', async () => {
      mockRequest.params = {
        targetType: 'question',
        targetId: '507f1f77bcf86cd799439013',
      };

      await bookmarkController.checkBookmarkExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            exists: expect.any(Boolean),
          }),
        })
      );
    });
  });

  describe('removeBookmark', () => {
    it('should remove bookmark successfully', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439013' };

      await bookmarkController.removeBookmark(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            deleted: expect.any(Boolean),
          }),
        })
      );
    });
  });

  describe('updateBookmark', () => {
    it('should update bookmark successfully', async () => {
      mockRequest.params = { id: '507f1f77bcf86cd799439013' };
      mockRequest.body = {
        notes: 'Updated notes',
        tags: ['updated'],
        isPublic: true,
      };

      await bookmarkController.updateBookmark(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: '507f1f77bcf86cd799439013',
          }),
        })
      );
    });
  });

  describe('searchBookmarks', () => {
    it('should search bookmarks', async () => {
      mockRequest.query = { q: 'test' };

      await bookmarkController.searchBookmarks(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });
  });

  describe('getPaginatedBookmarks', () => {
    it('should return paginated bookmarks', async () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
        sortOrder: 'desc',
        sortBy: 'createdAt',
      };

      await bookmarkController.getPaginatedBookmarks(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            data: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number),
              totalPages: expect.any(Number),
            }),
          }),
        })
      );
    });
  });

  describe('getBookmarkStats', () => {
    it('should return bookmark statistics', async () => {
      await bookmarkController.getBookmarkStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total: expect.any(Number),
            byType: expect.any(Object),
            recent: expect.any(Array),
          }),
        })
      );
    });
  });
});
