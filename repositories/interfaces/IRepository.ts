import { EntityId } from '../../types/database';

export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: EntityId): Promise<T | null>;
  findAll(): Promise<T[]>;
  updateById(id: EntityId, data: Partial<T>): Promise<T | null>;
  deleteById(id: EntityId): Promise<T | null>;
} 