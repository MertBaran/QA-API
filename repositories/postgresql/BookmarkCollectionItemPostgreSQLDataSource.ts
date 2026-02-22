import { injectable } from 'tsyringe';
import { IBookmarkCollectionItemModel } from '../../models/interfaces/IBookmarkModel';
import { IBookmarkCollectionItemDataSource } from '../interfaces/IBookmarkCollectionItemDataSource';
import { getPrismaClient } from './PrismaClientSingleton';
import { EntityId } from '../../types/database';

@injectable()
export class BookmarkCollectionItemPostgreSQLDataSource
  implements IBookmarkCollectionItemDataSource
{
  private get prisma() {
    return getPrismaClient();
  }

  private toModel(row: {
    id: string;
    bookmarkId: string;
    collectionId: string;
    addedAt: Date;
  }): IBookmarkCollectionItemModel {
    return {
      _id: row.id,
      bookmark_id: row.bookmarkId,
      collection_id: row.collectionId,
      added_at: row.addedAt,
    };
  }

  async add(
    bookmarkId: EntityId,
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel> {
    const created = await this.prisma.bookmarkCollectionItem.upsert({
      where: {
        bookmarkId_collectionId: {
          bookmarkId: String(bookmarkId),
          collectionId: String(collectionId),
        },
      },
      create: {
        bookmarkId: String(bookmarkId),
        collectionId: String(collectionId),
      },
      update: {},
    });
    return this.toModel({
      id: created.id,
      bookmarkId: created.bookmarkId,
      collectionId: created.collectionId,
      addedAt: created.addedAt,
    });
  }

  async remove(bookmarkId: EntityId, collectionId: EntityId): Promise<boolean> {
    try {
      await this.prisma.bookmarkCollectionItem.delete({
        where: {
          bookmarkId_collectionId: {
            bookmarkId: String(bookmarkId),
            collectionId: String(collectionId),
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async findByCollectionId(
    collectionId: EntityId
  ): Promise<IBookmarkCollectionItemModel[]> {
    const rows = await this.prisma.bookmarkCollectionItem.findMany({
      where: { collectionId: String(collectionId) },
      orderBy: { addedAt: 'desc' },
    });
    return rows.map((r) =>
      this.toModel({
        id: r.id,
        bookmarkId: r.bookmarkId,
        collectionId: r.collectionId,
        addedAt: r.addedAt,
      })
    );
  }
}
