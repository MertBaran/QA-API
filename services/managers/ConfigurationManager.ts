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

@injectable()
export class ConfigurationManager implements IConfigurationService {
  private config: EnvironmentConfig;
  private environmentProvider: IEnvironmentProvider;

  constructor() {
    this.environmentProvider = container.resolve<IEnvironmentProvider>(
      'IEnvironmentProvider'
    );

    // EnvironmentProvider zaten config dosyasını yükledi, sadece config'i oluştur
    this.config = this.loadConfiguration();
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
      exceptionTracking: {
        dsn: this.environmentProvider.getEnvironmentVariable(
          'EXCEPTION_TRACKING_DSN',
          'YOUR_EXCEPTION_TRACKING_DSN_HERE'
        ),
        environment: this.environmentProvider.getEnvironment(),
        release: this.environmentProvider.getEnvironmentVariable(
          'APP_VERSION',
          '1.0.0'
        ),
        tracesSampleRate: this.isProduction() ? 0.1 : 1.0,
        profilesSampleRate: this.isProduction() ? 0.1 : 1.0,
        sampleRate: this.isProduction() ? 0.1 : 1.0,
      },
      fileLogging: {
        enabled: this.environmentProvider.getEnvironmentVariableAsBoolean(
          'FILE_LOGGING_ENABLED',
          true
        ),
        basePath: this.environmentProvider.getEnvironmentVariable(
          'FILE_LOGGING_BASE_PATH',
          '../qa-api-logs'
        ),
        version: this.environmentProvider.getEnvironmentVariable(
          'APP_VERSION',
          '1.0.0'
        ),
        environment: this.environmentProvider.getEnvironment(),
      },
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

  public getExceptionTrackingConfig(): EnvironmentConfig['exceptionTracking'] {
    return this.config.exceptionTracking;
  }

  public getFileLoggingConfig(): EnvironmentConfig['fileLogging'] {
    return this.config.fileLogging;
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
