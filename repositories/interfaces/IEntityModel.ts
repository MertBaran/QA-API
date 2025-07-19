export interface IEntityModel<T> {
  create(data: Partial<T>): Promise<any>;
  findById(id: string): Promise<any>;
  find(query?: any): Promise<any[]>;
  findByIdAndUpdate(id: string, data: Partial<T>, options?: any): Promise<any>;
  findByIdAndDelete(id: string): Promise<any>;
  countDocuments(): Promise<number>;
  deleteMany(filter?: any): Promise<any>;
  findOne(query: any): Promise<any>;
  select?(fields: string): any;
  populate?(path: string, select?: string): any;
} 