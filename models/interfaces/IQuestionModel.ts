import { EntityId } from '../../types/database';

export interface IQuestionModel {
  _id: EntityId;
  title: string;
  content: string;
  slug: string;
  category?: string;
  tags?: string[];
  views?: number;
  createdAt: Date;
  user: EntityId;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  likes: EntityId[];
  answers: EntityId[];
}
