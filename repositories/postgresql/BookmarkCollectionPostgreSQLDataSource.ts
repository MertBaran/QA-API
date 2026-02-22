import { injectable } from 'tsyringe';
import { Prisma } from '.prisma/client';
import { IBookmarkCollectionModel } from '../../models/interfaces/IBookmarkModel';
import { IBookmarkCollectionDataSource } from '../interfaces/IBookmarkCollectionDataSource';
import { getPrismaClient } from './PrismaClientSingleton';
import { EntityId } from '../../types/database';

@injectable()
export class BookmarkCollectionPostgreSQLDataSource
  implements IBookmarkCollectionDataSource
{
  private get prisma() {
    return getPrismaClient();
  }

  private toModel(row: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    color: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): IBookmarkCollectionModel {
    return {
      _id: row.id,
      user_id: row.userId,
      name: row.name,
      description: row.description ?? undefined,
      color: row.color ?? undefined,
      is_public: row.isPublic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(
    data: Omit<IBookmarkCollectionModel, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<IBookmarkCollectionModel> {
    const created = await this.prisma.bookmarkCollection.create({
      data: {
        userId: data.user_id,
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        isPublic: data.is_public ?? false,
      },
    });
    return this.toModel(created);
  }

  async findById(id: EntityId): Promise<IBookmarkCollectionModel | null> {
    const row = await this.prisma.bookmarkCollection.findUnique({
      where: { id: String(id) },
    });
    return row ? this.toModel(row) : null;
  }

  async findByUserId(userId: EntityId): Promise<IBookmarkCollectionModel[]> {
    const rows = await this.prisma.bookmarkCollection.findMany({
      where: { userId: String(userId) },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.toModel(r));
  }

  async updateById(
    id: EntityId,
    data: Partial<IBookmarkCollectionModel>
  ): Promise<IBookmarkCollectionModel | null> {
    const updateData: Prisma.BookmarkCollectionUncheckedUpdateInput = {};
    if (data.user_id != null) updateData.userId = data.user_id;
    if (data.name != null) updateData.name = data.name;
    if (data.description != null) updateData.description = data.description;
    if (data.color != null) updateData.color = data.color;
    if (data.is_public != null) updateData.isPublic = data.is_public;
    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }
    try {
      const updated = await this.prisma.bookmarkCollection.update({
        where: { id: String(id) },
        data: updateData,
      });
      return this.toModel(updated);
    } catch {
      return null;
    }
  }

  async deleteById(id: EntityId): Promise<boolean> {
    try {
      await this.prisma.bookmarkCollection.delete({
        where: { id: String(id) },
      });
      return true;
    } catch {
      return false;
    }
  }
}
