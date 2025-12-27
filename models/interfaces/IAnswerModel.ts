import { EntityId } from '../../types/database';
import { IContent } from '../../types/content/IContent';
import { ContentType } from '../../types/content/RelationType';

export interface IAnswerModel extends IContent {
  // IContent'den gelenler:
  // _id, contentType, content, user, createdAt, updatedAt, userInfo, likes, dislikes, parent, ancestors, relatedContents

  // Answer'a özel alanlar
  question: EntityId;
  questionInfo?: {
    _id: string;
    title?: string;
    slug?: string;
  };
  isAccepted: boolean;

  // IContent'teki contentType için default
  contentType: ContentType.ANSWER;
}
