import { EntityId } from '../../types/database';

export interface IBaseModel {
  _id?: EntityId;
  createdAt?: Date;
  updatedAt?: Date;
} 