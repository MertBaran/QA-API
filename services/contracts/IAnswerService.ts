import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { EntityId } from '../../types/database';

export interface IAnswerService {
  createAnswer(
    answerData: any,
    questionId: EntityId,
    userId: EntityId
  ): Promise<IAnswerModel>;
  getAnswersByQuestion(questionId: EntityId): Promise<IAnswerModel[]>;
  getAnswerById(answerId: string): Promise<IAnswerModel>;
  updateAnswer(answerId: string, content: string): Promise<IAnswerModel>;
  deleteAnswer(answerId: string, questionId: string): Promise<void>;
  likeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel>;
  undoLikeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel>;
  dislikeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel>;
  undoDislikeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel>;
  getAnswersByUser(userId: EntityId): Promise<IAnswerModel[]>;
  getAnswersWithPopulatedData(questionId: EntityId): Promise<IAnswerModel[]>;
  searchAnswers(
    searchTerm: string,
    page?: number,
    limit?: number,
    searchMode?: 'phrase' | 'all_words' | 'any_word',
    matchType?: 'fuzzy' | 'exact',
    typoTolerance?: 'low' | 'medium' | 'high',
    smartSearch?: boolean,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    language?: string
  ): Promise<{
    data: IAnswerModel[];
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
