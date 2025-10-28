import { IDatabaseAdapter } from './IDatabaseAdapter';
import { PostgreSQLIdAdapter } from '../../types/database';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

export class PostgreSQLAdapter implements IDatabaseAdapter {
  private isConnectedFlag = false;
  private client: any; // PostgreSQL client
  private idAdapter: PostgreSQLIdAdapter;

  constructor() {
    this.idAdapter = new PostgreSQLIdAdapter();
  }

  async connect(): Promise<void> {
    try {
      // PostgreSQL connection logic would go here
      // const { Client } = require('pg');
      // this.client = new Client({
      //   connectionString: process.env.DATABASE_URL,
      // });
      // await this.client.connect();

      this.isConnectedFlag = true;
      console.log(
        RepositoryConstants.DATABASE_ADAPTER.POSTGRESQL.CONNECT_SUCCESS.en
      );
    } catch (error) {
      console.error('❌ PostgreSQL connection error:', error);
      throw new ApplicationError(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      // if (this.client) {
      //   await this.client.end();
      // }
      this.isConnectedFlag = false;
      console.log(
        RepositoryConstants.DATABASE_ADAPTER.POSTGRESQL.DISCONNECT_SUCCESS.en
      );
    } catch (error) {
      console.error('PostgreSQL disconnection error:', error);
      throw new ApplicationError(
        RepositoryConstants.DATABASE_ADAPTER.POSTGRESQL.DISCONNECT_ERROR.en,
        500
      );
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  getIdAdapter(): PostgreSQLIdAdapter {
    return this.idAdapter;
  }
}
