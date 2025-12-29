import { EntityId } from '../../types/database';
import { IContent } from '../../types/content/IContent';
import { ContentType } from '../../types/content/RelationType';

export interface QuestionThumbnail {
  key: string;
  url?: string;
}

export interface IQuestionModel extends IContent {
  // IContent'den gelenler:
  // _id, contentType, content, user, createdAt, updatedAt, userInfo, likes, dislikes, parent, ancestors, relatedContents

  // Question'a özel alanlar
  title: string;
  slug: string;
  category?: string;
  tags?: string[];
  answers: EntityId[];
  thumbnail?: QuestionThumbnail | null;

  // IContent'teki contentType için default
  contentType: ContentType.QUESTION;
}
