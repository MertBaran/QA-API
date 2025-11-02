import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { EntityId } from '../../types/database';
import { IRepository } from './IRepository';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/question/pagination.dto';

export interface IQuestionRepository extends IRepository<IQuestionModel> {
  findByUser(userId: EntityId): Promise<IQuestionModel[]>;
  findBySlug(slug: string): Promise<IQuestionModel>;
  likeQuestion(questionId: EntityId, userId: EntityId): Promise<IQuestionModel>;
  unlikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel>;
  dislikeQuestion(questionId: EntityId, userId: EntityId): Promise<IQuestionModel>;
  undoDislikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel>;
  searchByTitle(title: string): Promise<IQuestionModel[]>;
  findByIdWithPopulate(id: EntityId): Promise<IQuestionModel>;
  findByIds(ids: EntityId[]): Promise<IQuestionModel[]>;
  findByParent(parentId: EntityId): Promise<IQuestionModel[]>;
  findPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>>;
}
