import { injectable, inject } from 'tsyringe';
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
import { IQueueProvider } from './contracts/IQueueProvider';
import { QueueBasedNotificationManager } from './managers/QueueBasedNotificationManager';
import { MultiChannelNotificationManager } from './managers/MultiChannelNotificationManager';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import { container } from 'tsyringe';

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
  NOTIFICATION_TECHNOLOGY: 'queue' | 'direct' | 'hybrid';
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
    NOTIFICATION_TECHNOLOGY: config.NOTIFICATION_TECHNOLOGY,
  };

  return maskSensitiveData(stringConfig);
};

@injectable()
export class BootstrapService {
  private config: ParsedConfiguration | null = null;

  public async bootstrap(): Promise<ParsedConfiguration> {
    if (this.config) {
      return this.config;
    }

    // 1. Detect environment
    const environment = this.detectEnvironment();
    //console.log(`🔍 Bootstrap: Detected environment: ${environment}`);

    // 2. Load configuration file
    const configPath = this.getConfigPath(environment);

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

    // 6. Initialize queue-based services if needed
    await this.initializeQueueServices();

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

  private async initializeQueueServices(): Promise<void> {
    try {
      const queueProvider = container.resolve<IQueueProvider>('IQueueProvider');
      const logger = container.resolve<ILoggerProvider>('ILoggerProvider');

      // Notification technology kontrol et
      const notificationTechnology =
        this.config?.NOTIFICATION_TECHNOLOGY || 'direct';

      if (notificationTechnology === 'queue') {
        // RabbitMQ bağlantısını ve notification sistemini başlat
        await queueProvider.connect();

        const notificationManager = new QueueBasedNotificationManager(
          queueProvider,
          container.resolve('IUserRepository'),
          logger
        );

        await notificationManager.initialize();
        await notificationManager.startConsumer();

        // Container'da notification service'i güncelle
        container.registerSingleton(
          'INotificationService',
          QueueBasedNotificationManager
        );

        logger.info('🚀 Queue-based notification system ready', {
          rabbitmq: 'connected',
          queues: ['notifications', 'notifications.dlq'],
          exchanges: ['notification.exchange', 'notification.dlx'],
          consumer: 'started',
        });
      } else if (notificationTechnology === 'hybrid') {
        // RabbitMQ bağlantısını başlat (smart manager için gerekli)
        await queueProvider.connect();

        // Smart notification manager zaten container'da register edilmiş
        logger.info('🧠 Smart notification system ready', {
          strategy: 'hybrid',
          features: [
            'auto-strategy-selection',
            'load-balancing',
            'priority-based-routing',
          ],
          rabbitmq: 'connected',
        });
      } else {
        // Direct notification sistemi için MultiChannelNotificationManager kullan
        container.registerSingleton(
          'INotificationService',
          MultiChannelNotificationManager
        );

        logger.info('⚡ Direct notification system active', {
          channels: ['email', 'sms', 'push', 'webhook'],
        });
      }
    } catch (error) {
      const logger = container.resolve<ILoggerProvider>('ILoggerProvider');
      logger.error('Failed to initialize queue services', {
        error: (error as Error).message,
      });
      // Queue başlatılamazsa uygulama çalışmaya devam eder
    }
  }
}
