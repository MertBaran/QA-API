import { injectable, inject } from 'tsyringe';
import { IQuestionRepository } from '../../repositories/interfaces/IQuestionRepository';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import CustomError from '../../infrastructure/error/CustomError';
import { EntityId } from '../../types/database';
import { ICacheProvider } from '../../infrastructure/cache/ICacheProvider';
import { IQuestionService } from '../contracts/IQuestionService';
import { QuestionServiceMessages } from '../constants/ServiceMessages';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/question/pagination.dto';

@injectable()
export class QuestionManager implements IQuestionService {
  constructor(
    @inject('IQuestionRepository')
    private questionRepository: IQuestionRepository,
    @inject('ICacheProvider') private cacheProvider: ICacheProvider
  ) {}

  async createQuestion(
    questionData: any,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.create({
      ...questionData,
      user: userId,
    });
    // Invalidate cache when new question is created
    await this.cacheProvider.del('questions:all');
    return question;
  }

  async getAllQuestions(): Promise<IQuestionModel[]> {
    const cacheKey = 'questions:all';
    const cached = await this.cacheProvider.get<IQuestionModel[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const questions = await this.questionRepository.findAll();
    await this.cacheProvider.set<IQuestionModel[]>(cacheKey, questions, 60);
    return questions;
  }

  async getQuestionsPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    const result = await this.questionRepository.findPaginated(filters);
    return result;
  }

  async getQuestionById(questionId: EntityId): Promise<IQuestionModel> {
    const question =
      await this.questionRepository.findByIdWithPopulate(questionId);
    if (!question) {
      throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
    }
    return question;
  }

  async updateQuestion(
    questionId: EntityId,
    updateData: { title?: string; content?: string }
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.updateById(
      questionId,
      updateData
    );
    if (!question) {
      throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
    }
    await this.cacheProvider.del('questions:all');
    return question;
  }

  async deleteQuestion(questionId: EntityId): Promise<IQuestionModel> {
    const question = await this.questionRepository.deleteById(questionId);
    if (!question) {
      throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
    }
    await this.cacheProvider.del('questions:all');
    return question;
  }

  async likeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.likeQuestion(
      questionId,
      userId
    );
    if (!question) {
      const exists = await this.questionRepository.findById(questionId);
      if (!exists)
        throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
      throw new CustomError(QuestionServiceMessages.AlreadyLiked.en, 400);
    }
    return question;
  }

  async undoLikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.unlikeQuestion(
      questionId,
      userId
    );
    if (!question) {
      const exists = await this.questionRepository.findById(questionId);
      if (!exists)
        throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
      throw new CustomError(QuestionServiceMessages.NotLikedYet.en, 400);
    }
    return question;
  }

  async getQuestionsByUser(userId: EntityId): Promise<IQuestionModel[]> {
    return await this.questionRepository.findByUser(userId);
  }

  async searchQuestions(searchTerm: string): Promise<IQuestionModel[]> {
    return await this.questionRepository.searchByTitle(searchTerm);
  }
}
