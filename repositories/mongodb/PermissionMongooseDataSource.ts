import { injectable } from 'tsyringe';
import { IPermissionDataSource } from '../interfaces/IPermissionDataSource';
import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { IPermissionMongo } from '../../models/mongodb/PermissionMongoModel';
import { EntityId } from '../../types/database';
import PermissionMongo from '../../models/mongodb/PermissionMongoModel';

@injectable()
export class PermissionMongooseDataSource implements IPermissionDataSource {
  async create(data: Partial<IPermissionModel>): Promise<IPermissionModel> {
    const permission = new PermissionMongo(data);
    const savedPermission = await permission.save();
    return this.toEntity(savedPermission);
  }

  async findById(id: EntityId): Promise<IPermissionModel | null> {
    const permission = await PermissionMongo.findById(id);
    return permission ? this.toEntity(permission) : null;
  }

  async findAll(): Promise<IPermissionModel[]> {
    const permissions = await PermissionMongo.find();
    return permissions.map(permission => this.toEntity(permission));
  }

  async updateById(
    id: EntityId,
    data: Partial<IPermissionModel>
  ): Promise<IPermissionModel | null> {
    const permission = await PermissionMongo.findByIdAndUpdate(id, data, {
      new: true,
    });
    return permission ? this.toEntity(permission) : null;
  }

  async deleteById(id: EntityId): Promise<IPermissionModel | null> {
    const result = await PermissionMongo.findByIdAndDelete(id);
    return result ? this.toEntity(result) : null;
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

  async findByName(name: string): Promise<IPermissionModel | null> {
    const permission = await PermissionMongo.findOne({ name });
    return permission ? this.toEntity(permission) : null;
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
