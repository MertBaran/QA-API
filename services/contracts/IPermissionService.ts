import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { EntityId } from '../../types/database';

export interface IPermissionService {
  create(permission: Partial<IPermissionModel>): Promise<IPermissionModel>;
  findById(id: EntityId): Promise<IPermissionModel | null>;
  findByName(name: string): Promise<IPermissionModel | null>;
  findAll(): Promise<IPermissionModel[]>;
  updateById(
    id: EntityId,
    data: Partial<IPermissionModel>
  ): Promise<IPermissionModel | null>;
  deleteById(id: EntityId): Promise<boolean>;
  findByResource(resource: string): Promise<IPermissionModel[]>;
  findByCategory(category: string): Promise<IPermissionModel[]>;
  getActivePermissions(): Promise<IPermissionModel[]>;
}
