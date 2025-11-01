import { EntityId } from '../../types/database';

export interface IAnswerModel {
  _id: EntityId;
  content: string;
  user: EntityId;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  question: EntityId;
  questionInfo?: {
    _id: string;
    title?: string;
    slug?: string;
  };
  likes: EntityId[];
  isAccepted: boolean;
  createdAt?: Date;
}
