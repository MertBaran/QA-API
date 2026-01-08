import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { EntityId } from '../../types/database';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/question/pagination.dto';
import type { CreateQuestionDTO } from '../../types/dto/question/create-question.dto';
import type { UpdateQuestionDTO } from '../../types/dto/question/update-question.dto';

export interface IQuestionService {
  createQuestion(
    questionData: CreateQuestionDTO,
    userId: EntityId
  ): Promise<IQuestionModel>;
  getAllQuestions(): Promise<IQuestionModel[]>;
  getQuestionsPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>>;
  getQuestionsWithParents(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>>;
  getQuestionById(questionId: EntityId): Promise<IQuestionModel>;
  updateQuestion(
    questionId: EntityId,
    updateData: UpdateQuestionDTO
  ): Promise<IQuestionModel>;
  deleteQuestion(questionId: EntityId): Promise<IQuestionModel>;
  likeQuestion(questionId: EntityId, userId: EntityId): Promise<IQuestionModel>;
  undoLikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel>;
  dislikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel>;
  undoDislikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel>;
  getQuestionsByUser(
    userId: EntityId,
    page?: number,
    limit?: number
  ): Promise<PaginatedResponse<IQuestionModel>>;
  getQuestionsByParent(parentId: EntityId): Promise<IQuestionModel[]>;
  searchQuestions(
    searchTerm: string,
    page?: number,
    limit?: number,
    searchMode?: 'phrase' | 'all_words' | 'any_word',
    matchType?: 'fuzzy' | 'exact',
    typoTolerance?: 'low' | 'medium' | 'high',
    smartSearch?: boolean,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    excludeQuestionIds?: string[],
    language?: string
  ): Promise<{
    data: IQuestionModel[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    warnings?: {
      semanticSearchUnavailable?: boolean;
    };
  }>;
}
