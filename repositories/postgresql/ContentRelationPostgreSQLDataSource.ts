import { injectable } from 'tsyringe';
import { Prisma, type ContentType as PrismaContentType, type ContentRelationType as PrismaContentRelationType } from '.prisma/client';
import { IContentRelationDataSource } from '../interfaces/IContentRelationDataSource';
import { IContentRelationModel } from '../../models/interfaces/IContentRelationModel';
import { IDataSource } from '../interfaces/IDataSource';
import { getPrismaClient } from './PrismaClientSingleton';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import { ContentType } from '../../types/content/RelationType';
import type { RelationType } from '../../types/content/RelationType';

type ContentRelationRow = {
  id: string;
  sourceContentType: string;
  sourceContentId: string;
  targetContentType: string;
  targetContentId: string;
  relationType: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  createdById: string | null;
};

@injectable()
export class ContentRelationPostgreSQLDataSource
  implements IContentRelationDataSource
{
  private get prisma() {
    return getPrismaClient();
  }

  private toEntity(row: ContentRelationRow): IContentRelationModel {
    const metadata = row.metadata as IContentRelationModel['metadata'];
    return {
      _id: row.id,
      sourceContentType: row.sourceContentType as ContentType,
      sourceContentId: row.sourceContentId,
      targetContentType: row.targetContentType as ContentType,
      targetContentId: row.targetContentId,
      relationType: row.relationType as RelationType,
      metadata: metadata ?? undefined,
      createdAt: row.createdAt,
      createdBy: row.createdById ?? undefined,
    };
  }

  async create(data: Partial<IContentRelationModel>): Promise<IContentRelationModel> {
    const { _id, createdBy, ...rest } = data;
    const created = await this.prisma.contentRelation.create({
      data: {
        sourceContentType: rest.sourceContentType!,
        sourceContentId: rest.sourceContentId!,
        targetContentType: rest.targetContentType!,
        targetContentId: rest.targetContentId!,
        relationType: rest.relationType! as PrismaContentRelationType,
        metadata: rest.metadata !== undefined ? (rest.metadata ?? Prisma.JsonNull) : undefined,
        createdById: createdBy ?? null,
      },
    });
    return this.toEntity(created);
  }

  async findById(id: string): Promise<IContentRelationModel> {
    const row = await this.prisma.contentRelation.findUnique({
      where: { id },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(row);
  }

  async findAll(): Promise<IContentRelationModel[]> {
    const rows = await this.prisma.contentRelation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async updateById(id: string, data: Partial<IContentRelationModel>): Promise<IContentRelationModel> {
    const { _id, createdBy, ...rest } = data;
    const updateData: Prisma.ContentRelationUncheckedUpdateInput = {
      ...(rest.sourceContentType != null && { sourceContentType: rest.sourceContentType }),
      ...(rest.sourceContentId != null && { sourceContentId: rest.sourceContentId }),
      ...(rest.targetContentType != null && { targetContentType: rest.targetContentType }),
      ...(rest.targetContentId != null && { targetContentId: rest.targetContentId }),
      ...(rest.relationType != null && { relationType: rest.relationType as PrismaContentRelationType }),
      ...(rest.metadata !== undefined && { metadata: rest.metadata ?? Prisma.JsonNull }),
      ...(createdBy !== undefined && { createdById: createdBy ?? null }),
    };
    const updated = await this.prisma.contentRelation.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(updated);
  }

  async deleteById(id: string): Promise<IContentRelationModel> {
    const row = await this.findById(id);
    await this.prisma.contentRelation.delete({ where: { id } });
    return row;
  }

  async findByField(field: keyof IContentRelationModel, value: string | number | boolean): Promise<IContentRelationModel[]> {
    const where: Prisma.ContentRelationWhereInput = {};
    if (field === '_id') where.id = String(value);
    else if (field === 'sourceContentType') where.sourceContentType = value as PrismaContentType;
    else if (field === 'sourceContentId') where.sourceContentId = String(value);
    else if (field === 'targetContentType') where.targetContentType = value as PrismaContentType;
    else if (field === 'targetContentId') where.targetContentId = String(value);
    else if (field === 'relationType') where.relationType = value as PrismaContentRelationType;
    else if (field === 'createdBy') where.createdById = String(value);
    const rows = await this.prisma.contentRelation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findByFields(fields: Partial<IContentRelationModel>): Promise<IContentRelationModel[]> {
    const where: Prisma.ContentRelationWhereInput = {};
    if (fields._id != null) where.id = String(fields._id);
    if (fields.sourceContentType != null) where.sourceContentType = fields.sourceContentType;
    if (fields.sourceContentId != null) where.sourceContentId = String(fields.sourceContentId);
    if (fields.targetContentType != null) where.targetContentType = fields.targetContentType;
    if (fields.targetContentId != null) where.targetContentId = String(fields.targetContentId);
    if (fields.relationType != null) where.relationType = fields.relationType;
    if (fields.createdBy != null) where.createdById = String(fields.createdBy);
    const rows = await this.prisma.contentRelation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findBySourceIds(
    contentType: ContentType,
    contentIds: string[]
  ): Promise<IContentRelationModel[]> {
    if (contentIds.length === 0) return [];
    const rows = await this.prisma.contentRelation.findMany({
      where: {
        sourceContentType: contentType,
        sourceContentId: { in: contentIds.map(String) },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async countAll(): Promise<number> {
    return this.prisma.contentRelation.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.contentRelation.deleteMany({});
    return result.count;
  }
}
