import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { IDataSource } from '../interfaces/IDataSource';
import { IQuestionMongo } from '../../models/mongodb/QuestionMongoModel';
import CustomError from '../../helpers/error/CustomError';
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
          }
        : {
            _id: mongoDoc.user.toString(),
            name: 'Anonim',
            email: '',
            profile_image: '',
          };

    return {
      _id: mongoDoc._id.toString(),
      title: mongoDoc.title,
      content: mongoDoc.content,
      slug: mongoDoc.slug,
      category: mongoDoc.category || 'General',
      tags: mongoDoc.tags || [],
      createdAt: mongoDoc.createdAt,
      user: userInfo._id,
      userInfo,
      likes: mongoDoc.likes.map((like: any) => like.toString()),
      answers: mongoDoc.answers.map((answer: any) => answer.toString()),
    };
  }

  async create(data: Partial<IQuestionModel>): Promise<IQuestionModel> {
    try {
      const { _id, ...rest } = data;

      // user field'ını ObjectId'ye çevir
      const createData = {
        ...rest,
        user: rest.user, // user zaten string olarak geliyor, mongoose otomatik çevirir
        likes: rest.likes || [],
        answers: rest.answers || [],
      };

      const result = await this.model.create(
        createData as unknown as Partial<IQuestionMongo>
      );
      return this.toEntity(result);
    } catch (_err) {
      console.error('QuestionMongooseDataSource create error:', _err);
      throw new CustomError(RepositoryConstants.QUESTION.CREATE_ERROR.en, 500);
    }
  }

  async findById(id: string): Promise<IQuestionModel | null> {
    try {
      const result = await this.model
        .findById(id)
        .populate('user', 'name email profile_image');
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.QUESTION.FIND_BY_ID_ERROR.en,
        500
      );
    }
  }

  async findAll(): Promise<IQuestionModel[]> {
    try {
      const results = await this.model.find();
      return results.map((doc: any) => this.toEntity(doc));
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.QUESTION.FIND_ALL_ERROR.en,
        500
      );
    }
  }

  async updateById(
    id: string,
    data: Partial<IQuestionModel>
  ): Promise<IQuestionModel | null> {
    try {
      const { _id, ...rest } = data;
      const result = await this.model.findByIdAndUpdate(
        id,
        rest as Partial<IQuestionMongo>,
        { new: true }
      );
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.QUESTION.UPDATE_BY_ID_ERROR.en,
        500
      );
    }
  }

  async deleteById(id: string): Promise<IQuestionModel | null> {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.QUESTION.DELETE_BY_ID_ERROR.en,
        500
      );
    }
  }

  async countAll(): Promise<number> {
    try {
      return this.model.countDocuments();
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.QUESTION.COUNT_ALL_ERROR.en,
        500
      );
    }
  }

  async deleteAll(): Promise<any> {
    try {
      return this.model.deleteMany({});
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.QUESTION.DELETE_ALL_ERROR.en,
        500
      );
    }
  }

  async findPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    try {
      const { page, limit, sortBy, sortOrder, search, category, tags } =
        filters;

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
      const [questions, totalItems] = await Promise.all([
        this.model
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email profile_image')
          .lean(),
        this.model.countDocuments(query),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: questions.map((doc: any) => this.toEntity(doc)),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (_err) {
      console.error('QuestionMongooseDataSource findPaginated error:', _err);
      throw new CustomError(
        RepositoryConstants.QUESTION.FIND_ALL_ERROR.en,
        500
      );
    }
  }
}
