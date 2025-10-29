import { injectable } from 'tsyringe';
import { IPermissionDataSource } from '../interfaces/IPermissionDataSource';
import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { IPermissionMongo } from '../../models/mongodb/PermissionMongoModel';
import { EntityId } from '../../types/database';
import PermissionMongo from '../../models/mongodb/PermissionMongoModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

@injectable()
export class PermissionMongooseDataSource implements IPermissionDataSource {
  async create(data: Partial<IPermissionModel>): Promise<IPermissionModel> {
    const permission = new PermissionMongo(data);
    const savedPermission = await permission.save();
    return this.toEntity(savedPermission);
  }

  async findById(id: EntityId): Promise<IPermissionModel> {
    const permission = await PermissionMongo.findById(id);
    if (!permission) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(permission);
  }

  async findAll(): Promise<IPermissionModel[]> {
    const permissions = await PermissionMongo.find();
    return permissions.map(permission => this.toEntity(permission));
  }

  async updateById(
    id: EntityId,
    data: Partial<IPermissionModel>
  ): Promise<IPermissionModel> {
    const permission = await PermissionMongo.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!permission) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(permission);
  }

  async deleteById(id: EntityId): Promise<IPermissionModel> {
    const result = await PermissionMongo.findByIdAndDelete(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.DELETE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async findByField(
    field: keyof IPermissionModel,
    value: any
  ): Promise<IPermissionModel[]> {
    const permissions = await PermissionMongo.find({ [field]: value });
    return permissions.map(permission => this.toEntity(permission));
  }

  async findByFields(
    fields: Partial<IPermissionModel>
  ): Promise<IPermissionModel[]> {
    const permissions = await PermissionMongo.find(fields);
    return permissions.map(permission => this.toEntity(permission));
  }

  async findByName(name: string): Promise<IPermissionModel> {
    const permission = await PermissionMongo.findOne({ name });
    if (!permission) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.toEntity(permission);
  }

  async findByResource(resource: string): Promise<IPermissionModel[]> {
    const permissions = await PermissionMongo.find({ resource });
    return permissions.map(permission => this.toEntity(permission));
  }

  async findByCategory(category: string): Promise<IPermissionModel[]> {
    const permissions = await PermissionMongo.find({ category });
    return permissions.map(permission => this.toEntity(permission));
  }

  async findActive(): Promise<IPermissionModel[]> {
    const permissions = await PermissionMongo.find({ isActive: true });
    return permissions.map(permission => this.toEntity(permission));
  }

  async countAll(): Promise<number> {
    return PermissionMongo.countDocuments();
  }

  async deleteAll(): Promise<number> {
    const result = await PermissionMongo.deleteMany({});
    return result.deletedCount || 0;
  }

  private toEntity(mongoDoc: IPermissionMongo): IPermissionModel {
    return {
      _id: mongoDoc._id,
      name: mongoDoc.name,
      description: mongoDoc.description,
      resource: mongoDoc.resource,
      action: mongoDoc.action,
      category: mongoDoc.category,
      isActive: mongoDoc.isActive,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    };
  }
}
