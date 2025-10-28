import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { EntityId } from '../../types/database';

export interface IPermissionService {
  create(permission: Partial<IPermissionModel>): Promise<IPermissionModel>;
  findById(id: EntityId): Promise<IPermissionModel>;
  findByName(name: string): Promise<IPermissionModel>;
  findAll(): Promise<IPermissionModel[]>;
  updateById(
    id: EntityId,
    data: Partial<IPermissionModel>
  ): Promise<IPermissionModel>;
  deleteById(id: EntityId): Promise<IPermissionModel>;
  findByResource(resource: string): Promise<IPermissionModel[]>;
  findByCategory(category: string): Promise<IPermissionModel[]>;
  getActivePermissions(): Promise<IPermissionModel[]>;
}
