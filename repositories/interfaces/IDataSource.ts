export interface IDataSource<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  updateById(id: string, data: Partial<T>): Promise<T | null>;
  deleteById(id: string): Promise<T | null>;
  findByField(field: keyof T, value: any): Promise<T[]>;
  findByFields(fields: Partial<T>): Promise<T[]>;
  countAll(): Promise<number>;
  deleteAll(): Promise<number>;
}
