import { injectable } from 'tsyringe';
import { Prisma } from '.prisma/client';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { ContentType } from '../../types/content/RelationType';
import type {
  ParentReference,
  AncestorReference,
} from '../../types/content/IContent';
import { IDataSource } from '../interfaces/IDataSource';
import { getPrismaClient } from './PrismaClientSingleton';

type AncestorItem = { id: string; type: string; depth: number };
type AnswerRowWithRelations = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  questionId: string;
  isAccepted: boolean;
  parentId: string | null;
  parentType: string | null;
  ancestors: AncestorItem[] | Prisma.JsonValue | null;
  relatedContents: string[];
  user?: { id: string; name: string; email: string; profile_image: string };
  question?: { id: string; title: string; slug: string | null };
};
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

@injectable()
export class AnswerPostgreSQLDataSource implements IDataSource<IAnswerModel> {
  private get prisma() {
    return getPrismaClient();
  }

  private async loadReactions(
    contentId: string
  ): Promise<{ likes: string[]; dislikes: string[] }> {
    const reactions = await this.prisma.contentReaction.findMany({
      where: { contentType: 'answer', contentId },
    });
    const likes = reactions
      .filter((r) => r.type === 'like')
      .map((r) => r.userId);
    const dislikes = reactions
      .filter((r) => r.type === 'dislike')
      .map((r) => r.userId);
    return { likes, dislikes };
  }

  private async toEntity(
    row: AnswerRowWithRelations,
    extra?: {
      userInfo?: { id: string; name: string; email: string; profile_image: string };
      questionInfo?: { id: string; title: string; slug: string | null };
      likes?: string[];
      dislikes?: string[];
    }
  ): Promise<IAnswerModel> {
    const likes = extra?.likes ?? (await this.loadReactions(row.id)).likes;
    const dislikes = extra?.dislikes ?? (await this.loadReactions(row.id)).dislikes;

    const uInfo = extra?.userInfo ?? (() => {
      const u = row.user;
      return u
        ? { id: u.id, name: u.name, email: u.email, profile_image: u.profile_image }
        : { id: row.userId, name: 'Anonim', email: '', profile_image: '' };
    })();
    const userInfo = { _id: uInfo.id, name: uInfo.name, email: uInfo.email, profile_image: uInfo.profile_image };

    const qInfo = extra?.questionInfo ?? (() => {
      const q = row.question;
      return q ? { id: q.id, title: q.title, slug: q.slug ?? undefined } : undefined;
    })();
    const questionInfo = qInfo ? { _id: qInfo.id, title: qInfo.title, slug: qInfo.slug ?? undefined } : undefined;

    const ancestors = Array.isArray(row.ancestors) ? (row.ancestors as AncestorItem[]) : null;
    return {
      _id: row.id,
      contentType: ContentType.ANSWER,
      content: row.content,
      user: row.userId,
      userInfo,
      question: row.questionId,
      questionInfo,
      likes,
      dislikes,
      isAccepted: row.isAccepted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      parent:
        row.parentId && row.parentType
          ? ({ id: row.parentId, type: row.parentType as ContentType } as ParentReference)
          : undefined,
      ancestors: ancestors?.map((a) => ({
        id: a.id,
        type: a.type as ContentType,
        depth: a.depth,
      })) as AncestorReference[] | undefined,
      relatedContents: row.relatedContents ?? [],
    };
  }

  async create(data: Partial<IAnswerModel>): Promise<IAnswerModel> {
    const { _id, likes, dislikes, userInfo, questionInfo, ...rest } = data;
    const created = await this.prisma.answer.create({
      data: {
        content: rest.content!,
        userId: rest.user!,
        questionId: rest.question!,
        isAccepted: rest.isAccepted ?? false,
        parentId: rest.parent?.id ?? null,
        parentType: rest.parent?.type ?? null,
        ancestors: rest.ancestors != null ? (rest.ancestors as object) : undefined,
        relatedContents: rest.relatedContents ?? [],
      },
      include: {
        user: { select: { id: true, name: true, email: true, profile_image: true } },
        question: { select: { id: true, title: true, slug: true } },
      },
    });
    if (likes && likes.length > 0) {
      await this.prisma.contentReaction.createMany({
        data: likes.map((userId) => ({
          contentType: 'answer',
          contentId: created.id,
          userId,
          type: 'like',
        })),
        skipDuplicates: true,
      });
    }
    if (dislikes && dislikes.length > 0) {
      await this.prisma.contentReaction.createMany({
        data: dislikes.map((userId) => ({
          contentType: 'answer',
          contentId: created.id,
          userId,
          type: 'dislike',
        })),
        skipDuplicates: true,
      });
    }
    const { likes: l, dislikes: d } = await this.loadReactions(created.id);
    const c = created as typeof created & { user?: { id: string; name: string; email: string; profile_image: string }; question?: { id: string; title: string; slug: string | null } };
    return this.toEntity(c, {
      userInfo: c.user ? { id: c.user.id, name: c.user.name, email: c.user.email, profile_image: c.user.profile_image } : undefined,
      questionInfo: c.question ? { id: c.question.id, title: c.question.title, slug: c.question.slug } : undefined,
      likes: l,
      dislikes: d,
    });
  }

  async findById(id: string): Promise<IAnswerModel> {
    const row = await this.prisma.answer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, profile_image: true } },
        question: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.ANSWER.NOT_FOUND.en
      );
    }
    const { likes, dislikes } = await this.loadReactions(id);
    const r = row as AnswerRowWithRelations;
    return this.toEntity(r, {
      userInfo: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email, profile_image: r.user.profile_image } : undefined,
      questionInfo: r.question ? { id: r.question.id, title: r.question.title, slug: r.question.slug } : undefined,
      likes,
      dislikes,
    });
  }

  async findAll(): Promise<IAnswerModel[]> {
    const rows = await this.prisma.answer.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, profile_image: true } },
        question: { select: { id: true, title: true, slug: true } },
      },
    });
    const result: IAnswerModel[] = [];
    for (const row of rows) {
      const r = row as AnswerRowWithRelations;
      const { likes, dislikes } = await this.loadReactions(row.id);
      result.push(await this.toEntity(r, {
        userInfo: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email, profile_image: r.user.profile_image } : undefined,
        questionInfo: r.question ? { id: r.question.id, title: r.question.title, slug: r.question.slug } : undefined,
        likes,
        dislikes,
      }));
    }
    return result;
  }

  async updateById(id: string, data: Partial<IAnswerModel>): Promise<IAnswerModel> {
    const { _id, likes, dislikes, userInfo, questionInfo, ...rest } = data;

    if (likes !== undefined || dislikes !== undefined) {
      await this.prisma.contentReaction.deleteMany({
        where: { contentType: 'answer', contentId: id },
      });
      const toCreate: { contentType: 'answer'; contentId: string; userId: string; type: string }[] = [];
      (likes ?? []).forEach((userId) => toCreate.push({ contentType: 'answer', contentId: id, userId, type: 'like' }));
      (dislikes ?? []).forEach((userId) => toCreate.push({ contentType: 'answer', contentId: id, userId, type: 'dislike' }));
      if (toCreate.length > 0) {
        await this.prisma.contentReaction.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      }
    }

    const updateData: Prisma.AnswerUncheckedUpdateInput = {};
    if (rest.content != null) updateData.content = rest.content;
    if (rest.user != null) updateData.userId = rest.user;
    if (rest.question != null) updateData.questionId = rest.question;
    if (rest.isAccepted != null) updateData.isAccepted = rest.isAccepted;
    if (rest.parent != null) {
      updateData.parentId = rest.parent.id;
      updateData.parentType = rest.parent.type;
    }
    if (rest.ancestors != null) updateData.ancestors = rest.ancestors as unknown as Prisma.InputJsonValue;
    if (rest.relatedContents != null) updateData.relatedContents = rest.relatedContents;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.answer.update({
        where: { id },
        data: updateData,
      });
    }

    return this.findById(id);
  }

  async deleteById(id: string): Promise<IAnswerModel> {
    const row = await this.findById(id);
    await this.prisma.answer.delete({ where: { id } });
    return row;
  }

  async findByField(field: keyof IAnswerModel, value: string | string[] | number | boolean): Promise<IAnswerModel[]> {
    const where: Prisma.AnswerWhereInput = {};
    if (field === '_id') {
      if (Array.isArray(value)) where.id = { in: value as string[] };
      else where.id = String(value);
    } else if (field === 'content') where.content = String(value);
    else if (field === 'user') where.userId = String(value);
    else if (field === 'question') where.questionId = String(value);
    else if (field === 'isAccepted') where.isAccepted = Boolean(value);
    let rows: Awaited<ReturnType<typeof this.prisma.answer.findMany>>;
    if (Object.keys(where).length > 0) {
      rows = await this.prisma.answer.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, profile_image: true } },
          question: { select: { id: true, title: true, slug: true } },
        },
      });
    } else {
      rows = [];
    }
    const result: IAnswerModel[] = [];
    for (const row of rows) {
      const r = row as AnswerRowWithRelations;
      const { likes, dislikes } = await this.loadReactions(row.id);
      result.push(await this.toEntity(r, {
        userInfo: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email, profile_image: r.user.profile_image } : undefined,
        questionInfo: r.question ? { id: r.question.id, title: r.question.title, slug: r.question.slug } : undefined,
        likes,
        dislikes,
      }));
    }
    return result;
  }

  async findByFields(fields: Partial<IAnswerModel>): Promise<IAnswerModel[]> {
    const idVal = fields._id;
    const idInParam = idVal != null && typeof idVal === 'object' ? (idVal as { $in?: string[]; in?: string[] }) : null;
    const ids = idInParam?.$in ?? idInParam?.in;
    if (ids && ids.length > 0) return this.findByField('_id', ids);

    const where: Prisma.AnswerWhereInput = {};
    if (fields._id != null && typeof fields._id === 'string') where.id = fields._id;
    if (fields.content != null) where.content = fields.content;
    if (fields.user != null) where.userId = fields.user;
    if (fields.question != null) where.questionId = fields.question;
    if (fields.isAccepted != null) where.isAccepted = fields.isAccepted;

    const rows = await this.prisma.answer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, profile_image: true } },
        question: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const result: IAnswerModel[] = [];
    for (const row of rows) {
      const r = row as AnswerRowWithRelations;
      const { likes, dislikes } = await this.loadReactions(row.id);
      result.push(await this.toEntity(r, {
        userInfo: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email, profile_image: r.user.profile_image } : undefined,
        questionInfo: r.question ? { id: r.question.id, title: r.question.title, slug: r.question.slug } : undefined,
        likes,
        dislikes,
      }));
    }
    return result;
  }

  async countAll(): Promise<number> {
    return this.prisma.answer.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.answer.deleteMany({});
    return result.count;
  }
}
