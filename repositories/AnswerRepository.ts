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
