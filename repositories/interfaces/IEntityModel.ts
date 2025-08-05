export interface IEntityModel<T> {
  create(data: Partial<T>): Promise<any>;
  findById(id: string): any;
  find(query?: any): any;
  findByIdAndUpdate(id: string, data: Partial<T>, options?: any): Promise<any>;
  findByIdAndDelete(id: string): Promise<any>;
  countDocuments(filter?: any): Promise<number>;
  deleteMany(filter?: any): Promise<any>;
  findOne(query: any): Promise<any>;
  select?(fields: string): any;
  populate?(path: string, select?: string): any;
}
