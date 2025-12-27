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
    const mongoUri = this.connectionConfig.connectionString;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second between retries
    const connectionTimeout = 15000; // 15 seconds timeout

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get MongoDB URI from injected connection config
        const connectionPromise = mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: connectionTimeout,
          socketTimeoutMS: connectionTimeout,
          connectTimeoutMS: connectionTimeout,
          maxPoolSize: 10,
          retryWrites: true,
          retryReads: true,
        });

        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(`Connection timeout after ${connectionTimeout}ms`)
              ),
            connectionTimeout
          );
        });

        await Promise.race([connectionPromise, timeoutPromise]);
        this.isConnectedFlag = true;

        // MongoDB adapter handles its own logging with its own business logic
        const dbName = this.extractDatabaseName(mongoUri);
        console.log(
          RepositoryConstants.DATABASE_ADAPTER.MONGODB.CONNECT_SUCCESS.en.replace(
            '{dbName}',
            dbName
          )
        );
        return; // Success, exit retry loop
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        if (isLastAttempt) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.error(
            '\x1b[31m❌ MongoDB connection failed after all retries:\x1b[0m',
            `\x1b[31m${errorMsg}\x1b[0m`
          );
          console.log(
            RepositoryConstants.DATABASE_ADAPTER.MONGODB.CONNECT_FAILED.en
          );
          // Throw error to trigger application shutdown
          throw new ApplicationError(
            `Database connection failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
            500
          );
        } else {
          console.warn(
            `⚠️ MongoDB connection attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
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
      const disconnectErrorMsg =
        _error instanceof Error ? _error.message : String(_error);
      console.error(
        '\x1b[31mMongoDB disconnection error:\x1b[0m',
        `\x1b[31m${disconnectErrorMsg}\x1b[0m`
      );
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
