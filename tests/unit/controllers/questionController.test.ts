import 'reflect-metadata';
import { QuestionController } from '../../../controllers/questionController';
import { Request, Response, NextFunction } from 'express';
import { IQuestionService } from '../../../services/contracts/IQuestionService';
import { FakeQuestionService } from '../../mocks/services/FakeQuestionService';

describe('QuestionController Unit Tests', () => {
  let questionController: QuestionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let fakeQuestionService: FakeQuestionService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock response
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Create mock next function
    mockNext = jest.fn();

    // Create mock request
    mockRequest = {
      params: {},
      body: {},
      user: { id: 'user123' },
      locale: 'en',
    } as any;

    // Create fake service
    fakeQuestionService = new FakeQuestionService();

    // Create controller instance
    questionController = new QuestionController(fakeQuestionService);

    // Add some test data
    fakeQuestionService.addQuestion({
      _id: 'question1',
      title: 'Test Question 1',
      content: 'Test content 1',
      user: 'user123',
      slug: 'test-question-1',
      tags: ['test', 'question'],
      category: 'general',
      likes: [],
      answers: [],
      createdAt: new Date(),
    });

    fakeQuestionService.addQuestion({
      _id: 'question2',
      title: 'Test Question 2',
      content: 'Test content 2',
      user: 'user456',
      slug: 'test-question-2',
      tags: ['test', 'question'],
      category: 'general',
      likes: [],
      answers: [],
      createdAt: new Date(),
    });
  });

  describe('askNewQuestion', () => {
    it('should create a new question successfully', async () => {
      // Arrange
      mockRequest.body = {
        title: 'New Test Question',
        content: 'New test content',
        tags: ['new', 'test'],
      };

      // Act
      await questionController.askNewQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.createQuestion).toHaveBeenCalledWith(
        {
          title: 'New Test Question',
          content: 'New test content',
          tags: ['new', 'test'],
        },
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          title: 'New Test Question',
          content: 'New test content',
        }),
      });
    });

    it('should handle missing user authentication', async () => {
      // Arrange
      (mockRequest as any).user = undefined;

      // Act
      await questionController.askNewQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAllQuestions', () => {
    it('should return all questions successfully', async () => {
      // Act
      await questionController.getAllQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.getAllQuestions).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: 'question1',
            title: 'Test Question 1',
          }),
          expect.objectContaining({
            _id: 'question2',
            title: 'Test Question 2',
          }),
        ]),
      });
    });
  });

  describe('getQuestionsPaginated', () => {
    it('should return paginated questions successfully', async () => {
      // Arrange
      mockRequest.query = {
        page: '1',
        limit: '10',
        search: 'test',
      };

      // Act
      await questionController.getQuestionsPaginated(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.getQuestionsPaginated).toHaveBeenCalledWith({
        page: '1',
        limit: '10',
        search: 'test',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.any(Object),
        }),
      });
    });

    it('should handle empty query parameters', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await questionController.getQuestionsPaginated(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.getQuestionsPaginated).toHaveBeenCalledWith(
        {}
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSingleQuestion', () => {
    it('should return single question successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'question1' };

      // Act
      await questionController.getSingleQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.getQuestionById).toHaveBeenCalledWith(
        'question1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'question1',
          title: 'Test Question',
        }),
      });
    });

    it('should handle question not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };

      // Act
      await questionController.getSingleQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.getQuestionById).toHaveBeenCalledWith(
        'nonexistent'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'nonexistent',
          title: 'Test Question',
        }),
      });
    });
  });

  describe('editQuestion', () => {
    it('should update question successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'question1' };
      mockRequest.body = {
        title: 'Updated Question',
        content: 'Updated content',
      };

      // Act
      await questionController.editQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.updateQuestion).toHaveBeenCalledWith(
        'question1',
        {
          title: 'Updated Question',
          content: 'Updated content',
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'question1',
          title: 'Test Question',
        }),
      });
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'question1' };

      // Act
      await questionController.deleteQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.deleteQuestion).toHaveBeenCalledWith(
        'question1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
      });
    });
  });

  describe('likeQuestion', () => {
    it('should like question successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'question1' };
      (mockRequest as any).user = { id: 'user123' };

      // Act
      await questionController.likeQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.likeQuestion).toHaveBeenCalledWith(
        'question1',
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'question1',
        }),
      });
    });
  });

  describe('undoLikeQuestion', () => {
    it('should unlike question successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'question1' };
      (mockRequest as any).user = { id: 'user123' };

      // Act
      await questionController.undoLikeQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeQuestionService.undoLikeQuestion).toHaveBeenCalledWith(
        'question1',
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'question1',
        }),
      });
    });
  });
});
