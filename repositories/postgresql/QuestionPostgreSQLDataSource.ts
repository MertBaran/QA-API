import { injectable } from 'tsyringe';
import { Prisma } from '.prisma/client';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { ContentType } from '../../types/content/RelationType';
import type {
  ParentReference,
  AncestorReference,
} from '../../types/content/IContent';
import { IDataSource } from '../interfaces/IDataSource';
import { getPrismaClient } from './PrismaClientSingleton';

type AncestorItem = { id: string; type: string; depth: number };
type QuestionRowWithUser = {
  id: string;
  title: string;
  content: string;
  slug: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  parentId: string | null;
  parentType: string | null;
  ancestors: AncestorItem[] | Prisma.JsonValue | null;
  relatedContents: string[];
  thumbnailKey: string | null;
  thumbnailUrl: string | null;
  user?: { id: string; name: string; email: string; profile_image: string; title: string | null };
};
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import type {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/question/pagination.dto';

@injectable()
export class QuestionPostgreSQLDataSource implements IDataSource<IQuestionModel> {
  private get prisma() {
    return getPrismaClient();
  }

  private async loadReactions(
    contentType: 'question' | 'answer',
    contentId: string
  ): Promise<{ likes: string[]; dislikes: string[] }> {
    const reactions = await this.prisma.contentReaction.findMany({
      where: { contentType, contentId },
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
    row: QuestionRowWithUser,
    extra?: {
      userInfo?: { id: string; name: string; email: string; profile_image: string; title: string | null };
      answerIds?: string[];
      tagList?: string[];
      likes?: string[];
      dislikes?: string[];
    }
  ): Promise<IQuestionModel> {
    const likes = extra?.likes ?? (await this.loadReactions('question', row.id)).likes;
    const dislikes = extra?.dislikes ?? (await this.loadReactions('question', row.id)).dislikes;
    const answerIds = extra?.answerIds ?? (
      await this.prisma.answer.findMany({
        where: { questionId: row.id },
        select: { id: true },
      })
    ).map((a) => a.id);
    const tagList = extra?.tagList ?? (
      await this.prisma.questionTag.findMany({
        where: { questionId: row.id },
        select: { tag: true },
      })
    ).map((t) => t.tag);

    const uInfo = extra?.userInfo ?? (() => {
      const u = row.user;
      return u
        ? { id: u.id, name: u.name, email: u.email, profile_image: u.profile_image, title: u.title ?? undefined }
        : { id: row.userId, name: 'Anonim', email: '', profile_image: '', title: undefined };
    })();
    const userInfo = { _id: uInfo.id, name: uInfo.name, email: uInfo.email, profile_image: uInfo.profile_image, title: uInfo.title };

    const ancestors = Array.isArray(row.ancestors) ? (row.ancestors as AncestorItem[]) : null;
    return {
      _id: row.id,
      contentType: ContentType.QUESTION,
      title: row.title,
      content: row.content,
      slug: row.slug ?? '',
      category: row.category,
      tags: tagList,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: row.userId,
      userInfo,
      likes,
      dislikes,
      answers: answerIds,
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
      thumbnail:
        row.thumbnailKey || row.thumbnailUrl
          ? {
              key: row.thumbnailKey ?? '',
              url: row.thumbnailUrl ?? undefined,
            }
          : null,
    };
  }

  async create(data: Partial<IQuestionModel>): Promise<IQuestionModel> {
    const { _id, likes, dislikes, answers, tags, userInfo, ...rest } = data;
    const created = await this.prisma.question.create({
      data: {
        title: rest.title!,
        content: rest.content!,
        slug: rest.slug ?? null,
        category: rest.category ?? 'General',
        userId: rest.user!,
        parentId: rest.parent?.id ?? null,
        parentType: rest.parent?.type ?? null,
        ancestors: rest.ancestors != null ? (rest.ancestors as object) : undefined,
        relatedContents: rest.relatedContents ?? [],
        thumbnailKey: rest.thumbnail?.key ?? null,
        thumbnailUrl: rest.thumbnail?.url ?? null,
      },
      include: { user: { select: { id: true, name: true, email: true, profile_image: true, title: true } } },
    });
    if (likes && likes.length > 0) {
      await this.prisma.contentReaction.createMany({
        data: likes.map((userId) => ({
          contentType: 'question',
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
          contentType: 'question',
          contentId: created.id,
          userId,
          type: 'dislike',
        })),
        skipDuplicates: true,
      });
    }
    if (tags && tags.length > 0) {
      await this.prisma.questionTag.createMany({
        data: tags.map((tag) => ({ questionId: created.id, tag })),
        skipDuplicates: true,
      });
    }
    return this.toEntity(created as QuestionRowWithUser);
  }

  async findById(id: string): Promise<IQuestionModel> {
    const row = await this.prisma.question.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, profile_image: true, title: true } } },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.QUESTION.NOT_FOUND.en
      );
    }
    const { likes, dislikes } = await this.loadReactions('question', id);
    const answerIds = (await this.prisma.answer.findMany({ where: { questionId: id }, select: { id: true } })).map((a) => a.id);
    const tagList = (await this.prisma.questionTag.findMany({ where: { questionId: id }, select: { tag: true } })).map((t) => t.tag);
    const rowWithUser = row as QuestionRowWithUser;
    return this.toEntity(rowWithUser, {
      userInfo: rowWithUser.user ? { id: rowWithUser.user.id, name: rowWithUser.user.name, email: rowWithUser.user.email, profile_image: rowWithUser.user.profile_image, title: rowWithUser.user.title } : undefined,
      answerIds,
      tagList,
      likes,
      dislikes,
    });
  }

  async findAll(): Promise<IQuestionModel[]> {
    const rows = await this.prisma.question.findMany({
      include: { user: { select: { id: true, name: true, email: true, profile_image: true, title: true } } },
    });
    const result: IQuestionModel[] = [];
    for (const row of rows) {
      const { likes, dislikes } = await this.loadReactions('question', row.id);
      const answerIds = (await this.prisma.answer.findMany({ where: { questionId: row.id }, select: { id: true } })).map((a) => a.id);
      const tagList = (await this.prisma.questionTag.findMany({ where: { questionId: row.id }, select: { tag: true } })).map((t) => t.tag);
      const rowWithUser = row as QuestionRowWithUser;
      result.push(await this.toEntity(rowWithUser, {
        userInfo: rowWithUser.user ? { id: rowWithUser.user.id, name: rowWithUser.user.name, email: rowWithUser.user.email, profile_image: rowWithUser.user.profile_image, title: rowWithUser.user.title } : undefined,
        answerIds,
        tagList,
        likes,
        dislikes,
      }));
    }
    return result;
  }

  async updateById(id: string, data: Partial<IQuestionModel>): Promise<IQuestionModel> {
    const { _id, likes, dislikes, answers, tags, userInfo, ...rest } = data;

    if (likes !== undefined || dislikes !== undefined) {
      await this.prisma.contentReaction.deleteMany({
        where: { contentType: 'question', contentId: id },
      });
      const toCreate: { contentType: 'question'; contentId: string; userId: string; type: string }[] = [];
      (likes ?? []).forEach((userId) => toCreate.push({ contentType: 'question', contentId: id, userId, type: 'like' }));
      (dislikes ?? []).forEach((userId) => toCreate.push({ contentType: 'question', contentId: id, userId, type: 'dislike' }));
      if (toCreate.length > 0) {
        await this.prisma.contentReaction.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      }
    }

    if (tags !== undefined) {
      await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
      if (tags.length > 0) {
        await this.prisma.questionTag.createMany({
          data: tags.map((tag) => ({ questionId: id, tag })),
          skipDuplicates: true,
        });
      }
    }

    const updateData: Prisma.QuestionUncheckedUpdateInput = {};
    if (rest.title != null) updateData.title = rest.title;
    if (rest.content != null) updateData.content = rest.content;
    if (rest.slug != null) updateData.slug = rest.slug;
    if (rest.category != null) updateData.category = rest.category;
    if (rest.user != null) updateData.userId = rest.user;
    if (rest.parent != null) {
      updateData.parentId = rest.parent.id;
      updateData.parentType = rest.parent.type;
    }
    if (rest.ancestors != null) updateData.ancestors = rest.ancestors as unknown as Prisma.InputJsonValue;
    if (rest.relatedContents != null) updateData.relatedContents = rest.relatedContents;
    if (rest.thumbnail != null) {
      updateData.thumbnailKey = rest.thumbnail.key;
      updateData.thumbnailUrl = rest.thumbnail.url;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.question.update({
        where: { id },
        data: updateData,
      });
    }

    return this.findById(id);
  }

  async deleteById(id: string): Promise<IQuestionModel> {
    const row = await this.findById(id);
    await this.prisma.question.delete({ where: { id } });
    return row;
  }

  async findByField(field: keyof IQuestionModel, value: string | string[] | number | boolean): Promise<IQuestionModel[]> {
    const where: Prisma.QuestionWhereInput = {};
    if (field === '_id') {
      if (Array.isArray(value)) where.id = { in: value as string[] };
      else where.id = String(value);
    } else if (field === 'title') where.title = String(value);
    else if (field === 'content') where.content = String(value);
    else if (field === 'slug') where.slug = String(value);
    else if (field === 'category') where.category = String(value);
    else if (field === 'user') where.userId = String(value);
    let rows: Awaited<ReturnType<typeof this.prisma.question.findMany>>;
    if (Object.keys(where).length > 0) {
      rows = await this.prisma.question.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, profile_image: true, title: true } } },
      });
    } else {
      rows = [];
    }
    const result: IQuestionModel[] = [];
    for (const row of rows) {
      const r = row as QuestionRowWithUser;
      const { likes, dislikes } = await this.loadReactions('question', row.id);
      const answerIds = (await this.prisma.answer.findMany({ where: { questionId: row.id }, select: { id: true } })).map((a) => a.id);
      const tagList = (await this.prisma.questionTag.findMany({ where: { questionId: row.id }, select: { tag: true } })).map((t) => t.tag);
      result.push(await this.toEntity(r, {
        userInfo: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email, profile_image: r.user.profile_image, title: r.user.title } : undefined,
        answerIds,
        tagList,
        likes,
        dislikes,
      }));
    }
    return result;
  }

  async findByFields(fields: Partial<IQuestionModel>): Promise<IQuestionModel[]> {
    const idVal = fields._id;
    const idInParam = idVal != null && typeof idVal === 'object' ? (idVal as { $in?: string[]; in?: string[] }) : null;
    const ids = idInParam?.$in ?? idInParam?.in;
    if (ids && ids.length > 0) return this.findByField('_id', ids);

    const where: Prisma.QuestionWhereInput = {};
    if (fields._id != null && typeof fields._id === 'string') where.id = fields._id;
    if (fields.title != null) where.title = fields.title;
    if (fields.slug != null) where.slug = fields.slug;
    if (fields.category != null) where.category = fields.category;
    if (fields.user != null) where.userId = fields.user;

    const rows = await this.prisma.question.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, profile_image: true, title: true } } },
    });
    const result: IQuestionModel[] = [];
    for (const row of rows) {
      const { likes, dislikes } = await this.loadReactions('question', row.id);
      const answerIds = (await this.prisma.answer.findMany({ where: { questionId: row.id }, select: { id: true } })).map((a) => a.id);
      const tagList = (await this.prisma.questionTag.findMany({ where: { questionId: row.id }, select: { tag: true } })).map((t) => t.tag);
      const rowWithUser = row as QuestionRowWithUser;
      result.push(await this.toEntity(rowWithUser, {
        userInfo: rowWithUser.user ? { id: rowWithUser.user.id, name: rowWithUser.user.name, email: rowWithUser.user.email, profile_image: rowWithUser.user.profile_image, title: rowWithUser.user.title } : undefined,
        answerIds,
        tagList,
        likes,
        dislikes,
      }));
    }
    return result;
  }

  async findPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    const { page, limit, sortBy, sortOrder, search, category, tags, savedIds } = filters;

    const where: Prisma.QuestionWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (tags) {
      const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagArr.length > 0) where.tags = { some: { tag: { in: tagArr } } };
    }
    if (savedIds?.trim()) {
      const ids = savedIds.split(',').map((id) => id.trim()).filter(Boolean);
      if (ids.length > 0) where.id = { in: ids };
    }

    const sortField = ['createdAt', 'likes', 'answers', 'views'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const orderBy: Prisma.QuestionOrderByWithRelationInput =
      sortField === 'answers'
        ? { answers: { _count: sortOrder as 'asc' | 'desc' } }
        : { createdAt: sortOrder };

    const skip = (page - 1) * limit;
    const [rows, totalItems] = await Promise.all([
      this.prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true, profile_image: true, title: true } } },
      }),
      this.prisma.question.count({ where }),
    ]);

    const data: IQuestionModel[] = [];
    for (const row of rows) {
      const { likes, dislikes } = await this.loadReactions('question', row.id);
      const answerIds = (await this.prisma.answer.findMany({ where: { questionId: row.id }, select: { id: true } })).map((a) => a.id);
      const tagList = (await this.prisma.questionTag.findMany({ where: { questionId: row.id }, select: { tag: true } })).map((t) => t.tag);
      const rowWithUser = row as QuestionRowWithUser;
      data.push(await this.toEntity(rowWithUser, {
        userInfo: rowWithUser.user ? { id: rowWithUser.user.id, name: rowWithUser.user.name, email: rowWithUser.user.email, profile_image: rowWithUser.user.profile_image, title: rowWithUser.user.title } : undefined,
        answerIds,
        tagList,
        likes,
        dislikes,
      }));
    }

    const totalPages = Math.ceil(totalItems / limit);
    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async countAll(): Promise<number> {
    return this.prisma.question.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.question.deleteMany({});
    return result.count;
  }
}
