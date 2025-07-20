import { injectable } from 'tsyringe';
import { IEnvironmentProvider } from '../contracts/IEnvironmentProvider';
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
    // Get environment from command line argument or NODE_ENV
    const envArg = process.argv[2]; // npm start dev/test/prod
    let nodeEnv = process.env['NODE_ENV'];

    console.log(
      `🔍 Environment detection - Command line arg: ${envArg}, NODE_ENV: ${nodeEnv}`
    );

    // If command line argument is provided, use it to set NODE_ENV
    if (envArg) {
      if (envArg === 'dev' || envArg === 'development') {
        nodeEnv = 'development';
      } else if (envArg === 'test') {
        nodeEnv = 'test';
      } else if (envArg === 'prod' || envArg === 'production') {
        nodeEnv = 'production';
      }
      // Set NODE_ENV for other parts of the application
      process.env['NODE_ENV'] = nodeEnv;
    } else {
      // No argument means production (npm start without arguments)
      nodeEnv = 'production';
      process.env['NODE_ENV'] = 'production';
    }

    console.log(`🎯 Final environment: ${nodeEnv}`);
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

    // Read file content for debugging
    const fileContent = fs.readFileSync(configPath, 'utf8');
    console.log(
      `📄 Config file content preview: ${fileContent.substring(0, 200)}...`
    );

    const result = dotenv.config({ path: configPath });

    if (result.error) {
      console.error(`❌ Error loading config file: ${result.error.message}`);
    } else {
      console.log(`✅ Successfully loaded config file: ${envFile}`);
      console.log(`🔧 MONGO_URI: ${process.env['MONGO_URI']}`);
      console.log(`🔧 REDIS_URL: ${process.env['REDIS_URL']}`);
      console.log(`🔧 REDIS_HOST: ${process.env['REDIS_HOST']}`);
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

  public isProduction(): boolean {
    return this.environment === 'production';
  }

  public isTest(): boolean {
    return this.environment === 'test';
  }

  public isDevelopment(): boolean {
    return this.environment === 'development';
  }
}
