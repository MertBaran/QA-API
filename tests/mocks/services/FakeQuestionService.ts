import { IQuestionService } from '../../../services/contracts/IQuestionService';
import { IQuestionModel } from '../../../models/interfaces/IQuestionModel';
import { EntityId } from '../../../types/database';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../../types/dto/question/pagination.dto';

export class FakeQuestionService implements IQuestionService {
  private questions: IQuestionModel[] = [];

  addQuestion = jest.fn((question: IQuestionModel): void => {
    this.questions.push(question);
  });

  createQuestion = jest
    .fn()
    .mockImplementation(
      async (questionData: any, userId: EntityId): Promise<IQuestionModel> => {
        const question: IQuestionModel = {
          _id: `question_${Date.now()}`,
          title: questionData.title,
          content: questionData.content,
          user: userId,
          tags: questionData.tags || [],
          likes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          slug: `question-${Date.now()}`,
          answers: [],
        } as IQuestionModel;

        this.questions.push(question);
        return question;
      }
    );

  getQuestionById = jest
    .fn()
    .mockImplementation(
      async (questionId: EntityId): Promise<IQuestionModel> => {
        return {
          _id: questionId,
          title: 'Test Question',
          content: 'Test content',
          user: 'user_1',
          tags: ['test'],
          likes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          slug: 'test-question',
          answers: [],
        } as IQuestionModel;
      }
    );

  getAllQuestions = jest
    .fn()
    .mockImplementation(async (): Promise<IQuestionModel[]> => {
      return this.questions.length > 0
        ? this.questions
        : [
            {
              _id: 'question_1',
              title: 'Test Question 1',
              content: 'Test content 1',
              user: 'user_1',
              tags: ['test'],
              likes: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              slug: 'test-question-1',
              answers: [],
            } as IQuestionModel,
          ];
    });

  updateQuestion = jest
    .fn()
    .mockImplementation(
      async (
        questionId: EntityId,
        updateData: { title?: string; content?: string }
      ): Promise<IQuestionModel> => {
        return this.getQuestionById(questionId);
      }
    );

  deleteQuestion = jest
    .fn()
    .mockImplementation(
      async (questionId: EntityId): Promise<IQuestionModel> => {
        return this.getQuestionById(questionId);
      }
    );

  likeQuestion = jest
    .fn()
    .mockImplementation(
      async (
        questionId: EntityId,
        userId: EntityId
      ): Promise<IQuestionModel> => {
        return this.getQuestionById(questionId);
      }
    );

  undoLikeQuestion = jest
    .fn()
    .mockImplementation(
      async (
        questionId: EntityId,
        userId: EntityId
      ): Promise<IQuestionModel> => {
        return this.getQuestionById(questionId);
      }
    );

  getQuestionsPaginated = jest
    .fn()
    .mockImplementation(
      async (
        filters: PaginationQueryDTO
      ): Promise<PaginatedResponse<IQuestionModel>> => {
        const questions = await this.getAllQuestions();
        const currentPage = filters.page;
        const itemsPerPage = filters.limit;
        const totalItems = questions.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
          data: questions,
          pagination: {
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
          },
        };
      }
    );

  async getQuestionsByUser(userId: EntityId): Promise<IQuestionModel[]> {
    return [await this.getQuestionById('question_1')];
  }

  async searchQuestions(searchTerm: string): Promise<IQuestionModel[]> {
    return [await this.getQuestionById('question_1')];
  }
}
