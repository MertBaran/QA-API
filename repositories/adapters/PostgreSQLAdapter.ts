import { IDatabaseAdapter } from './IDatabaseAdapter';
import { PostgreSQLIdAdapter } from '../../types/database';
import CustomError from '../../helpers/error/CustomError';

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
      console.log('PostgreSQL connected successfully');
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      throw new CustomError('Database error in PostgreSQLAdapter.connect', 500);
    }
  }

  async disconnect(): Promise<void> {
    try {
      // if (this.client) {
      //   await this.client.end();
      // }
      this.isConnectedFlag = false;
      console.log('PostgreSQL disconnected successfully');
    } catch (error) {
      console.error('PostgreSQL disconnection error:', error);
      throw new CustomError('Database error in PostgreSQLAdapter.disconnect', 500);
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  getIdAdapter(): PostgreSQLIdAdapter {
    return this.idAdapter;
  }
} 