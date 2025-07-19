import { Model } from "mongoose";
import { IEntityModel } from "../interfaces/IEntityModel";
import CustomError from '../../helpers/error/CustomError';

export class MongooseModelAdapter<T> implements IEntityModel<T> {
  constructor(private readonly model: Model<T>) {}

  create(data: Partial<T>) {
    try {
      return this.model.create(data);
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.create', 500);
    }
  }
  findById(id: string) {
    try {
      return this.model.findById(id);
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.findById', 500);
    }
  }
  find(query?: any) {
    try {
      return this.model.find(query);
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.find', 500);
    }
  }
  findByIdAndUpdate(id: string, data: Partial<T>, options?: any) {
    try {
      return this.model.findByIdAndUpdate(id, data, options);
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.findByIdAndUpdate', 500);
    }
  }
  findByIdAndDelete(id: string) {
    try {
      return this.model.findByIdAndDelete(id);
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.findByIdAndDelete', 500);
    }
  }
  countDocuments() {
    try {
      return this.model.countDocuments();
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.countDocuments', 500);
    }
  }
  deleteMany(filter?: any) {
    try {
      return this.model.deleteMany(filter);
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.deleteMany', 500);
    }
  }
  findOne(query: any) {
    try {
      return this.model.findOne(query);
    } catch (err) {
      throw new CustomError('Database error in MongooseModelAdapter.findOne', 500);
    }
  }
  select(fields: string) {
    // Mongoose Model'de select doğrudan yok, query objesinde var
    // Burada sadece örnek olması için, gerçek kullanımda query döndürülmeli
    return this.model as any;
  }
  populate(path: string, select?: string) {
    // Mongoose Model'de populate doğrudan yok, query objesinde var
    // Burada sadece örnek olması için, gerçek kullanımda query döndürülmeli
    return this.model as any;
  }
} 