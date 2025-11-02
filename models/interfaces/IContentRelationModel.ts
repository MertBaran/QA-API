import { EntityId } from '../../types/database';
import { RelationType, ContentType } from '../../types/content/RelationType';

/**
 * İçerik ilişkileri modeli
 * İki içerik arasındaki ilişkiyi tanımlar
 */
export interface IContentRelationModel {
  _id: EntityId;
  sourceContentType: ContentType;
  sourceContentId: EntityId;
  targetContentType: ContentType;
  targetContentId: EntityId;
  relationType: RelationType;
  metadata?: {
    weight?: number;
    description?: string;
  };
  createdAt: Date;
  createdBy?: EntityId;
}

