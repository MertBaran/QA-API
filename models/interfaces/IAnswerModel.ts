import { EntityId } from '../../types/database';

export interface IAnswerModel {
  _id: EntityId;
  content: string;
  user: EntityId;
  question: EntityId;
  likes: EntityId[];
  createdAt?: Date;
} 