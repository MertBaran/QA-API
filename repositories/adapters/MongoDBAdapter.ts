import mongoose from 'mongoose';
import { IDatabaseAdapter } from './IDatabaseAdapter';
import { MongoDBIdAdapter } from '../../types/database';
import CustomError from '../../helpers/error/CustomError';
import { injectable, inject } from 'tsyringe';
import { DatabaseConnectionConfig } from '../../services/contracts/IConfigurationService';

@injectable()
export class MongoDBAdapter implements IDatabaseAdapter {
  private isConnectedFlag = false;
  private idAdapter: MongoDBIdAdapter;
  private connectionConfig: DatabaseConnectionConfig;

  constructor(
    @inject('IDatabaseConnectionConfig')
    connectionConfig: DatabaseConnectionConfig
  ) {
    this.idAdapter = new MongoDBIdAdapter();
    this.connectionConfig = connectionConfig;
  }

  private extractDatabaseName(mongoUri: string): string {
    try {
      if (mongoUri.includes('mongodb+srv://')) {
        return mongoUri.split('/')[3]?.split('?')[0] || 'unknown';
      } else {
        return mongoUri.split('/').pop()?.split('?')[0] || 'unknown';
      }
    } catch (_error) {
      return 'unknown';
    }
  }

  async connect(): Promise<void> {
    try {
      // Get MongoDB URI from injected connection config
      const mongoUri = this.connectionConfig.connectionString;

      await mongoose.connect(mongoUri);
      this.isConnectedFlag = true;

      // MongoDB adapter handles its own logging with its own business logic
      const dbName = this.extractDatabaseName(mongoUri);
      console.log(`🔗 MongoDB connected successfully to database: ${dbName}`);
    } catch (_error) {
      console.log('MongoDB connection failed');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnectedFlag = false;
      console.log('MongoDB disconnected successfully');
    } catch (_error) {
      console.error('MongoDB disconnection error:', _error);
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
