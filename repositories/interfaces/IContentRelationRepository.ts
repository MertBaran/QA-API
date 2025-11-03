import { IContentRelationModel } from '../../models/interfaces/IContentRelationModel';
import { EntityId } from '../../types/database';
import { ContentType, RelationType } from '../../types/content/RelationType';

export interface IContentRelationRepository {
  findById(id: EntityId): Promise<IContentRelationModel | null>;
  findAll(): Promise<IContentRelationModel[]>;
  create(data: Partial<IContentRelationModel>): Promise<IContentRelationModel>;
  deleteById(id: EntityId): Promise<IContentRelationModel | null>;

  // İlişki sorguları
  findBySource(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<IContentRelationModel[]>;

  findBySources(
    contentType: ContentType,
    contentIds: EntityId[]
  ): Promise<IContentRelationModel[]>;

  findByTarget(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<IContentRelationModel[]>;

  findByRelationType(
    relationType: RelationType
  ): Promise<IContentRelationModel[]>;

  findBySourceAndType(
    contentType: ContentType,
    contentId: EntityId,
    relationType: RelationType
  ): Promise<IContentRelationModel[]>;

  // Toplu işlemler
  deleteBySource(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<number>;
  deleteByTarget(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<number>;
}
