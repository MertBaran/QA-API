import { Model } from 'mongoose';
import { IEntityModel } from '../interfaces/IEntityModel';
import CustomError from '../../helpers/error/CustomError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

export class MongooseModelAdapter<T> implements IEntityModel<T> {
  constructor(private model: Model<T>) {}

  async create(data: Partial<T>): Promise<any> {
    try {
      return await this.model.create(data);
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.MONGOOSE_ADAPTER.CREATE_ERROR.en,
        500
      );
    }
  }

  async findById(id: string): Promise<any> {
    try {
      return await this.model.findById(id);
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.MONGOOSE_ADAPTER.FIND_BY_ID_ERROR.en,
        500
      );
    }
  }

  async find(query?: any): Promise<any[]> {
    try {
      return await this.model.find(query);
    } catch (_err) {
      throw new CustomError(RepositoryConstants.MONGOOSE_ADAPTER.FIND_ERROR.en, 500);
    }
  }

  async findByIdAndUpdate(
    id: string,
    data: Partial<T>,
    options?: any
  ): Promise<any> {
    try {
      return await this.model.findByIdAndUpdate(id, data, options);
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.MONGOOSE_ADAPTER.UPDATE_BY_ID_ERROR.en,
        500
      );
    }
  }

  async findByIdAndDelete(id: string): Promise<any> {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.MONGOOSE_ADAPTER.DELETE_BY_ID_ERROR.en,
        500
      );
    }
  }

  async countDocuments(): Promise<number> {
    try {
      return await this.model.countDocuments();
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.MONGOOSE_ADAPTER.COUNT_ALL_ERROR.en,
        500
      );
    }
  }

  async deleteMany(filter?: any): Promise<any> {
    try {
      return await this.model.deleteMany(filter);
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.MONGOOSE_ADAPTER.DELETE_ALL_ERROR.en,
        500
      );
    }
  }

  async findOne(query: any): Promise<any> {
    try {
      return await this.model.findOne(query);
    } catch (_err) {
      throw new CustomError(
        RepositoryConstants.MONGOOSE_ADAPTER.FIND_ERROR.en,
        500
      );
    }
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
