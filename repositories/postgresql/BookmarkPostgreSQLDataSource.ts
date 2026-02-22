import { injectable } from 'tsyringe';
import { Prisma, type BookmarkTargetType } from '.prisma/client';
import { IBookmarkModel } from '../../models/interfaces/IBookmarkModel';
import { IDataSource } from '../interfaces/IDataSource';
import { getPrismaClient } from './PrismaClientSingleton';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

type PrismaWhereValue = string | number | boolean | string[] | Date;

@injectable()
export class BookmarkPostgreSQLDataSource implements IDataSource<IBookmarkModel> {
  private get prisma() {
    return getPrismaClient();
  }

  private toEntity(row: {
    id: string;
    userId: string;
    targetType: string;
    targetId: string;
    targetTitle: string;
    targetContent: string;
    targetAuthor: string | null;
    targetAuthorId: string | null;
    targetCreatedAt: Date;
    targetUrl: string | null;
    tags: string[];
    notes: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): IBookmarkModel {
    return {
      _id: row.id,
      user_id: row.userId,
      target_type: row.targetType as IBookmarkModel['target_type'],
      target_id: row.targetId,
      target_data: {
        title: row.targetTitle,
        content: row.targetContent,
        author: row.targetAuthor ?? undefined,
        authorId: row.targetAuthorId ?? undefined,
        created_at: row.targetCreatedAt.toISOString(),
        url: row.targetUrl ?? undefined,
      },
      tags: row.tags,
      notes: row.notes ?? undefined,
      is_public: row.isPublic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(data: Partial<IBookmarkModel>): Promise<IBookmarkModel> {
    const { _id, target_data, user_id, target_type, target_id, is_public, ...rest } = data;
    const created = await this.prisma.bookmark.create({
      data: {
        userId: user_id!,
        targetType: target_type!,
        targetId: target_id!,
        targetTitle: target_data?.title ?? '',
        targetContent: target_data?.content ?? '',
        targetAuthor: target_data?.author ?? null,
        targetAuthorId: target_data?.authorId ?? null,
        targetCreatedAt: target_data?.created_at
          ? new Date(target_data.created_at)
          : new Date(),
        targetUrl: target_data?.url ?? null,
        tags: rest.tags ?? [],
        notes: rest.notes ?? null,
        isPublic: is_public ?? false,
      },
    });
    return this.toEntity(created);
  }

  async findById(id: string): Promise<IBookmarkModel> {
    const row = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(row);
  }

  async findAll(): Promise<IBookmarkModel[]> {
    const rows = await this.prisma.bookmark.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async updateById(id: string, data: Partial<IBookmarkModel>): Promise<IBookmarkModel> {
    const { _id, target_data, user_id, target_type, target_id, is_public, ...rest } = data;
    const updateData: Prisma.BookmarkUncheckedUpdateInput = {};
    if (user_id != null) updateData.userId = user_id;
    if (target_type != null) updateData.targetType = target_type;
    if (target_id != null) updateData.targetId = target_id;
    if (is_public != null) updateData.isPublic = is_public;
    if (rest.tags != null) updateData.tags = rest.tags;
    if (rest.notes != null) updateData.notes = rest.notes;
    if (target_data != null) {
      updateData.targetTitle = target_data.title;
      updateData.targetContent = target_data.content;
      updateData.targetAuthor = target_data.author ?? null;
      updateData.targetAuthorId = target_data.authorId ?? null;
      updateData.targetCreatedAt = target_data.created_at ? new Date(target_data.created_at) : undefined;
      updateData.targetUrl = target_data.url ?? null;
    }
    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }
    const updated = await this.prisma.bookmark.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(updated);
  }

  async deleteById(id: string): Promise<IBookmarkModel> {
    const row = await this.findById(id);
    await this.prisma.bookmark.delete({ where: { id } });
    return row;
  }

  async findByField(field: keyof IBookmarkModel, value: PrismaWhereValue): Promise<IBookmarkModel[]> {
    const where: Prisma.BookmarkWhereInput = {};
    if (field === '_id') where.id = String(value);
    else if (field === 'user_id') where.userId = String(value);
    else if (field === 'target_type') where.targetType = value as BookmarkTargetType;
    else if (field === 'target_id') where.targetId = String(value);
    else if (field === 'is_public') where.isPublic = Boolean(value);
    const rows = await this.prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findByFields(fields: Partial<IBookmarkModel>): Promise<IBookmarkModel[]> {
    const where: Prisma.BookmarkWhereInput = {};
    if (fields._id != null) where.id = String(fields._id);
    if (fields.user_id != null) where.userId = String(fields.user_id);
    if (fields.target_type != null) where.targetType = fields.target_type;
    if (fields.target_id != null) where.targetId = String(fields.target_id);
    const rows = await this.prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async countAll(): Promise<number> {
    return this.prisma.bookmark.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.bookmark.deleteMany({});
    return result.count;
  }
}
