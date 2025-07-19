import mongoose from 'mongoose';
import { IDatabaseAdapter } from './IDatabaseAdapter';
import { MongoDBIdAdapter } from '../../types/database';
import CustomError from '../../helpers/error/CustomError';

export class MongoDBAdapter implements IDatabaseAdapter {
  private isConnectedFlag = false;
  private idAdapter: MongoDBIdAdapter;

  constructor() {
    this.idAdapter = new MongoDBIdAdapter();
  }

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env["MONGO_URI"] || 'mongodb://localhost:27017/qa-platform';
      await mongoose.connect(mongoUri);
      this.isConnectedFlag = true;
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw new CustomError('Database error in MongoDBAdapter.connect', 500);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnectedFlag = false;
      console.log('MongoDB disconnected successfully');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw new CustomError('Database error in MongoDBAdapter.disconnect', 500);
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag && mongoose.connection.readyState === 1;
  }

  getIdAdapter(): MongoDBIdAdapter {
    return this.idAdapter;
  }
} 