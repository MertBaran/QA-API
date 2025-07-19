export interface IDataSource<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  updateById(id: string, data: Partial<T>): Promise<T | null>;
  deleteById(id: string): Promise<T | null>;
  countAll(): Promise<number>;
  deleteAll(): Promise<number>;
} 