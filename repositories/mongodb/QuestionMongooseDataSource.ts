import { IEntityModel } from "../interfaces/IEntityModel";
import { IQuestionModel } from "../../models/interfaces/IQuestionModel";
import { IDataSource } from "../interfaces/IDataSource";
import { IQuestionMongo } from "../../models/mongodb/QuestionMongoModel";
import CustomError from '../../helpers/error/CustomError';

export class QuestionMongooseDataSource implements IDataSource<IQuestionModel> {
  private model: IEntityModel<IQuestionMongo>;

  constructor(model: IEntityModel<IQuestionMongo>) {
    this.model = model;
  }

  private toEntity(mongoDoc: any): IQuestionModel {
    return {
      _id: mongoDoc._id.toString(),
      title: mongoDoc.title,
      content: mongoDoc.content,
      slug: mongoDoc.slug,
      createdAt: mongoDoc.createdAt,
      user: mongoDoc.user.toString(),
      likes: mongoDoc.likes.map((like: any) => like.toString()),
      answers: mongoDoc.answers.map((answer: any) => answer.toString())
    };
  }

  async create(data: Partial<IQuestionModel>): Promise<IQuestionModel> {
    try {
      const { _id, ...rest } = data;
      const result = await this.model.create(rest as Partial<IQuestionMongo>);
      return this.toEntity(result);
    } catch (err) {
      throw new CustomError('Database error in QuestionMongooseDataSource.create', 500);
    }
  }

  async findById(id: string): Promise<IQuestionModel | null> {
    try {
      const result = await this.model.findById(id);
      return result ? this.toEntity(result) : null;
    } catch (err) {
      throw new CustomError('Database error in QuestionMongooseDataSource.findById', 500);
    }
  }

  async findAll(): Promise<IQuestionModel[]> {
    try {
      const results = await this.model.find();
      return results.map((doc: any) => this.toEntity(doc));
    } catch (err) {
      throw new CustomError('Database error in QuestionMongooseDataSource.findAll', 500);
    }
  }

  async updateById(id: string, data: Partial<IQuestionModel>): Promise<IQuestionModel | null> {
    try {
      const { _id, ...rest } = data;
      const result = await this.model.findByIdAndUpdate(id, rest as Partial<IQuestionMongo>, { new: true });
      return result ? this.toEntity(result) : null;
    } catch (err) {
      throw new CustomError('Database error in QuestionMongooseDataSource.updateById', 500);
    }
  }

  async deleteById(id: string): Promise<IQuestionModel | null> {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return result ? this.toEntity(result) : null;
    } catch (err) {
      throw new CustomError('Database error in QuestionMongooseDataSource.deleteById', 500);
    }
  }

  async countAll(): Promise<number> {
    try {
      return this.model.countDocuments();
    } catch (err) {
      throw new CustomError('Database error in QuestionMongooseDataSource.countAll', 500);
    }
  }

  async deleteAll(): Promise<any> {
    try {
      return this.model.deleteMany({});
    } catch (err) {
      throw new CustomError('Database error in QuestionMongooseDataSource.deleteAll', 500);
    }
  }
} 