import { injectable, inject } from 'tsyringe';
import { IAnswerModel } from '../models/interfaces/IAnswerModel';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { IAnswerRepository } from './interfaces/IAnswerRepository';
import { IDataSource } from './interfaces/IDataSource';
import { RepositoryConstants } from './constants/RepositoryMessages';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
@injectable()
export class AnswerRepository
  extends BaseRepository<IAnswerModel>
  implements IAnswerRepository
{
  constructor(
    @inject('IAnswerDataSource') dataSource: IDataSource<IAnswerModel>
  ) {
    super(dataSource);
  }

  async findByIdWithPopulate(id: string): Promise<IAnswerModel | null> {
    return this.dataSource.findById(id);
  }

  async findByIds(ids: EntityId[]): Promise<IAnswerModel[]> {
    if (!ids.length) {
      return [];
    }
    const uniqueIds = Array.from(new Set(ids.map(id => id.toString())));
    return this.dataSource.findByFields({
      _id: { $in: uniqueIds },
    } as unknown as Partial<IAnswerModel>);
  }

  async findByQuestion(questionId: EntityId): Promise<IAnswerModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(a => a.question === questionId);
  }

  async findByQuestionPaginated(
    questionId: EntityId,
    page: number = 1,
    limit: number = 10
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
  }> {
    const all = await this.dataSource.findAll();
    const filtered = all.filter(a => a.question === questionId);
    
    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = filtered.slice(startIndex, endIndex);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findAnswerPageNumber(
    questionId: EntityId,
    answerId: EntityId,
    limit: number = 10
  ): Promise<number | null> {
    const all = await this.dataSource.findAll();
    const filtered = all.filter(a => a.question === questionId);
    
    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    
    const answerIndex = filtered.findIndex(a => a._id === answerId);
    if (answerIndex === -1) {
      return null;
    }
    
    // Calculate which page this answer is on (1-indexed)
    return Math.floor(answerIndex / limit) + 1;
  }

  async findByUser(userId: EntityId): Promise<IAnswerModel[]> {
    return await this.dataSource.findByField('user', userId);
  }

  async likeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel> {
    const answer = await this.findById(answerId);
    if (!answer) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (answer.likes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.ALREADY_LIKED_ERROR.en,
        400
      );
    }
    // Remove from dislikes if exists
    if (answer.dislikes.includes(userId)) {
      answer.dislikes = answer.dislikes.filter(dislike => dislike !== userId);
    }
    answer.likes.push(userId);
    return this.updateById(answerId, {
      likes: answer.likes,
      dislikes: answer.dislikes,
    });
  }

  async unlikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel> {
    const answer = await this.findById(answerId);
    if (!answer) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (!answer.likes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.NOT_LIKED_ERROR.en,
        400
      );
    }
    answer.likes = answer.likes.filter(like => like !== userId);
    return this.updateById(answerId, { likes: answer.likes });
  }

  async dislikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel> {
    const answer = await this.findById(answerId);
    if (!answer) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (answer.dislikes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.ALREADY_LIKED_ERROR.en,
        400
      );
    }
    // Remove from likes if exists
    if (answer.likes.includes(userId)) {
      answer.likes = answer.likes.filter(like => like !== userId);
    }
    answer.dislikes.push(userId);
    return this.updateById(answerId, {
      likes: answer.likes,
      dislikes: answer.dislikes,
    });
  }

  async undoDislikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel> {
    const answer = await this.findById(answerId);
    if (!answer) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    if (!answer.dislikes.includes(userId)) {
      throw ApplicationError.businessError(
        RepositoryConstants.ANSWER.NOT_LIKED_ERROR.en,
        400
      );
    }
    answer.dislikes = answer.dislikes.filter(dislike => dislike !== userId);
    return this.updateById(answerId, { dislikes: answer.dislikes });
  }

  async findAnswersByQuestionWithPopulate(
    questionId: EntityId
  ): Promise<IAnswerModel[]> {
    return this.findByQuestion(questionId);
  }

  async findByQuestionAndId(
    answerId: EntityId,
    questionId: EntityId
  ): Promise<IAnswerModel | null> {
    const all = await this.dataSource.findAll();
    return (
      all.find(a => a._id === answerId && a.question === questionId) || null
    );
  }
}
