import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IUserRoleModel } from '../../models/interfaces/IUserRoleModel';
import { IDataSource } from '../interfaces/IDataSource';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

@injectable()
export class UserRoleMongooseDataSource implements IDataSource<IUserRoleModel> {
  private model: IEntityModel<any>;

  constructor() {
    // Import dynamically to avoid circular dependency
    const UserRoleMongo =
      require('../../models/mongodb/UserRoleMongoModel').default;
    this.model = UserRoleMongo;
  }

  private toEntity(mongoDoc: any): IUserRoleModel {
    return {
      _id: mongoDoc._id.toString(),
      userId: mongoDoc.userId.toString(),
      roleId: mongoDoc.roleId.toString(),
      assignedAt: mongoDoc.assignedAt,
      assignedBy: mongoDoc.assignedBy?.toString(),
      expiresAt: mongoDoc.expiresAt,
      isActive: mongoDoc.isActive,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    };
  }

  async create(data: Partial<IUserRoleModel>): Promise<IUserRoleModel> {
    const { _id, ...rest } = data;
    const result = await this.model.create(rest);
    return this.toEntity(result);
  }

  async findById(id: string): Promise<IUserRoleModel> {
    const result = await this.model.findById(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async findAll(): Promise<IUserRoleModel[]> {
    const results = await this.model.find();
    return results.map((doc: any) => this.toEntity(doc));
  }

  async updateById(
    id: string,
    data: Partial<IUserRoleModel>
  ): Promise<IUserRoleModel> {
    const { _id, ...rest } = data;
    const result = await this.model.findByIdAndUpdate(id, rest, {
      new: true,
    });
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async deleteById(id: string): Promise<IUserRoleModel> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.DELETE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async findByField(
    field: keyof IUserRoleModel,
    value: any
  ): Promise<IUserRoleModel[]> {
    const results = await this.model.find({ [field]: value });
    return results.map((doc: any) => this.toEntity(doc));
  }

  async findByFields(
    fields: Partial<IUserRoleModel>
  ): Promise<IUserRoleModel[]> {
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
