import { injectable } from 'tsyringe';
import { IRoleDataSource } from '../interfaces/IRoleDataSource';
import { IRoleModel } from '../../models/interfaces/IRoleModel';
import { IRoleMongo } from '../../models/mongodb/RoleMongoModel';
import { EntityId } from '../../types/database';
import RoleMongo from '../../models/mongodb/RoleMongoModel';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';

@injectable()
export class RoleMongooseDataSource implements IRoleDataSource {
  async create(data: Partial<IRoleModel>): Promise<IRoleModel> {
    const role = new RoleMongo(data);
    const savedRole = await role.save();
    return this.toEntity(savedRole);
  }

  async findById(id: EntityId): Promise<IRoleModel> {
    const role = await RoleMongo.findById(id).populate('permissions');
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(role);
  }

  async findAll(): Promise<IRoleModel[]> {
    const roles = await RoleMongo.find().populate('permissions');
    return roles.map(role => this.toEntity(role));
  }

  async updateById(
    id: EntityId,
    data: Partial<IRoleModel>
  ): Promise<IRoleModel> {
    const role = await RoleMongo.findByIdAndUpdate(id, data, {
      new: true,
    }).populate('permissions');
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(role);
  }

  async deleteById(id: EntityId): Promise<IRoleModel> {
    const result = await RoleMongo.findByIdAndDelete(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.DELETE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async findByField(
    field: keyof IRoleModel,
    value: any
  ): Promise<IRoleModel[]> {
    const roles = await RoleMongo.find({ [field]: value }).populate(
      'permissions'
    );
    return roles.map(role => this.toEntity(role));
  }

  async findByFields(fields: Partial<IRoleModel>): Promise<IRoleModel[]> {
    const roles = await RoleMongo.find(fields).populate('permissions');
    return roles.map(role => this.toEntity(role));
  }

  async findByName(name: string): Promise<IRoleModel> {
    const role = await RoleMongo.findOne({ name }).populate('permissions');
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.toEntity(role);
  }

  async findSystemRoles(): Promise<IRoleModel[]> {
    const roles = await RoleMongo.find({ isSystem: true }).populate(
      'permissions'
    );
    return roles.map(role => this.toEntity(role));
  }

  async findActive(): Promise<IRoleModel[]> {
    const roles = await RoleMongo.find({ isActive: true }).populate(
      'permissions'
    );
    return roles.map(role => this.toEntity(role));
  }

  async assignPermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel> {
    const role = await RoleMongo.findByIdAndUpdate(
      roleId,
      { $addToSet: { permissions: permissionId } },
      { new: true }
    ).populate('permissions');
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(role);
  }

  async removePermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel> {
    const role = await RoleMongo.findByIdAndUpdate(
      roleId,
      { $pull: { permissions: permissionId } },
      { new: true }
    ).populate('permissions');
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(role);
  }

  async getPermissionById(permissionId: EntityId): Promise<any> {
    const PermissionMongo =
      require('../../models/mongodb/PermissionMongoModel').default;
    const permission = await PermissionMongo.findById(permissionId);
    return permission;
  }

  async getAllPermissions(): Promise<any[]> {
    const PermissionMongo =
      require('../../models/mongodb/PermissionMongoModel').default;
    const permissions = await PermissionMongo.find({ isActive: true });
    return permissions;
  }

  async addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel> {
    const role = await RoleMongo.findByIdAndUpdate(
      roleId,
      { $addToSet: { permissions: { $each: permissionIds } } },
      { new: true }
    ).populate('permissions');
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(role);
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel> {
    const role = await RoleMongo.findByIdAndUpdate(
      roleId,
      { $pull: { permissions: { $in: permissionIds } } },
      { new: true }
    ).populate('permissions');
    if (!role) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.UPDATE_BY_ID_ERROR.en
      );
    }
    return this.toEntity(role);
  }

  async countAll(): Promise<number> {
    return RoleMongo.countDocuments();
  }

  async deleteAll(): Promise<number> {
    const result = await RoleMongo.deleteMany({});
    return result.deletedCount || 0;
  }

  private toEntity(mongoDoc: IRoleMongo): IRoleModel {
    return {
      _id: mongoDoc._id,
      name: mongoDoc.name,
      description: mongoDoc.description,
      permissions: mongoDoc.permissions,
      isSystem: mongoDoc.isSystem,
      isActive: mongoDoc.isActive,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    };
  }
}
