import { ObjectStorageConfig } from './object-storage/ObjectStorageConfig';

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  jwt: {
    secretKey: string;
    expire: string;
    cookie: number;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    appPass: string;
  };
  clientUrl: string;
  googleClientId: string;

  exceptionTracking: {
    dsn: string;
    environment: string;
    release: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
    sampleRate: number;
  };
  fileLogging: {
    enabled: boolean;
    basePath: string;
    version: string;
    environment: string;
  };
  objectStorage: {
    provider: ObjectStorageConfig['provider'];
    bucket: string;
    publicBaseUrl?: string;
  };
}

export interface DatabaseConnectionConfig {
  connectionString: string;
}

export interface CacheConnectionConfig {
  url?: string;
  host: string;
  port: number;
}

export interface ElasticsearchConnectionConfig {
  url: string;
  username?: string;
  password?: string;
  tlsEnabled: boolean;
  tlsSkipVerify: boolean;
  requestTimeout?: number;
  enabled: boolean;
}

export enum DatabaseType {
  MongoDB = 'mongodb',
  PostgreSQL = 'postgresql',
}

export interface IConfigurationService {
  getConfig(): EnvironmentConfig;
  getEnvironment(): string;
  getDatabaseConnectionConfig(): DatabaseConnectionConfig;
  getDatabaseType(): DatabaseType;
  getCacheConnectionConfig(): CacheConnectionConfig;
  getExceptionTrackingConfig(): EnvironmentConfig['exceptionTracking'];
  getFileLoggingConfig(): EnvironmentConfig['fileLogging'];
  getElasticsearchConfig(): ElasticsearchConnectionConfig;
  getObjectStorageConfig(): ObjectStorageConfig;
  isProduction(): boolean;
  isTest(): boolean;
  isDevelopment(): boolean;
  logEnvironmentInfo(): void;
  performStartupChecks(): Promise<void>;
}
