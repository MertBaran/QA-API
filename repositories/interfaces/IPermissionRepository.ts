import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
// EntityId kullanılmıyor, kaldırıldı
import { IRepository } from './IRepository';

export interface IPermissionRepository extends IRepository<IPermissionModel> {
  findByName(name: string): Promise<IPermissionModel | null>;
  findByResource(resource: string): Promise<IPermissionModel[]>;
  findByCategory(category: string): Promise<IPermissionModel[]>;
  findActive(): Promise<IPermissionModel[]>;
}
