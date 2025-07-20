import { injectable, inject } from 'tsyringe';
import { IAnswerModel } from '../models/interfaces/IAnswerModel';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { IAnswerRepository } from './interfaces/IAnswerRepository';
import { IDataSource } from './interfaces/IDataSource';

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
    const all = await this.dataSource.findAll();
    return all.filter(a => a.user === userId);
  }

  async likeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel | null> {
    const answer = await this.findById(answerId);
    if (!answer) return null;
    if (answer.likes.includes(userId)) {
      // Already liked, return null to indicate error
      return null;
    }
    answer.likes.push(userId);
    return this.updateById(answerId, { likes: answer.likes });
  }

  async unlikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel | null> {
    const answer = await this.findById(answerId);
    if (!answer) return null;
    if (!answer.likes.includes(userId)) {
      // Not liked, return null to indicate error
      return null;
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
