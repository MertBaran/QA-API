import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { IDataSource } from '../interfaces/IDataSource';
import { IAnswerMongo } from '../../models/mongodb/AnswerMongoModel';
import CustomError from '../../helpers/error/CustomError';

@injectable()
export class AnswerMongooseDataSource implements IDataSource<IAnswerModel> {
  private model: IEntityModel<IAnswerMongo>;

  constructor() {
    // Import dynamically to avoid circular dependency
    const AnswerMongo =
      require('../../models/mongodb/AnswerMongoModel').default;
    this.model = AnswerMongo;
  }

  private toEntity(mongoDoc: any): IAnswerModel {
    return {
      _id: mongoDoc._id.toString(),
      content: mongoDoc.content,
      user:
        mongoDoc.user && mongoDoc.user.name
          ? { _id: mongoDoc.user._id.toString(), name: mongoDoc.user.name }
          : mongoDoc.user.toString(),
      question:
        mongoDoc.question && mongoDoc.question.title
          ? {
              _id: mongoDoc.question._id.toString(),
              title: mongoDoc.question.title,
            }
          : mongoDoc.question.toString(),
      likes: Array.isArray(mongoDoc.likes)
        ? mongoDoc.likes.map((like: any) =>
            like && like._id ? like._id.toString() : like.toString()
          )
        : [],
      createdAt: mongoDoc.createdAt,
    };
  }

  async create(data: Partial<IAnswerModel>): Promise<IAnswerModel> {
    try {
      // Omit _id to avoid type conflict
      const { _id, ...rest } = data;
      const result = await this.model.create(rest as Partial<IAnswerMongo>);
      return this.toEntity(result);
    } catch (_err) {
      throw new CustomError(
        'Database error in AnswerMongooseDataSource.create',
        500
      );
    }
  }

  async findById(id: string): Promise<IAnswerModel | null> {
    try {
      const result = await (this.model as any)
        .findById(id)
        .populate('user', 'name')
        .populate('question', 'title');
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        'Database error in AnswerMongooseDataSource.findById',
        500
      );
    }
  }

  async findAll(): Promise<IAnswerModel[]> {
    try {
      const results = await this.model.find();
      return results.map((doc: any) => this.toEntity(doc));
    } catch (_err) {
      throw new CustomError(
        'Database error in AnswerMongooseDataSource.findAll',
        500
      );
    }
  }

  async updateById(
    id: string,
    data: Partial<IAnswerModel>
  ): Promise<IAnswerModel | null> {
    try {
      // Omit _id to avoid type conflict
      const { _id, ...rest } = data;
      const result = await this.model.findByIdAndUpdate(
        id,
        rest as Partial<IAnswerMongo>,
        { new: true }
      );
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        'Database error in AnswerMongooseDataSource.updateById',
        500
      );
    }
  }

  async deleteById(id: string): Promise<IAnswerModel | null> {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        'Database error in AnswerMongooseDataSource.deleteById',
        500
      );
    }
  }

  async countAll(): Promise<number> {
    try {
      return this.model.countDocuments();
    } catch (_err) {
      throw new CustomError(
        'Database error in AnswerMongooseDataSource.countAll',
        500
      );
    }
  }

  async deleteAll(): Promise<any> {
    try {
      return this.model.deleteMany({});
    } catch (_err) {
      throw new CustomError(
        'Database error in AnswerMongooseDataSource.deleteAll',
        500
      );
    }
  }
}
