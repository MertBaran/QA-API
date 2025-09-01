import 'reflect-metadata';
import { AnswerController } from '../../../controllers/answerController';
import { Request, Response, NextFunction } from 'express';
import { IAnswerService } from '../../../services/contracts/IAnswerService';
import { FakeAnswerService } from '../../mocks/services/FakeAnswerService';

describe('AnswerController Unit Tests', () => {
  let answerController: AnswerController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let fakeAnswerService: FakeAnswerService;

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
    fakeAnswerService = new FakeAnswerService();

    // Create controller instance
    answerController = new AnswerController(fakeAnswerService);

    // Add some test data
    fakeAnswerService.addAnswer({
      _id: 'answer1',
      content: 'Test Answer 1',
      user: 'user123',
      question: 'question1',
      likes: [],
      createdAt: new Date(),
    });

    fakeAnswerService.addAnswer({
      _id: 'answer2',
      content: 'Test Answer 2',
      user: 'user456',
      question: 'question1',
      likes: [],
      createdAt: new Date(),
    });
  });

  describe('addNewAnswerToQuestion', () => {
    it('should create a new answer successfully', async () => {
      // Arrange
      mockRequest.params = { question_id: 'question1' };
      mockRequest.body = {
        content: 'New test answer',
      };

      // Act
      await answerController.addNewAnswerToQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.createAnswer).toHaveBeenCalledWith(
        {
          content: 'New test answer',
        },
        'question1',
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          content: 'New test answer',
        }),
      });
    });

    it('should handle missing user authentication', async () => {
      // Arrange
      (mockRequest as any).user = undefined;

      // Act
      await answerController.addNewAnswerToQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAllAnswersByQuestion', () => {
    it('should return all answers for a question successfully', async () => {
      // Arrange
      mockRequest.params = { question_id: 'question1' };

      // Act
      await answerController.getAllAnswersByQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.getAnswersByQuestion).toHaveBeenCalledWith(
        'question1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: 'answer1',
            content: 'Test Answer 1',
          }),
          expect.objectContaining({
            _id: 'answer2',
            content: 'Test Answer 2',
          }),
        ]),
      });
    });

    it('should handle empty answers list', async () => {
      // Arrange
      mockRequest.params = { question_id: 'question2' };

      // Act
      await answerController.getAllAnswersByQuestion(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.getAnswersByQuestion).toHaveBeenCalledWith(
        'question2'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('getSingleAnswer', () => {
    it('should return single answer successfully', async () => {
      // Arrange
      mockRequest.params = { answer_id: 'answer1' };

      // Act
      await answerController.getSingleAnswer(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.getAnswerById).toHaveBeenCalledWith('answer1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'answer1',
          content: 'Test answer content',
        }),
      });
    });

    it('should handle answer not found', async () => {
      // Arrange
      mockRequest.params = { answer_id: 'nonexistent' };

      // Act
      await answerController.getSingleAnswer(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.getAnswerById).toHaveBeenCalledWith(
        'nonexistent'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'nonexistent',
          content: 'Test answer content',
        }),
      });
    });
  });

  describe('editAnswer', () => {
    it('should update answer successfully', async () => {
      // Arrange
      mockRequest.params = { answer_id: 'answer1' };
      mockRequest.body = {
        content: 'Updated answer content',
      };

      // Act
      await answerController.editAnswer(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.getAnswerById).toHaveBeenCalledWith('answer1');
      expect(fakeAnswerService.updateAnswer).toHaveBeenCalledWith(
        'answer1',
        'Updated answer content'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'answer1',
          content: 'Test answer content',
        }),
      });
    });
  });

  describe('deleteAnswer', () => {
    it('should delete answer successfully', async () => {
      // Arrange
      mockRequest.params = {
        answer_id: 'answer1',
        question_id: 'question1',
      };

      // Act
      await answerController.deleteAnswer(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.deleteAnswer).toHaveBeenCalledWith(
        'answer1',
        'question1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
      });
    });
  });

  describe('likeAnswer', () => {
    it('should like answer successfully', async () => {
      // Arrange
      mockRequest.params = { answer_id: 'answer1' };
      (mockRequest as any).user = { id: 'user123' };

      // Act
      await answerController.likeAnswer(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.likeAnswer).toHaveBeenCalledWith(
        'answer1',
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'answer1',
        }),
      });
    });
  });

  describe('undoLikeAnswer', () => {
    it('should unlike answer successfully', async () => {
      // Arrange
      mockRequest.params = { answer_id: 'answer1' };
      (mockRequest as any).user = { id: 'user123' };

      // Act
      await answerController.undoLikeAnswer(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAnswerService.undoLikeAnswer).toHaveBeenCalledWith(
        'answer1',
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          _id: 'answer1',
        }),
      });
    });
  });
});
