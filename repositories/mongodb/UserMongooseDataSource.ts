import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IUserModel } from '../../models/interfaces/IUserModel';
import { IDataSource } from '../interfaces/IDataSource';
import { IUserMongo } from '../../models/mongodb/UserMongoModel';
import CustomError from '../../helpers/error/CustomError';

@injectable()
export class UserMongooseDataSource implements IDataSource<IUserModel> {
  private model: IEntityModel<IUserMongo>;

  constructor() {
    // Import dynamically to avoid circular dependency
    const UserMongo = require('../../models/mongodb/UserMongoModel').default;
    this.model = UserMongo;
  }

  private toEntity(mongoDoc: any): IUserModel {
    return {
      _id: mongoDoc._id.toString(),
      name: mongoDoc.name,
      email: mongoDoc.email,
      role: mongoDoc.role,
      password: mongoDoc.password,
      title: mongoDoc.title,
      about: mongoDoc.about,
      place: mongoDoc.place,
      website: mongoDoc.website,
      profile_image: mongoDoc.profile_image,
      blocked: mongoDoc.blocked,
      resetPasswordToken: mongoDoc.resetPasswordToken,
      resetPasswordExpire: mongoDoc.resetPasswordExpire,
      createdAt: mongoDoc.createdAt,
    };
  }

  async create(data: Partial<IUserModel>): Promise<IUserModel> {
    try {
      const { _id, ...rest } = data;
      const result = await this.model.create(rest as Partial<IUserMongo>);
      return this.toEntity(result);
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.create',
        500
      );
    }
  }

  async findById(id: string): Promise<IUserModel | null> {
    try {
      const result = await this.model.findById(id);
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.findById',
        500
      );
    }
  }

  async findAll(): Promise<IUserModel[]> {
    try {
      const results = await this.model.find();
      return results.map((doc: any) => this.toEntity(doc));
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.findAll',
        500
      );
    }
  }

  async updateById(
    id: string,
    data: Partial<IUserModel>
  ): Promise<IUserModel | null> {
    try {
      const { _id, ...rest } = data;
      const result = await this.model.findByIdAndUpdate(
        id,
        rest as Partial<IUserMongo>,
        { new: true }
      );
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.updateById',
        500
      );
    }
  }

  async deleteById(id: string): Promise<IUserModel | null> {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.deleteById',
        500
      );
    }
  }

  async countAll(): Promise<number> {
    try {
      return this.model.countDocuments();
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.countAll',
        500
      );
    }
  }

  async deleteAll(): Promise<any> {
    try {
      return this.model.deleteMany({});
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.deleteAll',
        500
      );
    }
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel | null> {
    try {
      const anyModel = this.model as any;
      const result = await anyModel.findOne({ email }).select('+password');
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        'Database error in UserMongooseDataSource.findByEmailWithPassword',
        500
      );
    }
  }
}
