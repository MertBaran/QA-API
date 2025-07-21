import { injectable, inject } from 'tsyringe';
import { IQuestionRepository } from '../../repositories/interfaces/IQuestionRepository';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import CustomError from '../../helpers/error/CustomError';
import { EntityId } from '../../types/database';
import { ICacheProvider } from '../../infrastructure/cache/ICacheProvider';
import { IQuestionService } from '../contracts/IQuestionService';
import { QuestionServiceMessages } from '../constants/ServiceMessages';

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
    try {
      const question = await this.questionRepository.create({
        ...questionData,
        user: userId,
      });
      await this.cacheProvider.del('questions:all');
      return question;
    } catch (_err) {
      console.error('QuestionManager createQuestion error:', _err);
      throw new CustomError(
        QuestionServiceMessages.QuestionCreationDbError.en,
        500
      );
    }
  }

  async getAllQuestions(): Promise<IQuestionModel[]> {
    const cacheKey = 'questions:all';
    try {
      const cached = await this.cacheProvider.get<IQuestionModel[]>(cacheKey);
      if (cached) {
        return cached;
      }
      const questions = await this.questionRepository.findAll();
      await this.cacheProvider.set<IQuestionModel[]>(cacheKey, questions, 60);
      return questions;
    } catch (_err) {
      throw new CustomError(
        QuestionServiceMessages.GetAllQuestionsDbError.en,
        500
      );
    }
  }

  async getQuestionById(questionId: EntityId): Promise<IQuestionModel> {
    try {
      const question =
        await this.questionRepository.findByIdWithPopulate(questionId);
      if (!question) {
        throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
      }
      return question;
    } catch (err) {
      // Re-throw CustomErrors as-is
      if (err instanceof CustomError) {
        throw err;
      }
      throw new CustomError(QuestionServiceMessages.GetQuestionDbError.en, 500);
    }
  }

  async updateQuestion(
    questionId: EntityId,
    updateData: { title?: string; content?: string }
  ): Promise<IQuestionModel> {
    try {
      const question = await this.questionRepository.updateById(
        questionId,
        updateData
      );
      if (!question) {
        throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
      }
      await this.cacheProvider.del('questions:all');
      return question;
    } catch (_err) {
      throw new CustomError(
        QuestionServiceMessages.UpdateQuestionDbError.en,
        500
      );
    }
  }

  async deleteQuestion(questionId: EntityId): Promise<IQuestionModel> {
    try {
      const question = await this.questionRepository.deleteById(questionId);
      if (!question) {
        throw new CustomError(QuestionServiceMessages.QuestionNotFound.en, 404);
      }
      await this.cacheProvider.del('questions:all');
      return question;
    } catch (_err) {
      // Re-throw CustomErrors as-is
      if (_err instanceof CustomError) {
        throw _err;
      }
      throw new CustomError(
        QuestionServiceMessages.DeleteQuestionDbError.en,
        500
      );
    }
  }

  async likeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    try {
      const question = await this.questionRepository.likeQuestion(
        questionId,
        userId
      );
      if (!question) {
        const exists = await this.questionRepository.findById(questionId);
        if (!exists)
          throw new CustomError(
            QuestionServiceMessages.QuestionNotFound.en,
            404
          );
        throw new CustomError(QuestionServiceMessages.AlreadyLiked.en, 400);
      }
      return question;
    } catch (_err) {
      // Re-throw CustomErrors as-is
      if (_err instanceof CustomError) {
        throw _err;
      }
      throw new CustomError(
        QuestionServiceMessages.LikeQuestionDbError.en,
        500
      );
    }
  }

  async undoLikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    try {
      const question = await this.questionRepository.unlikeQuestion(
        questionId,
        userId
      );
      if (!question) {
        const exists = await this.questionRepository.findById(questionId);
        if (!exists)
          throw new CustomError(
            QuestionServiceMessages.QuestionNotFound.en,
            404
          );
        throw new CustomError(QuestionServiceMessages.NotLikedYet.en, 400);
      }
      return question;
    } catch (_err) {
      throw new CustomError(QuestionServiceMessages.UndoLikeDbError.en, 500);
    }
  }

  async getQuestionsByUser(userId: EntityId): Promise<IQuestionModel[]> {
    return await this.questionRepository.findByUser(userId);
  }

  async searchQuestions(searchTerm: string): Promise<IQuestionModel[]> {
    return await this.questionRepository.searchByTitle(searchTerm);
  }
}
