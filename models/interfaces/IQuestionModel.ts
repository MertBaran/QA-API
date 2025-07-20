import { EntityId } from '../../types/database';

export interface IQuestionModel {
  _id: EntityId;
  title: string;
  content: string;
  slug: string;
  createdAt: Date;
  user: EntityId;
  likes: EntityId[];
  answers: EntityId[];
}
