import { injectable } from 'tsyringe';
import { IEnvironmentProvider } from '../contracts/IEnvironmentProvider';
import {
  ObjectStorageConfig,
  ObjectStorageProvider,
} from '../contracts/object-storage/ObjectStorageConfig';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

@injectable()
export class EnvironmentProvider implements IEnvironmentProvider {
  private environment: string;

  constructor() {
    this.environment = this.detectEnvironment();
    this.loadEnvironmentConfig();
  }

  private detectEnvironment(): string {
    // Get environment from NODE_ENV first, then command line argument
    let nodeEnv = process.env['NODE_ENV'];
    const envArg = process.argv[2]; // npm start dev/test/prod

    // If NODE_ENV is set (by cross-env), use it
    if (nodeEnv) {
      if (nodeEnv === 'dev' || nodeEnv === 'development') {
        nodeEnv = 'development';
      } else if (nodeEnv === 'test') {
        nodeEnv = 'test';
      } else if (nodeEnv === 'prod' || nodeEnv === 'production') {
        nodeEnv = 'production';
      }
    }
    // If command line argument is provided, override NODE_ENV
    else if (envArg) {
      if (envArg === 'dev' || envArg === 'development') {
        nodeEnv = 'development';
      } else if (envArg === 'test') {
        nodeEnv = 'test';
      } else if (envArg === 'prod' || envArg === 'production') {
        nodeEnv = 'production';
      }
    }
    // Default to development if nothing is set
    else {
      nodeEnv = 'development';
    }

    // Set NODE_ENV for other parts of the application
    process.env['NODE_ENV'] = nodeEnv;

    return nodeEnv || 'development';
  }

  private loadEnvironmentConfig(): void {
    let envFile = 'config.env';

    if (this.environment === 'production') {
      envFile = 'config.env.prod';
    } else if (this.environment === 'development') {
      envFile = 'config.env.dev';
    } else if (this.environment === 'test') {
      envFile = 'config.env.test';
    } else if (this.environment === 'docker') {
      envFile = 'config.env.docker';
    } else {
      // Default to development config
      envFile = 'config.env.dev';
    }

    // Load the appropriate config file
    const configPath = path.resolve(process.cwd(), `./config/env/${envFile}`);
    console.log(`📂 Loading config from: ${configPath}`);

    // Check if file exists
    if (!fs.existsSync(configPath)) {
      console.error(`❌ Config file does not exist: ${configPath}`);
      return;
    }

    // override: true - config dosyası env değişkenlerini her zaman ezsin
    const result = dotenv.config({ path: configPath, override: true });

    if (result.error) {
      console.error(`❌ Error loading config file: ${result.error.message}`);
    } else {
      console.log(`✅ Successfully loaded config file: ${envFile}`);
    }
  }

  public getEnvironment(): string {
    return this.environment;
  }

  public getEnvironmentVariable(
    key: string,
    defaultValue: string = ''
  ): string {
    return process.env[key] || defaultValue;
  }

  public getEnvironmentVariableAsNumber(
    key: string,
    defaultValue: number = 0
  ): number {
    const value = process.env[key];
    return value ? parseInt(value) : defaultValue;
  }

  public getEnvironmentVariableAsBoolean(
    key: string,
    defaultValue: boolean = false
  ): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;

    const lowerValue = value.toLowerCase();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
  }

  public isProduction(): boolean {
    return this.environment === 'production';
  }

  public isTest(): boolean {
    return this.environment === 'test';
  }

  public isDevelopment(): boolean {
    return this.environment === 'development';
  }

  public getObjectStorageConfig(): ObjectStorageConfig {
    const provider = this.getObjectStorageProvider();

    switch (provider) {
      case 'cloudflare-r2':
        return this.buildR2Config();
      default:
        throw new Error(`Desteklenmeyen object storage provider: ${provider}`);
    }
  }

  private getObjectStorageProvider(): ObjectStorageProvider {
    const provider = this.getEnvironmentVariable(
      'OBJECT_STORAGE_PROVIDER',
      'cloudflare-r2'
    ).toLowerCase() as ObjectStorageProvider;
    return provider;
  }

  private buildR2Config(): ObjectStorageConfig {
    const accountId = this.getEnvironmentVariable('R2_ACCOUNT_ID');
    const accessKeyId = this.getEnvironmentVariable('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.getEnvironmentVariable('R2_SECRET_ACCESS_KEY');
    const bucket = this.getEnvironmentVariable('R2_BUCKET');
    const endpoint = this.getEnvironmentVariable('R2_ENDPOINT');
    const publicBaseUrl = this.getEnvironmentVariable('R2_PUBLIC_BASE_URL', '');

    const missing: string[] = [];
    if (!accountId) missing.push('R2_ACCOUNT_ID');
    if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
    if (!bucket) missing.push('R2_BUCKET');
    if (!endpoint) missing.push('R2_ENDPOINT');

    if (missing.length > 0) {
      throw new Error(
        `Eksik Cloudflare R2 ortam değişkenleri: ${missing.join(', ')}`
      );
    }

    return {
      provider: 'cloudflare-r2',
      bucket,
      endpoint,
      credentials: {
        accountId,
        accessKeyId,
        secretAccessKey,
      },
      publicBaseUrl: publicBaseUrl || undefined,
    };
  }
}
