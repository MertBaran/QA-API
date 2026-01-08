import { injectable, inject } from 'tsyringe';
import { IQuestionModel } from '../models/interfaces/IQuestionModel';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { IQuestionRepository } from './interfaces/IQuestionRepository';
import { IDataSource } from './interfaces/IDataSource';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../types/dto/question/pagination.dto';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import { RepositoryConstants } from './constants/RepositoryMessages';

@injectable()
export class QuestionRepository
  extends BaseRepository<IQuestionModel>
  implements IQuestionRepository
{
  constructor(
    @inject('IQuestionDataSource') dataSource: IDataSource<IQuestionModel>
  ) {
    super(dataSource);
  }

  async findByIdWithPopulate(id: string): Promise<IQuestionModel> {
    // IDataSource'a özel metot yoksa, findById ile döner
    return this.findById(id);
  }

  override async findAll(): Promise<IQuestionModel[]> {
    return this.dataSource.findAll();
  }

  async findByUser(userId: EntityId): Promise<IQuestionModel[]> {
    const all = await this.dataSource.findAll();
    const filtered = all.filter(q => q.user === userId);
    // Sort by createdAt descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  async findByIds(ids: EntityId[]): Promise<IQuestionModel[]> {
    if (!ids.length) {
      return [];
    }
    const uniqueIds = Array.from(new Set(ids.map(id => id.toString())));
    return this.dataSource.findByFields({
      _id: { $in: uniqueIds },
    } as unknown as Partial<IQuestionModel>);
  }

  async findBySlug(slug: string): Promise<IQuestionModel> {
    const all = await this.dataSource.findAll();
    const question = all.find(q => q.slug === slug);
    if (!question) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return question;
  }

  async likeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.findById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (question.likes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.ALREADY_LIKED_ERROR.en,
        400
      );
    }
    question.likes.push(userId);
    return this.updateById(questionId, { likes: question.likes });
  }

  async unlikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.findById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (!question.likes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.NOT_LIKED_ERROR.en,
        400
      );
    }
    question.likes = question.likes.filter(like => like !== userId);
    return this.updateById(questionId, { likes: question.likes });
  }

  async dislikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.findById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (question.dislikes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.ALREADY_LIKED_ERROR.en,
        400
      );
    }
    // Remove from likes if exists
    if (question.likes.includes(userId)) {
      question.likes = question.likes.filter(like => like !== userId);
    }
    question.dislikes.push(userId);
    return this.updateById(questionId, {
      likes: question.likes,
      dislikes: question.dislikes,
    });
  }

  async undoDislikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.findById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (!question.dislikes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.NOT_LIKED_ERROR.en,
        400
      );
    }
    question.dislikes = question.dislikes.filter(dislike => dislike !== userId);
    return this.updateById(questionId, { dislikes: question.dislikes });
  }

  async searchByTitle(title: string): Promise<IQuestionModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(q => q.title.toLowerCase().includes(title.toLowerCase()));
  }

  async findByParent(parentId: EntityId): Promise<IQuestionModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(q => q.parent?.id === parentId);
  }

  async findPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    // DataSource'da pagination metodu varsa onu kullan, yoksa fallback
    if ('findPaginated' in this.dataSource) {
      return (this.dataSource as any).findPaginated(filters);
    }

    // Fallback: Tüm verileri çek ve frontend'de pagination yap
    const allQuestions = await this.dataSource.findAll();

    // Apply filters
    let filtered = [...allQuestions];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        q =>
          q.title.toLowerCase().includes(searchLower) ||
          q.content.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(q => q.category === filters.category);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'likes':
          aValue = a.likes.length;
          bValue = b.likes.length;
          break;
        case 'answers':
          aValue = a.answers.length;
          bValue = b.answers.length;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const data = filtered.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        currentPage: filters.page,
        totalPages,
        totalItems,
        itemsPerPage: filters.limit,
        hasNextPage: filters.page < totalPages,
        hasPreviousPage: filters.page > 1,
      },
    };
  }
}
