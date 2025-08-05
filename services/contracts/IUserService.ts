import { IUserModel } from '../../models/interfaces/IUserModel';
import { EntityId } from '../../types/database';

export interface UserFilters {
  search?: string;
  searchType?: 'contains' | 'starts_with' | 'ends_with' | 'exact';
  emailFilter?: 'all' | 'verified' | 'unverified';
  status?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  dateOperator?: 'after' | 'before' | 'between' | 'exact';
  lastLoginOperator?: 'all' | 'today' | 'this_week' | 'this_month' | 'never';
  isOnline?: boolean;
}

export interface UsersResponse {
  users: IUserModel[];
  total: number;
  page: number;
  limit: number;
}

export interface UserStats {
  total: number;
  active: number;
  blocked: number;
  online: number;
  newThisMonth: number;
}

export interface IUserService {
  findById(userId: EntityId): Promise<IUserModel | null>;
  findByEmail(email: string): Promise<IUserModel | null>;
  findByEmailWithPassword(email: string): Promise<IUserModel | null>;
  create(userData: Partial<IUserModel>): Promise<IUserModel>;
  updateById(
    userId: EntityId,
    data: Partial<IUserModel>
  ): Promise<IUserModel | null>;
  deleteById(userId: EntityId): Promise<boolean>;
  findAll(): Promise<IUserModel[]>;
  findActive(): Promise<IUserModel[]>;
  countAll(): Promise<number>;
}
