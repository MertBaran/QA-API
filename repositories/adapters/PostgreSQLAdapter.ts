import { Pool } from 'pg';
import { IDatabaseAdapter } from './IDatabaseAdapter';
import { PostgreSQLIdAdapter } from '../../types/database';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import { injectable, inject } from 'tsyringe';
import { DatabaseConnectionConfig } from '../../services/contracts/IConfigurationService';

@injectable()
export class PostgreSQLAdapter implements IDatabaseAdapter {
  private isConnectedFlag = false;
  private pool: Pool | null = null;
  private idAdapter: PostgreSQLIdAdapter;
  private connectionConfig: DatabaseConnectionConfig;

  constructor(
    @inject('IDatabaseConnectionConfig')
    connectionConfig: DatabaseConnectionConfig
  ) {
    this.idAdapter = new PostgreSQLIdAdapter();
    this.connectionConfig = connectionConfig;
  }

  async connect(): Promise<void> {
    try {
      const connStr = this.connectionConfig.connectionString;
      const connStrMasked =
        typeof connStr === 'string'
          ? connStr.replace(/postgresql:\/\/[^:]+:[^@]+@/i, 'postgresql://***:***@')
          : String(connStr);
      const useSSL =
        typeof connStr === 'string' &&
        (connStr.includes('sslmode=require') || connStr.includes('sslmode=verify'));
      this.pool = new Pool({
        connectionString: connStr,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
      });

      // Recommended by pg docs: handle idle client errors
      this.pool.on('error', (err: any) => {
        console.error('❌ PostgreSQL pool error:', {
          message: err?.message,
          code: err?.code,
          errno: err?.errno,
          syscall: err?.syscall,
          address: err?.address,
          port: err?.port,
          connectionString: connStrMasked,
        });
      });

      const client = await this.pool.connect();
      client.release();

      this.isConnectedFlag = true;
      console.log(
        RepositoryConstants.DATABASE_ADAPTER.POSTGRESQL.CONNECT_SUCCESS.en
      );
    } catch (error) {
      const err: any = error;
      const connStr = this.connectionConfig?.connectionString;
      const connStrMasked =
        typeof connStr === 'string'
          ? connStr.replace(/postgresql:\/\/[^:]+:[^@]+@/i, 'postgresql://***:***@')
          : String(connStr);
      console.error('❌ PostgreSQL connection error:', {
        message: err?.message,
        name: err?.name,
        code: err?.code,
        errno: err?.errno,
        syscall: err?.syscall,
        address: err?.address,
        port: err?.port,
        stack: err?.stack,
        connectionString: connStrMasked,
      });
      throw new ApplicationError(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
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
    return this.isConnectedFlag && this.pool !== null;
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    } catch {
      return false;
    }
  }

  getIdAdapter(): PostgreSQLIdAdapter {
    return this.idAdapter;
  }

  /** Migration ve seed işlemleri için pool erişimi */
  getPool(): Pool {
    if (!this.pool) {
      throw new ApplicationError(
        'PostgreSQL pool is not initialized. Call connect() first.',
        500
      );
    }
    return this.pool;
  }
}
