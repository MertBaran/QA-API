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
    answer.likes.push(userId);
    return this.updateById(answerId, { likes: answer.likes });
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

  async dislikeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel> {
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
      dislikes: answer.dislikes 
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
