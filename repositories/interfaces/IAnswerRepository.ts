import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { EntityId } from '../../types/database';

export interface IAnswerRepository {
  findById(id: EntityId): Promise<IAnswerModel | null>;
  findByIdWithPopulate(id: EntityId): Promise<IAnswerModel | null>;
  findByQuestion(questionId: EntityId): Promise<IAnswerModel[]>;
  findByUser(userId: EntityId): Promise<IAnswerModel[]>;
  create(data: Partial<IAnswerModel>): Promise<IAnswerModel>;
  updateById(id: EntityId, data: Partial<IAnswerModel>): Promise<IAnswerModel | null>;
  deleteById(id: EntityId): Promise<IAnswerModel | null>;
  likeAnswer(answerId: EntityId, userId: EntityId): Promise<IAnswerModel | null>;
  unlikeAnswer(answerId: EntityId, userId: EntityId): Promise<IAnswerModel | null>;
  findAnswersByQuestionWithPopulate(questionId: EntityId): Promise<IAnswerModel[]>;
  findByQuestionAndId(answerId: EntityId, questionId: EntityId): Promise<IAnswerModel | null>;
} 