import { injectable, inject } from 'tsyringe';
import { IPermissionRepository } from './interfaces/IPermissionRepository';
import { IPermissionModel } from '../models/interfaces/IPermissionModel';
import { IPermissionDataSource } from './interfaces/IPermissionDataSource';
// EntityId kullanılmıyor, kaldırıldı
import { BaseRepository } from './base/BaseRepository';

@injectable()
export class PermissionRepository
  extends BaseRepository<IPermissionModel>
  implements IPermissionRepository
{
  constructor(
    @inject('IPermissionDataSource')
    private permissionDataSource: IPermissionDataSource
  ) {
    super(permissionDataSource);
  }

  async findByName(name: string): Promise<IPermissionModel | null> {
    return this.permissionDataSource.findByName(name);
  }

  async findByResource(resource: string): Promise<IPermissionModel[]> {
    return this.permissionDataSource.findByResource(resource);
  }

  async findByCategory(category: string): Promise<IPermissionModel[]> {
    return this.permissionDataSource.findByCategory(category);
  }

  async findActive(): Promise<IPermissionModel[]> {
    return this.permissionDataSource.findActive();
  }
}
