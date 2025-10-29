import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IUserModel } from '../../models/interfaces/IUserModel';
import { IDataSource } from '../interfaces/IDataSource';
import { IUserMongo } from '../../models/mongodb/UserMongoModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

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
      // roles field'ı artık UserRole tablosunda tutuluyor
      password: mongoDoc.password,
      title: mongoDoc.title,
      about: mongoDoc.about,
      place: mongoDoc.place,
      website: mongoDoc.website,
      profile_image: mongoDoc.profile_image,
      blocked: mongoDoc.blocked,
      resetPasswordToken: mongoDoc.resetPasswordToken,
      resetPasswordExpire: mongoDoc.resetPasswordExpire,
      lastPasswordChange: mongoDoc.lastPasswordChange,
      createdAt: mongoDoc.createdAt,
      language: mongoDoc.language,
      phoneNumber: mongoDoc.phoneNumber,
      webhookUrl: mongoDoc.webhookUrl,
      notificationPreferences: mongoDoc.notificationPreferences,
    };
  }

  async create(data: Partial<IUserModel>): Promise<IUserModel> {
    const { _id, ...rest } = data;
    const result = await this.model.create(rest as Partial<IUserMongo>);
    return this.toEntity(result);
  }

  async findById(id: string): Promise<IUserModel> {
    const result = await this.model.findById(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.USER.NOT_FOUND.en
      );
    }
    return this.toEntity(result);
  }

  async findAll(): Promise<IUserModel[]> {
    const results = await this.model.find();
    return results.map((doc: any) => this.toEntity(doc));
  }

  async updateById(id: string, data: Partial<IUserModel>): Promise<IUserModel> {
    const { _id, ...rest } = data;
    const result = await this.model.findByIdAndUpdate(
      id,
      rest as Partial<IUserMongo>,
      { new: true }
    );
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.USER.UPDATE_BY_ID_NOT_FOUND.en
      );
    }
    return this.toEntity(result);
  }

  async deleteById(id: string): Promise<IUserModel> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.USER.DELETE_BY_ID_NOT_FOUND.en
      );
    }
    return this.toEntity(result);
  }

  async findByField(
    field: keyof IUserModel,
    value: any
  ): Promise<IUserModel[]> {
    const results = await this.model.find({ [field]: value });
    return results.map((doc: any) => this.toEntity(doc));
  }

  async findByFields(fields: Partial<IUserModel>): Promise<IUserModel[]> {
    const results = await this.model.find(fields);
    return results.map((doc: any) => this.toEntity(doc));
  }

  async countAll(): Promise<number> {
    return this.model.countDocuments();
  }

  async deleteAll(): Promise<any> {
    return this.model.deleteMany({});
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel> {
    const anyModel = this.model as any;
    const result = await anyModel.findOne({ email }).select('+password');
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async findActive(): Promise<IUserModel[]> {
    const results = await this.model.find({ blocked: { $ne: true } });
    return results.map((doc: any) => this.toEntity(doc));
  }
}
