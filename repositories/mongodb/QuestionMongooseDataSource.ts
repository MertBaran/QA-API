import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { ContentType } from '../../types/content/RelationType';
import { IDataSource } from '../interfaces/IDataSource';
import { IQuestionMongo } from '../../models/mongodb/QuestionMongoModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/question/pagination.dto';

@injectable()
export class QuestionMongooseDataSource implements IDataSource<IQuestionModel> {
  private model: IEntityModel<IQuestionMongo>;

  constructor() {
    // Import dynamically to avoid circular dependency
    const QuestionMongo =
      require('../../models/mongodb/QuestionMongoModel').default;
    this.model = QuestionMongo;
  }

  private toEntity(mongoDoc: any): IQuestionModel {
    // User bilgisini kontrol et - populate edilmiş mi?
    const userInfo =
      mongoDoc.user && typeof mongoDoc.user === 'object'
        ? {
            _id: mongoDoc.user._id.toString(),
            name: mongoDoc.user.name,
            email: mongoDoc.user.email,
            profile_image: mongoDoc.user.profile_image,
            title: mongoDoc.user.title,
          }
        : mongoDoc.user && typeof mongoDoc.user === 'string'
          ? {
              _id: mongoDoc.user.toString(),
              name: 'Anonim',
              email: '',
              profile_image: '',
              title: undefined,
            }
          : {
              _id: 'unknown',
              name: 'Anonim',
              email: '',
              profile_image: '',
              title: undefined,
            };

    return {
      _id: mongoDoc._id.toString(),
      contentType: ContentType.QUESTION,
      title: mongoDoc.title,
      content: mongoDoc.content,
      slug: mongoDoc.slug,
      category: mongoDoc.category || 'General',
      tags: mongoDoc.tags || [],
      views: mongoDoc.views,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
      user: userInfo._id,
      userInfo,
      likes: (mongoDoc.likes || []).map((like: any) => like.toString()),
      dislikes: (mongoDoc.dislikes || []).map((dislike: any) =>
        dislike.toString()
      ),
      answers: (mongoDoc.answers || []).map((answer: any) => answer.toString()),
      parentFormId: mongoDoc.parentFormId?.toString(),
      relatedForms: (mongoDoc.relatedForms || []).map((form: any) =>
        form.toString()
      ),
    };
  }

  async create(data: Partial<IQuestionModel>): Promise<IQuestionModel> {
    const { _id, ...rest } = data;

    // user field'ını ObjectId'ye çevir
    const createData = {
      ...rest,
      user: rest.user, // user zaten string olarak geliyor, mongoose otomatik çevirir
      likes: rest.likes || [],
      answers: rest.answers || [],
      dislikes: rest.dislikes || [],
      parentFormId: rest.parentFormId,
      relatedForms: rest.relatedForms || [],
    };

    const result = await this.model.create(
      createData as unknown as Partial<IQuestionMongo>
    );
    // Populate user info for immediate use
    const populatedResult = await (this.model as any)
      .findById(result._id)
      .populate('user', 'name email profile_image title');
    return this.toEntity(populatedResult);
  }

  async findById(id: string): Promise<IQuestionModel> {
    const result = await this.model
      .findById(id)
      .populate('user', 'name email profile_image title');
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.QUESTION.NOT_FOUND.en
      );
    }
    return this.toEntity(result);
  }

  async findAll(): Promise<IQuestionModel[]> {
    const results = await this.model
      .find()
      .populate('user', 'name email profile_image title');
    return results.map((doc: any) => this.toEntity(doc));
  }

  async updateById(
    id: string,
    data: Partial<IQuestionModel>
  ): Promise<IQuestionModel> {
    const { _id, ...rest } = data;
    const result = await this.model.findByIdAndUpdate(
      id,
      rest as Partial<IQuestionMongo>,
      { new: true }
    );
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.QUESTION.UPDATE_BY_ID_NOT_FOUND.en
      );
    }
    // Populate user info for immediate use
    const populatedResult = await (this.model as any)
      .findById(result._id)
      .populate('user', 'name email profile_image title');
    return this.toEntity(populatedResult);
  }

  async deleteById(id: string): Promise<IQuestionModel> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.QUESTION.DELETE_BY_ID_NOT_FOUND.en
      );
    }
    const populatedResult = await (this.model as any)
      .findById(result._id)
      .populate('user', 'name email profile_image title');
    return this.toEntity(populatedResult || result);
  }

  async findByField(
    field: keyof IQuestionModel,
    value: any
  ): Promise<IQuestionModel[]> {
    const results = await this.model
      .find({ [field]: value })
      .populate('user', 'name email profile_image title');
    return results.map((doc: any) => this.toEntity(doc));
  }

  async findByFields(
    fields: Partial<IQuestionModel>
  ): Promise<IQuestionModel[]> {
    const results = await this.model
      .find(fields)
      .populate('user', 'name email profile_image title');
    return results.map((doc: any) => this.toEntity(doc));
  }

  async countAll(): Promise<number> {
    return this.model.countDocuments();
  }

  async deleteAll(): Promise<any> {
    return this.model.deleteMany({});
  }

  async findPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    const { page, limit, sortBy, sortOrder, search, category, tags } = filters;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: tags.split(',').map((tag: string) => tag.trim()) };
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute queries
    const [questionDocs, totalItems] = await Promise.all([
      this.model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email profile_image title'),
      this.model.countDocuments(query),
    ]);

    // Convert to entities
    const questions = questionDocs.map((doc: any) => this.toEntity(doc));

    // Calculate pagination info
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: questions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
}
