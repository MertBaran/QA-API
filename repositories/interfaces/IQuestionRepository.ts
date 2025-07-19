import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { EntityId } from '../../types/database';
import { IRepository } from './IRepository';

export interface IQuestionRepository extends IRepository<IQuestionModel> {
  findByUser(userId: EntityId): Promise<IQuestionModel[]>;
  findBySlug(slug: string): Promise<IQuestionModel | null>;
  likeQuestion(questionId: EntityId, userId: EntityId): Promise<IQuestionModel | null>;
  unlikeQuestion(questionId: EntityId, userId: EntityId): Promise<IQuestionModel | null>;
  searchByTitle(title: string): Promise<IQuestionModel[]>;
  findByIdWithPopulate(id: EntityId): Promise<IQuestionModel | null>;
} 