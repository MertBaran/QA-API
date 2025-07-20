import { injectable } from 'tsyringe';
import {
  IConfigurationService,
  EnvironmentConfig,
  DatabaseConnectionConfig,
  CacheConnectionConfig,
} from '../contracts/IConfigurationService';
import { container } from 'tsyringe';
import { ICacheProvider } from '../../infrastructure/cache/ICacheProvider';
import { IEnvironmentProvider } from '../contracts/IEnvironmentProvider';
import dotenv from 'dotenv';
import path from 'path';

@injectable()
export class ConfigurationManager implements IConfigurationService {
  private config: EnvironmentConfig;
  private environmentProvider: IEnvironmentProvider;

  constructor() {
    this.environmentProvider = container.resolve<IEnvironmentProvider>(
      'EnvironmentProvider'
    );

    // Load environment-specific configuration based on EnvironmentProvider's decision
    this.loadEnvironmentSpecificConfig();
    this.config = this.loadConfiguration();
  }

  private loadEnvironmentSpecificConfig(): void {
    const env = this.environmentProvider.getEnvironment();
    let envFile = 'config.env';

    if (env === 'production') {
      envFile = 'config.env.prod';
    } else if (env === 'development') {
      envFile = 'config.env.dev';
    } else if (env === 'test') {
      envFile = 'config.env.test';
    } else if (env === 'docker') {
      envFile = 'config.env.docker';
    } else {
      envFile = 'config.env.dev';
    }

    const configPath = path.resolve(process.cwd(), `./config/env/${envFile}`);
    console.log(
      `⚙️ ConfigurationManager loading config for ${env}: ${envFile}`
    );

    const result = dotenv.config({ path: configPath });
    if (result.error) {
      console.error(
        `❌ Error loading config in ConfigurationManager: ${result.error.message}`
      );
    } else {
      console.log(`✅ ConfigurationManager loaded: ${envFile}`);
      console.log(`🔧 MONGO_URI: ${process.env['MONGO_URI']}`);
      console.log(`🔧 REDIS_URL: ${process.env['REDIS_URL']}`);
      console.log(`🔧 REDIS_HOST: ${process.env['REDIS_HOST']}`);
    }
  }

  private loadConfiguration(): EnvironmentConfig {
    return {
      nodeEnv: this.environmentProvider.getEnvironment(),
      port: this.environmentProvider.getEnvironmentVariableAsNumber(
        'PORT',
        3000
      ),
      jwt: {
        secretKey: this.environmentProvider.getEnvironmentVariable(
          'JWT_SECRET_KEY',
          'default-secret'
        ),
        expire: this.environmentProvider.getEnvironmentVariable(
          'JWT_EXPIRE',
          '10m'
        ),
        cookie: this.environmentProvider.getEnvironmentVariableAsNumber(
          'JWT_COOKIE',
          10
        ),
      },
      smtp: {
        host: this.environmentProvider.getEnvironmentVariable(
          'SMTP_HOST',
          'smtp.gmail.com'
        ),
        port: this.environmentProvider.getEnvironmentVariableAsNumber(
          'SMTP_PORT',
          465
        ),
        user: this.environmentProvider.getEnvironmentVariable('SMTP_USER', ''),
        appPass: this.environmentProvider.getEnvironmentVariable(
          'SMTP_APP_PASS',
          ''
        ),
      },
      clientUrl: this.environmentProvider.getEnvironmentVariable(
        'CLIENT_URL',
        'http://localhost:3001'
      ),
      googleClientId: this.environmentProvider.getEnvironmentVariable(
        'GOOGLE_CLIENT_ID',
        ''
      ),
    };
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public getEnvironment(): string {
    return this.environmentProvider.getEnvironment();
  }

  public getDatabaseConnectionConfig(): DatabaseConnectionConfig {
    return {
      connectionString: this.environmentProvider.getEnvironmentVariable(
        'MONGO_URI',
        'mongodb://localhost:27017/qa-platform'
      ),
    };
  }

  public getCacheConnectionConfig(): CacheConnectionConfig {
    return {
      url: this.environmentProvider.getEnvironmentVariable('REDIS_URL'),
      host: this.environmentProvider.getEnvironmentVariable(
        'REDIS_HOST',
        'localhost'
      ),
      port: this.environmentProvider.getEnvironmentVariableAsNumber(
        'REDIS_PORT',
        6379
      ),
    };
  }

  public logEnvironmentInfo(): void {
    const env = this.getEnvironment();
    console.log(`🔧 Environment: ${env}`);

    // Business logic: Log additional info based on environment
    if (this.isProduction()) {
      console.log(`🚨 Running in PRODUCTION mode`);
    } else if (this.isTest()) {
      console.log(`🧪 Running in TEST mode`);
    } else {
      console.log(`🔧 Running in DEVELOPMENT mode`);
    }
  }

  public async performStartupChecks(): Promise<void> {
    // Business logic: Perform startup checks using abstract interfaces
    try {
      const cacheProvider = container.resolve<ICacheProvider>('CacheProvider');
      await cacheProvider.set(
        'startup-test',
        { timestamp: new Date().toISOString() },
        60
      );
      console.log('📦 Cache connection test completed');
    } catch (error) {
      console.warn('⚠️ Cache startup test failed:', error);
    }
  }

  public isProduction(): boolean {
    return this.environmentProvider.isProduction();
  }

  public isTest(): boolean {
    return this.environmentProvider.isTest();
  }

  public isDevelopment(): boolean {
    return this.environmentProvider.isDevelopment();
  }
}
