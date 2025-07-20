import { injectable } from 'tsyringe';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import {
  ConfigurationSchema,
  Configuration,
  ValidationResult,
  ENVIRONMENT_CONFIG_MAP,
  EnvironmentType,
  maskSensitiveData,
  parseNumericConfig,
} from './contracts/ConfigurationSchema';

// Extended configuration with parsed numeric values
export interface ParsedConfiguration
  extends Omit<
    Configuration,
    'PORT' | 'REDIS_PORT' | 'JWT_COOKIE' | 'SMTP_PORT' | 'RESET_PASSWORD_EXPIRE'
  > {
  PORT: number;
  REDIS_PORT: number;
  JWT_COOKIE: number;
  SMTP_PORT: number;
  RESET_PASSWORD_EXPIRE: number;
  NODE_ENV: EnvironmentType;
}

// Mask sensitive data for parsed configuration
const maskParsedConfig = (config: ParsedConfiguration) => {
  const stringConfig: Configuration = {
    ...config,
    PORT: config.PORT.toString(),
    REDIS_PORT: config.REDIS_PORT.toString(),
    JWT_COOKIE: config.JWT_COOKIE.toString(),
    SMTP_PORT: config.SMTP_PORT.toString(),
    RESET_PASSWORD_EXPIRE: config.RESET_PASSWORD_EXPIRE.toString(),
  };

  return maskSensitiveData(stringConfig);
};

@injectable()
export class BootstrapService {
  private config: ParsedConfiguration | null = null;

  public bootstrap(): ParsedConfiguration {
    if (this.config) {
      return this.config;
    }

    // 1. Detect environment
    const environment = this.detectEnvironment();
    console.log(`🔍 Bootstrap: Detected environment: ${environment}`);

    // 2. Load configuration file
    const configPath = this.getConfigPath(environment);
    console.log(`📂 Bootstrap: Loading config from: ${configPath}`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    // 3. Load and validate configuration
    const result = this.loadAndValidateConfig(configPath);

    if (!result.success || !result.data) {
      throw new Error(
        `Configuration validation failed: ${result.errors?.join(', ')}`
      );
    }

    // 4. Parse numeric values
    this.config = parseNumericConfig(result.data) as ParsedConfiguration;

    // 5. Log configuration summary
    const maskedConfig = maskParsedConfig(this.config);
    console.log(`✅ Bootstrap: Environment: ${this.config.NODE_ENV}`);
    if (maskedConfig.REDIS_URL) {
      console.log(`🔧 Bootstrap: Redis URL: ${maskedConfig.REDIS_URL}`);
    } else {
      console.log(`🔧 Bootstrap: Redis: localhost:${this.config.REDIS_PORT}`);
    }

    return this.config;
  }

  private detectEnvironment(): EnvironmentType {
    const nodeEnv = process.env['NODE_ENV'];

    if (!nodeEnv) {
      throw new Error('NODE_ENV environment variable is required');
    }

    if (!(nodeEnv in ENVIRONMENT_CONFIG_MAP)) {
      throw new Error(
        `Invalid NODE_ENV: ${nodeEnv}. Must be one of: ${Object.keys(
          ENVIRONMENT_CONFIG_MAP
        ).join(', ')}`
      );
    }

    return nodeEnv as EnvironmentType;
  }

  private getConfigPath(environment: EnvironmentType): string {
    const configFile = ENVIRONMENT_CONFIG_MAP[environment];
    return path.resolve(process.cwd(), `./config/env/${configFile}`);
  }

  private loadAndValidateConfig(configPath: string): ValidationResult {
    try {
      // Load environment variables from file
      const result = dotenv.config({ path: configPath });

      if (result.error) {
        return {
          success: false,
          errors: [`Failed to load config file: ${result.error.message}`],
        };
      }

      // Validate configuration
      const validationResult = ConfigurationSchema.safeParse(process.env);

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(
          err => `${err.path.join('.')}: ${err.message}`
        );

        return {
          success: false,
          errors,
        };
      }

      return {
        success: true,
        data: validationResult.data,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Unexpected error during configuration loading: ${error}`],
      };
    }
  }

  public getConfig(): ParsedConfiguration {
    if (!this.config) {
      throw new Error(
        'Configuration not bootstrapped. Call bootstrap() first.'
      );
    }
    return this.config;
  }

  public getEnvironment(): EnvironmentType {
    return this.getConfig()['NODE_ENV'] as EnvironmentType;
  }

  public isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  public isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  public isTest(): boolean {
    return this.getEnvironment() === 'test';
  }

  public isDocker(): boolean {
    return this.getEnvironment() === 'docker';
  }
}
