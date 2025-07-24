import { EntityId } from '../../types/database';

export interface IPermissionModel {
  _id: EntityId;
  name: string; // 'questions:create'
  description: string; // 'Create new questions'
  resource: string; // 'questions'
  action: string; // 'create'
  category?: string; // 'content', 'user', 'system'
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
