import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { IDataSource } from '../interfaces/IDataSource';
import { IAnswerMongo } from '../../models/mongodb/AnswerMongoModel';
import CustomError from '../../helpers/error/CustomError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

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
      content: mongoDoc.content,
      user: userInfo._id,
      userInfo,
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
    // Omit _id to avoid type conflict
    const { _id, ...rest } = data;
    const result = await this.model.create(rest as Partial<IAnswerMongo>);
    return this.toEntity(result);
  }

  async findById(id: string): Promise<IAnswerModel | null> {
    const result = await (this.model as any)
      .findById(id)
      .populate('user', 'name email profile_image')
      .populate('question', 'title');
    return result ? this.toEntity(result) : null;
  }

  async findAll(): Promise<IAnswerModel[]> {
    const results = await this.model
      .find()
      .populate('user', 'name email profile_image');
    return results.map((doc: any) => this.toEntity(doc));
  }

  async updateById(
    id: string,
    data: Partial<IAnswerModel>
  ): Promise<IAnswerModel | null> {
    // Omit _id to avoid type conflict
    const { _id, ...rest } = data;
    const result = await this.model.findByIdAndUpdate(
      id,
      rest as Partial<IAnswerMongo>,
      { new: true }
    );
    return result ? this.toEntity(result) : null;
  }

  async deleteById(id: string): Promise<IAnswerModel | null> {
    const result = await this.model.findByIdAndDelete(id);
    return result ? this.toEntity(result) : null;
  }

  async findByField(
    field: keyof IAnswerModel,
    value: any
  ): Promise<IAnswerModel[]> {
    const results = await this.model.find({ [field]: value });
    return results.map((doc: any) => this.toEntity(doc));
  }

  async findByFields(fields: Partial<IAnswerModel>): Promise<IAnswerModel[]> {
    const results = await this.model.find(fields);
    return results.map((doc: any) => this.toEntity(doc));
  }

  async countAll(): Promise<number> {
    return this.model.countDocuments();
  }

  async deleteAll(): Promise<any> {
    return this.model.deleteMany({});
  }
}
