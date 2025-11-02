import { EntityId } from '../../types/database';
import { IContentForm } from '../../types/content/IContentForm';
import { ContentType } from '../../types/content/RelationType';

export interface IAnswerModel extends IContentForm {
  // IContentForm'dan gelenler:
  // _id, contentType, content, user, createdAt, updatedAt, userInfo, likes, dislikes, parentFormId, relatedForms

  // Answer'a özel alanlar
  question: EntityId;
  questionInfo?: {
    _id: string;
    title?: string;
    slug?: string;
  };
  isAccepted: boolean;

  // IContentForm'daki contentType için default
  contentType: ContentType.ANSWER;
}
