import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
// EntityId kullanılmıyor, kaldırıldı
import { IDataSource } from './IDataSource';

export interface IPermissionDataSource extends IDataSource<IPermissionModel> {
  findByName(name: string): Promise<IPermissionModel | null>;
  findByResource(resource: string): Promise<IPermissionModel[]>;
  findByCategory(category: string): Promise<IPermissionModel[]>;
  findActive(): Promise<IPermissionModel[]>;
}
