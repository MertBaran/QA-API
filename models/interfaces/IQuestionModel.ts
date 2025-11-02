import { EntityId } from '../../types/database';
import { IContentForm } from '../../types/content/IContentForm';
import { ContentType } from '../../types/content/RelationType';

export interface IQuestionModel extends IContentForm {
  // IContentForm'dan gelenler:
  // _id, contentType, content, user, createdAt, updatedAt, userInfo, likes, dislikes, parentFormId, relatedForms

  // Question'a özel alanlar
  title: string;
  slug: string;
  category?: string;
  tags?: string[];
  views?: number;
  answers: EntityId[];

  // IContentForm'daki contentType için default
  contentType: ContentType.QUESTION;
}
