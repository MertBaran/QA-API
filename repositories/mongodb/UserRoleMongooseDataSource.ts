import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IUserRoleModel } from '../../models/interfaces/IUserRoleModel';
import { IDataSource } from '../interfaces/IDataSource';
import CustomError from '../../helpers/error/CustomError';
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
    try {
      const { _id, ...rest } = data;
      const result = await this.model.create(rest);
      return this.toEntity(result);
    } catch (_err) {
      throw new CustomError(RepositoryConstants.USER_ROLE.CREATE_ERROR.en, 500);
    }
  }

  async findById(id: string): Promise<IUserRoleModel | null> {
    try {
      const result = await this.model.findById(id);
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.FIND_BY_ID_ERROR.en,
        500
      );
    }
  }

  async findAll(): Promise<IUserRoleModel[]> {
    try {
      const results = await this.model.find();
      return results.map((doc: any) => this.toEntity(doc));
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.FIND_ALL_ERROR.en,
        500
      );
    }
  }

  async updateById(
    id: string,
    data: Partial<IUserRoleModel>
  ): Promise<IUserRoleModel | null> {
    try {
      const { _id, ...rest } = data;
      const result = await this.model.findByIdAndUpdate(id, rest, {
        new: true,
      });
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.UPDATE_BY_ID_ERROR.en,
        500
      );
    }
  }

  async deleteById(id: string): Promise<IUserRoleModel | null> {
    try {
      const result = await this.model.findByIdAndDelete(id);
      return result ? this.toEntity(result) : null;
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.DELETE_BY_ID_ERROR.en,
        500
      );
    }
  }

  async findByField(
    field: keyof IUserRoleModel,
    value: any
  ): Promise<IUserRoleModel[]> {
    try {
      const results = await this.model.find({ [field]: value });
      return results.map((doc: any) => this.toEntity(doc));
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.FIND_ALL_ERROR.en,
        500
      );
    }
  }

  async findByFields(
    fields: Partial<IUserRoleModel>
  ): Promise<IUserRoleModel[]> {
    try {
      const results = await this.model.find(fields);
      return results.map((doc: any) => this.toEntity(doc));
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.FIND_ALL_ERROR.en,
        500
      );
    }
  }

  async countAll(): Promise<number> {
    try {
      return this.model.countDocuments();
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.COUNT_ALL_ERROR.en,
        500
      );
    }
  }

  async deleteAll(): Promise<any> {
    try {
      return this.model.deleteMany({});
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.USER_ROLE.DELETE_ALL_ERROR.en,
        500
      );
    }
  }
}
