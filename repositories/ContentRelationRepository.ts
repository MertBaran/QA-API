import { injectable, inject } from 'tsyringe';
import { IContentRelationRepository } from './interfaces/IContentRelationRepository';
import { IContentRelationModel } from '../models/interfaces/IContentRelationModel';
import { IDataSource } from './interfaces/IDataSource';
import { EntityId } from '../types/database';
import { ContentType, RelationType } from '../types/content/RelationType';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import { RepositoryConstants } from './constants/RepositoryMessages';

@injectable()
export class ContentRelationRepository implements IContentRelationRepository {
  constructor(
    @inject('IContentRelationDataSource')
    private dataSource: IDataSource<IContentRelationModel>
  ) {}

  async findById(id: EntityId): Promise<IContentRelationModel | null> {
    try {
      return await this.dataSource.findById(id);
    } catch (error) {
      return null;
    }
  }

  async findAll(): Promise<IContentRelationModel[]> {
    return this.dataSource.findAll();
  }

  async create(
    data: Partial<IContentRelationModel>
  ): Promise<IContentRelationModel> {
    return this.dataSource.create(data);
  }

  async deleteById(id: EntityId): Promise<IContentRelationModel | null> {
    try {
      return await this.dataSource.deleteById(id);
    } catch (error) {
      return null;
    }
  }

  async findBySource(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<IContentRelationModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(
      r =>
        r.sourceContentType === contentType && r.sourceContentId === contentId
    );
  }

  async findBySources(
    contentType: ContentType,
    contentIds: EntityId[]
  ): Promise<IContentRelationModel[]> {
    if (!contentIds.length) {
      return [];
    }
    // Access model directly for $in query
    const ContentRelationMongo =
      require('../models/mongodb/ContentRelationMongoModel').default;
    const mongoose = require('mongoose');

    const uniqueIds = contentIds.map(
      id => new mongoose.Types.ObjectId(id.toString())
    );
    const results = await ContentRelationMongo.find({
      sourceContentType: contentType,
      sourceContentId: { $in: uniqueIds },
    });

    return results.map((doc: any) => ({
      _id: doc._id.toString(),
      sourceContentType: doc.sourceContentType,
      sourceContentId: doc.sourceContentId.toString(),
      targetContentType: doc.targetContentType,
      targetContentId: doc.targetContentId.toString(),
      relationType: doc.relationType,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      createdBy: doc.createdBy?.toString(),
    }));
  }

  async findByTarget(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<IContentRelationModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(
      r =>
        r.targetContentType === contentType && r.targetContentId === contentId
    );
  }

  async findByRelationType(
    relationType: RelationType
  ): Promise<IContentRelationModel[]> {
    const all = await this.dataSource.findAll();
    return all.filter(r => r.relationType === relationType);
  }

  async findBySourceAndType(
    contentType: ContentType,
    contentId: EntityId,
    relationType: RelationType
  ): Promise<IContentRelationModel[]> {
    const all = await this.findAll();
    return all.filter(
      r =>
        r.sourceContentType === contentType &&
        r.sourceContentId === contentId &&
        r.relationType === relationType
    );
  }

  async deleteBySource(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<number> {
    const all = await this.findAll();
    const toDelete = all.filter(
      r =>
        r.sourceContentType === contentType && r.sourceContentId === contentId
    );
    for (const relation of toDelete) {
      await this.deleteById(relation._id);
    }
    return toDelete.length;
  }

  async deleteByTarget(
    contentType: ContentType,
    contentId: EntityId
  ): Promise<number> {
    const all = await this.findAll();
    const toDelete = all.filter(
      r =>
        r.targetContentType === contentType && r.targetContentId === contentId
    );
    for (const relation of toDelete) {
      await this.deleteById(relation._id);
    }
    return toDelete.length;
  }
}
