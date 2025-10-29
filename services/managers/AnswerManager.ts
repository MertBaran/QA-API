import { injectable, inject } from 'tsyringe';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { IAnswerRepository } from '../../repositories/interfaces/IAnswerRepository';
import { EntityId } from '../../types/database';
import { IQuestionRepository } from '../../repositories/interfaces/IQuestionRepository';
import { IAnswerService } from '../contracts/IAnswerService';
import {
  AnswerServiceMessages,
  QuestionServiceMessages,
} from '../constants/ServiceMessages';
import { IIndexClient } from '../../infrastructure/search/IIndexClient';
import { ISearchClient } from '../../infrastructure/search/ISearchClient';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { IProjector } from '../../infrastructure/search/IProjector';
import {
  AnswerSearchDoc,
  QuestionSearchDoc,
} from '../../infrastructure/search/SearchDocument';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';

@injectable()
export class AnswerManager implements IAnswerService {
  constructor(
    @inject('IAnswerRepository') private answerRepository: IAnswerRepository,
    @inject('IQuestionRepository')
    private questionRepository: IQuestionRepository,
    @inject('IIndexClient')
    private indexClient: IIndexClient,
    @inject('ISearchClient')
    private searchClient: ISearchClient,
    @inject('IProjector<IAnswerModel, AnswerSearchDoc>')
    private answerProjector: IProjector<IAnswerModel, AnswerSearchDoc>,
    @inject('IProjector<IQuestionModel, QuestionSearchDoc>')
    private questionProjector: IProjector<IQuestionModel, QuestionSearchDoc>,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {}

  async createAnswer(
    answerData: any,
    questionId: EntityId,
    userId: EntityId
  ): Promise<IAnswerModel> {
    // Question'ın var olup olmadığını kontrol et
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
    }

    const answer = await this.answerRepository.create({
      ...answerData,
      question: question._id,
      user: userId,
    });

    // Project entity to SearchDocument and index
    const answerSearchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'index',
      answerSearchDoc
    );

    // Update question index - answers array changed
    const updatedQuestion = await this.questionRepository.findById(questionId);
    if (updatedQuestion) {
      const questionSearchDoc = this.questionProjector.project(updatedQuestion);
      await this.indexClient.sync(
        this.questionProjector.indexName,
        'update',
        questionSearchDoc
      );
    }

    return answer;
  }

  async getAnswersByQuestion(questionId: EntityId): Promise<IAnswerModel[]> {
    try {
      const result = await this.searchClient.search<AnswerSearchDoc>(
        this.answerProjector.indexName,
        this.answerProjector.searchFields,
        '',
        {
          page: 1,
          limit: 100,
          filters: {
            questionId: String(questionId),
          },
          sortBy: 'date',
          sortOrder: 'desc',
        }
      );
      // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
      return result.hits.map(
        (doc): IAnswerModel => ({
          _id: doc._id as EntityId,
          content: doc.content,
          user: doc.userId as EntityId,
          userInfo: doc.userInfo,
          question: doc.questionId as EntityId,
          likes: doc.likes.map(id => id as EntityId),
          isAccepted: doc.isAccepted,
          createdAt: doc.createdAt || new Date(),
        })
      );
    } catch (error: any) {
      this.logger.warn(
        'Search failed for answers by question, falling back to MongoDB',
        {
          error: error.message,
        }
      );
    }

    // Fallback to MongoDB
    return await this.answerRepository.findByQuestion(questionId);
  }

  async getAnswerById(answerId: string): Promise<IAnswerModel> {
    const answer = await this.answerRepository.findByIdWithPopulate(answerId);
    if (!answer) {
      throw ApplicationError.notFoundError(
        AnswerServiceMessages.AnswerNotFound.en
      );
    }
    return answer;
  }

  async updateAnswer(answerId: string, content: string): Promise<IAnswerModel> {
    if (!content) {
      throw ApplicationError.validationError(
        AnswerServiceMessages.ContentRequired.en
      );
    }
    const answer = await this.answerRepository.updateById(answerId, {
      content,
    });
    if (!answer) {
      throw ApplicationError.notFoundError(
        AnswerServiceMessages.AnswerNotFound.en
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'update',
      searchDoc
    );

    return answer;
  }

  async deleteAnswer(answerId: string, questionId: string): Promise<void> {
    await this.answerRepository.deleteById(answerId);

    // Delete from index
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'delete',
      answerId
    );

    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      return;
    }

    question.answers = question.answers.filter(
      (id: any) => id.toString() !== answerId.toString()
    );
    await this.questionRepository.updateById(questionId, {
      answers: question.answers,
    });

    // Update question index - answers array changed
    const updatedQuestion = await this.questionRepository.findById(questionId);
    if (updatedQuestion) {
      const questionSearchDoc = this.questionProjector.project(updatedQuestion);
      await this.indexClient.sync(
        this.questionProjector.indexName,
        'update',
        questionSearchDoc
      );
    }
  }

  async likeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel> {
    const answer = await this.answerRepository.likeAnswer(answerId, userId);
    if (!answer) {
      // Answer var ama zaten beğenilmiş
      throw ApplicationError.businessError(
        AnswerServiceMessages.AlreadyLiked.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'update',
      searchDoc
    );

    return answer;
  }

  async undoLikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel> {
    const answer = await this.answerRepository.unlikeAnswer(answerId, userId);
    if (!answer) {
      // Answer var ama beğeni yok
      throw ApplicationError.businessError(
        AnswerServiceMessages.CannotUndoLike.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'update',
      searchDoc
    );

    return answer;
  }

  async getAnswersByUser(userId: EntityId): Promise<IAnswerModel[]> {
    try {
      const result = await this.searchClient.search<AnswerSearchDoc>(
        this.answerProjector.indexName,
        this.answerProjector.searchFields,
        '',
        {
          page: 1,
          limit: 100,
          filters: {
            userId: String(userId),
          },
          sortBy: 'date',
          sortOrder: 'desc',
        }
      );
      // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
      return result.hits.map(
        (doc): IAnswerModel => ({
          _id: doc._id as EntityId,
          content: doc.content,
          user: doc.userId as EntityId,
          userInfo: doc.userInfo,
          question: doc.questionId as EntityId,
          likes: doc.likes.map(id => id as EntityId),
          isAccepted: doc.isAccepted,
          createdAt: doc.createdAt || new Date(),
        })
      );
    } catch (error: any) {
      this.logger.warn(
        'Search failed for answers by user, falling back to MongoDB',
        {
          error: error.message,
        }
      );
    }

    // Fallback to MongoDB
    return await this.answerRepository.findByUser(userId);
  }

  async getAnswersWithPopulatedData(
    questionId: EntityId
  ): Promise<IAnswerModel[]> {
    return await this.answerRepository.findAnswersByQuestionWithPopulate(
      questionId
    );
  }
}
