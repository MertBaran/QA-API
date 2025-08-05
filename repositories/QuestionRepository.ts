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

  async findByIdWithPopulate(id: string): Promise<IQuestionModel | null> {
    // IDataSource'a özel metot yoksa, findById ile döner
    return this.findById(id);
  }

  override async findAll(): Promise<IQuestionModel[]> {
    return this.dataSource.findAll();
  }

  async findByUser(userId: EntityId): Promise<IQuestionModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(q => q.user === userId);
  }

  async findBySlug(slug: string): Promise<IQuestionModel | null> {
    const all = await this.dataSource.findAll();
    return all.find(q => q.slug === slug) || null;
  }

  async likeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel | null> {
    const question = await this.findById(questionId);
    if (!question) return null;
    if (question.likes.includes(userId)) {
      // Already liked, return null to indicate error
      return null;
    }
    question.likes.push(userId);
    return this.updateById(questionId, { likes: question.likes });
  }

  async unlikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel | null> {
    const question = await this.findById(questionId);
    if (!question) return null;
    if (!question.likes.includes(userId)) {
      // Not liked, return null to indicate error
      return null;
    }
    question.likes = question.likes.filter(like => like !== userId);
    return this.updateById(questionId, { likes: question.likes });
  }

  async searchByTitle(title: string): Promise<IQuestionModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(q => q.title.toLowerCase().includes(title.toLowerCase()));
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
        case 'views':
          aValue = a.views || 0;
          bValue = b.views || 0;
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
