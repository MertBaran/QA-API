import mongoose from 'mongoose';
import { IDatabaseAdapter } from './IDatabaseAdapter';
import { MongoDBIdAdapter } from '../../types/database';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';
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
      console.log(
        RepositoryConstants.DATABASE_ADAPTER.MONGODB.CONNECT_SUCCESS.en.replace(
          '{dbName}',
          dbName
        )
      );
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      console.log(
        RepositoryConstants.DATABASE_ADAPTER.MONGODB.CONNECT_FAILED.en
      );
      // Throw error to trigger application shutdown
      throw new ApplicationError(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnectedFlag = false;
      console.log(
        RepositoryConstants.DATABASE_ADAPTER.MONGODB.DISCONNECT_SUCCESS.en
      );
    } catch (_error) {
      console.error('MongoDB disconnection error:', _error);
      throw new ApplicationError(
        RepositoryConstants.DATABASE_ADAPTER.MONGODB.DISCONNECT_ERROR.en,
        500
      );
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag && mongoose.connection.readyState === 1;
  }

  getIdAdapter(): MongoDBIdAdapter {
    return this.idAdapter;
  }
}
