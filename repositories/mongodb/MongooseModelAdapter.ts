import { Model } from 'mongoose';
import { IEntityModel } from '../interfaces/IEntityModel';
import CustomError from '../../infrastructure/error/CustomError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

export class MongooseModelAdapter<T> implements IEntityModel<T> {
  constructor(private model: Model<T>) {}

  async create(data: Partial<T>): Promise<any> {
    return await this.model.create(data);
  }

  async findById(id: string): Promise<any> {
    return await this.model.findById(id);
  }

  async find(query?: any): Promise<any[]> {
    return await this.model.find(query);
  }

  async findByIdAndUpdate(
    id: string,
    data: Partial<T>,
    options?: any
  ): Promise<any> {
    return await this.model.findByIdAndUpdate(id, data, options);
  }

  async findByIdAndDelete(id: string): Promise<any> {
    return await this.model.findByIdAndDelete(id);
  }

  async countDocuments(): Promise<number> {
    return await this.model.countDocuments();
  }

  async deleteMany(filter?: any): Promise<any> {
    return await this.model.deleteMany(filter);
  }

  async findOne(query: any): Promise<any> {
    return await this.model.findOne(query);
  }

  populate(_fields: string): any {
    // Mongoose Model'de populate doğrudan yok, query objesinde var
    // Burada sadece örnek olması için, gerçek kullanımda query döndürülmeli
    return this.model as any;
  }

  select(_fields: string): any {
    // Mongoose Model'de select doğrudan yok, query objesinde var
    // Burada sadece örnek olması için, gerçek kullanımda query döndürülmeli
    return this.model as any;
  }
}
