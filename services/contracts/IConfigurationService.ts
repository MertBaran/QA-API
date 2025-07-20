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
}

export interface DatabaseConnectionConfig {
  connectionString: string;
}

export interface CacheConnectionConfig {
  url?: string;
  host: string;
  port: number;
}

export interface IConfigurationService {
  getConfig(): EnvironmentConfig;
  getEnvironment(): string;
  getDatabaseConnectionConfig(): DatabaseConnectionConfig;
  getCacheConnectionConfig(): CacheConnectionConfig;
  isProduction(): boolean;
  isTest(): boolean;
  isDevelopment(): boolean;
  logEnvironmentInfo(): void;
  performStartupChecks(): Promise<void>;
}
