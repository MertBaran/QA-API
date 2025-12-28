import { IQuestionRepository } from '../../../repositories/interfaces/IQuestionRepository';
import { IQuestionModel } from '../../../models/interfaces/IQuestionModel';
import { EntityId } from '../../../types/database';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../../types/dto/question/pagination.dto';

export class FakeQuestionRepository implements IQuestionRepository {
  private questions: IQuestionModel[] = [];

  async findById(id: EntityId): Promise<IQuestionModel | null> {
    return this.questions.find(q => q._id === id) || null;
  }

  async findByIdWithPopulate(id: EntityId): Promise<IQuestionModel | null> {
    return this.questions.find(q => q._id === id) || null;
  }

  async findByIds(ids: EntityId[]): Promise<IQuestionModel[]> {
    return this.questions.filter(q => ids.includes(q._id));
  }

  async findAll(): Promise<IQuestionModel[]> {
    return [...this.questions];
  }

  async findByUser(userId: EntityId): Promise<IQuestionModel[]> {
    return this.questions.filter(q => q.user === userId);
  }

  async findBySlug(slug: string): Promise<IQuestionModel | null> {
    return this.questions.find(q => q.slug === slug) || null;
  }

  async create(data: Partial<IQuestionModel>): Promise<IQuestionModel> {
    const question: IQuestionModel = {
      _id: `question_${Date.now()}`,
      title: data.title || 'Test Question',
      content: data.content || 'Test content',
      slug: data.slug || `test-question-${Date.now()}`,
      category: data.category || 'general',
      tags: data.tags || [],
      createdAt: new Date(),
      user: data.user || 'user_1',
      likes: data.likes || [],
      answers: data.answers || [],
      ...data,
    } as IQuestionModel;

    this.questions.push(question);
    return question;
  }

  async updateById(
    id: EntityId,
    data: Partial<IQuestionModel>
  ): Promise<IQuestionModel | null> {
    const index = this.questions.findIndex(q => q._id === id);
    if (index === -1) return null;

    this.questions[index] = {
      ...this.questions[index],
      ...data,
    } as IQuestionModel;
    return this.questions[index];
  }

  async deleteById(id: EntityId): Promise<IQuestionModel | null> {
    const index = this.questions.findIndex(q => q._id === id);
    if (index === -1) return null;

    const deletedQuestion = this.questions[index]!;
    this.questions.splice(index, 1);
    return deletedQuestion;
  }

  async searchByTitle(title: string): Promise<IQuestionModel[]> {
    return this.questions.filter(q =>
      q.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  async getPaginatedQuestions(
    query: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    let filteredQuestions = [...this.questions];

    if (search) {
      filteredQuestions = filteredQuestions.filter(
        q =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.content.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      filteredQuestions = filteredQuestions.filter(
        q => q.category === category
      );
    }

    // Sort
    filteredQuestions.sort((a, b) => {
      const aValue = a[sortBy as keyof IQuestionModel];
      const bValue = b[sortBy as keyof IQuestionModel];

      if (sortOrder === 'desc') {
        return (bValue as any) > (aValue as any) ? 1 : -1;
      }
      return (aValue as any) > (bValue as any) ? 1 : -1;
    });

    const total = filteredQuestions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const questions = filteredQuestions.slice(startIndex, endIndex);

    return {
      data: questions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: endIndex < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async countAll(): Promise<number> {
    return this.questions.length;
  }

  async findByField(
    field: keyof IQuestionModel,
    value: any
  ): Promise<IQuestionModel[]> {
    return this.questions.filter(q => q[field] === value);
  }

  async findByFields(
    fields: Partial<IQuestionModel>
  ): Promise<IQuestionModel[]> {
    return this.questions.filter(question =>
      Object.entries(fields).every(
        ([key, value]) => question[key as keyof IQuestionModel] === value
      )
    );
  }

  async likeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel | null> {
    const question = this.questions.find(q => q._id === questionId);
    if (!question) return null;

    if (!question.likes.includes(userId)) {
      question.likes.push(userId);
    }
    return question;
  }

  async unlikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel | null> {
    const question = this.questions.find(q => q._id === questionId);
    if (!question) return null;

    question.likes = question.likes.filter(id => id !== userId);
    return question;
  }

  async findPaginated(filters: {
    page: number;
    limit: number;
    sortBy: 'createdAt' | 'likes' | 'answers' | 'views';
    sortOrder: 'asc' | 'desc';
    search?: string;
    category?: string;
    tags?: string;
  }): Promise<PaginatedResponse<IQuestionModel>> {
    const total = this.questions.length;
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const questions = this.questions.slice(startIndex, endIndex);

    return {
      data: questions,
      pagination: {
        currentPage: filters.page,
        totalPages: Math.ceil(total / filters.limit),
        totalItems: total,
        itemsPerPage: filters.limit,
        hasNextPage: endIndex < total,
        hasPreviousPage: filters.page > 1,
      },
    };
  }
}
