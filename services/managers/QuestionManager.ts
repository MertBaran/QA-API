import { injectable, inject } from 'tsyringe';
import { IQuestionRepository } from '../../repositories/interfaces/IQuestionRepository';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { EntityId } from '../../types/database';
import { ICacheProvider } from '../../infrastructure/cache/ICacheProvider';
import { IQuestionService } from '../contracts/IQuestionService';
import { QuestionServiceMessages } from '../constants/ServiceMessages';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/question/pagination.dto';
import { IIndexClient } from '../../infrastructure/search/IIndexClient';
import { ISearchClient } from '../../infrastructure/search/ISearchClient';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { IProjector } from '../../infrastructure/search/IProjector';
import { QuestionSearchDoc } from '../../infrastructure/search/SearchDocument';

@injectable()
export class QuestionManager implements IQuestionService {
  constructor(
    @inject('IQuestionRepository')
    private questionRepository: IQuestionRepository,
    @inject('ICacheProvider') private cacheProvider: ICacheProvider,
    @inject('IIndexClient')
    private indexClient: IIndexClient,
    @inject('ISearchClient')
    private searchClient: ISearchClient,
    @inject('IProjector<IQuestionModel, QuestionSearchDoc>')
    private questionProjector: IProjector<IQuestionModel, QuestionSearchDoc>,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {}

  async createQuestion(
    questionData: any,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.create({
      ...questionData,
      user: userId,
    });
    await this.cacheProvider.del('questions:all');

    // Project entity to SearchDocument and index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'index',
      searchDoc
    );

    return question;
  }

  async getAllQuestions(): Promise<IQuestionModel[]> {
    const cacheKey = 'questions:all';
    const cached = await this.cacheProvider.get<IQuestionModel[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const questions = await this.questionRepository.findAll();
    //tüm soruları redis'te cachlemek çok ağır yük olur.
    //await this.cacheProvider.set<IQuestionModel[]>(cacheKey, questions, 60);
    return questions;
  }

  async getQuestionsPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    // Search client kullan - SearchDocument bazlı
    if (filters.search && filters.search.trim().length > 0) {
      try {
        const searchResult = await this.searchClient.search<QuestionSearchDoc>(
          this.questionProjector.indexName,
          this.questionProjector.searchFields,
          filters.search,
          {
            page: filters.page,
            limit: filters.limit,
            filters: {
              category: filters.category,
              tags: filters.tags
                ? filters.tags.split(',').map(t => t.trim())
                : undefined,
            },
            sortBy:
              filters.sortBy === 'likes' || filters.sortBy === 'answers'
                ? 'popularity'
                : filters.sortBy === 'createdAt'
                  ? 'date'
                  : 'relevance',
            sortOrder: filters.sortOrder as 'asc' | 'desc',
          }
        );

        // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür (MongoDB'ye gitmeden)
        const questions = searchResult.hits.map(
          (doc): IQuestionModel => ({
            _id: doc._id as EntityId,
            title: doc.title,
            content: doc.content,
            slug: doc.slug,
            category: doc.category,
            tags: doc.tags,
            views: doc.views,
            createdAt: doc.createdAt,
            user: doc.user as EntityId,
            userInfo: doc.userInfo,
            likes: doc.likes.map(id => id as EntityId),
            answers: doc.answers.map(id => id as EntityId),
          })
        );

        return {
          data: questions,
          pagination: {
            currentPage: searchResult.page,
            totalPages: searchResult.totalPages,
            totalItems: searchResult.total,
            itemsPerPage: searchResult.limit,
            hasNextPage: searchResult.page < searchResult.totalPages,
            hasPreviousPage: searchResult.page > 1,
          },
        };
      } catch (error: any) {
        this.logger.warn('Search failed, falling back to MongoDB', {
          error: error.message,
        });
      }
    }

    // Fallback to MongoDB for non-search queries or if search fails
    return await this.questionRepository.findPaginated(filters);
  }

  async getQuestionById(questionId: EntityId): Promise<IQuestionModel> {
    const question =
      await this.questionRepository.findByIdWithPopulate(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
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
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
    }
    await this.cacheProvider.del('questions:all');

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

    return question;
  }

  async deleteQuestion(questionId: EntityId): Promise<IQuestionModel> {
    const question = await this.questionRepository.deleteById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
    }
    await this.cacheProvider.del('questions:all');

    // Delete from index
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'delete',
      String(questionId)
    );

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
        throw ApplicationError.notFoundError(
          QuestionServiceMessages.QuestionNotFound.en
        );
      throw ApplicationError.businessError(
        QuestionServiceMessages.NotLikedYet.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

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
        throw ApplicationError.notFoundError(
          QuestionServiceMessages.QuestionNotFound.en
        );
      throw ApplicationError.businessError(
        QuestionServiceMessages.NotLikedYet.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

    return question;
  }

  async getQuestionsByUser(userId: EntityId): Promise<IQuestionModel[]> {
    return await this.questionRepository.findByUser(userId);
  }

  async searchQuestions(searchTerm: string): Promise<IQuestionModel[]> {
    if (searchTerm.trim().length === 0) return [];
    try {
      const result = await this.searchClient.search<QuestionSearchDoc>(
        this.questionProjector.indexName,
        this.questionProjector.searchFields,
        searchTerm
      );
      // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
      return result.hits.map(
        (doc): IQuestionModel => ({
          _id: doc._id as EntityId,
          title: doc.title,
          content: doc.content,
          slug: doc.slug,
          category: doc.category,
          tags: doc.tags,
          views: doc.views,
          createdAt: doc.createdAt,
          user: doc.user as EntityId,
          userInfo: doc.userInfo,
          likes: doc.likes.map(id => id as EntityId),
          answers: doc.answers.map(id => id as EntityId),
        })
      );
    } catch (error: any) {
      this.logger.warn('Search failed, falling back to MongoDB', {
        error: error.message,
      });
    }

    // Fallback to MongoDB
    return await this.questionRepository.searchByTitle(searchTerm);
  }
}
