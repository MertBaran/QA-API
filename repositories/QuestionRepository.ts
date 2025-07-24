import { injectable, inject } from 'tsyringe';
import { IQuestionModel } from '../models/interfaces/IQuestionModel';
import { EntityId } from '../types/database';
import { BaseRepository } from './base/BaseRepository';
import { IQuestionRepository } from './interfaces/IQuestionRepository';
import { IDataSource } from './interfaces/IDataSource';

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
}
