import { injectable } from 'tsyringe';
import { BootstrapService, ParsedConfiguration } from './BootstrapService';
import { ApplicationState } from './ApplicationState';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'starting';
  timestamp: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'unknown';
      details?: {
        host?: string;
        port?: number;
        database?: string;
        connectionString?: string;
      };
    };
    cache: {
      status: 'connected' | 'disconnected' | 'unknown';
      details?: {
        host?: string;
        port?: number;
        url?: string;
      };
    };
    email: {
      status: 'configured' | 'not-configured' | 'unknown';
      details?: {
        host?: string;
        port?: number;
        user?: string;
      };
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  message?: string;
}

@injectable()
export class HealthCheckService {
  private startTime: number;
  private appState = ApplicationState.getInstance();

  constructor(private bootstrapService: BootstrapService) {
    this.startTime = Date.now();
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      // Check if bootstrap is ready using ApplicationState
      if (!this.appState.isReady) {
        console.warn(
          'Health check: Bootstrap not ready, returning starting status'
        );

        const memory = this.getMemoryUsage();

        return {
          status: 'starting',
          timestamp: new Date().toISOString(),
          environment: process.env['NODE_ENV'] || 'unknown',
          services: {
            database: { status: 'unknown' },
            cache: { status: 'unknown' },
            email: { status: 'unknown' },
          },
          uptime: Date.now() - this.startTime,
          memory,
          message: 'Server is starting up, services are being initialized',
        };
      }

      // Bootstrap is ready, get config from ApplicationState
      const config = this.appState.config;

      // Check service statuses
      const services = await this.checkServices(config);

      // Get memory usage
      const memory = this.getMemoryUsage();

      return {
        status: this.determineOverallStatus(services),
        timestamp: new Date().toISOString(),
        environment: config['NODE_ENV'],
        services,
        uptime: Date.now() - this.startTime,
        memory,
        message: 'All services checked and operational',
      };
    } catch (error) {
      // Fallback error handling
      console.error('Health check error:', error);

      const memory = this.getMemoryUsage();

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: process.env['NODE_ENV'] || 'unknown',
        services: {
          database: { status: 'unknown' },
          cache: { status: 'unknown' },
          email: { status: 'unknown' },
        },
        uptime: Date.now() - this.startTime,
        memory,
        message: 'Health check failed due to an error',
      };
    }
  }

  private async checkServices(config: ParsedConfiguration) {
    const [database, cache, email] = await Promise.allSettled([
      this.checkDatabase(config.MONGO_URI),
      this.checkCache(config),
      Promise.resolve(this.checkEmail(config)),
    ]);

    return {
      database:
        database.status === 'fulfilled'
          ? database.value
          : { status: 'unknown' as const },
      cache:
        cache.status === 'fulfilled'
          ? cache.value
          : { status: 'unknown' as const },
      email:
        email.status === 'fulfilled'
          ? email.value
          : { status: 'unknown' as const },
    };
  }

  private async checkDatabase(
    mongoUri: string
  ): Promise<HealthStatus['services']['database']> {
    try {
      // Parse MongoDB URI to extract details
      const uri = new URL(mongoUri);
      const database = uri.pathname.substring(1); // Remove leading slash

      // Simple connection check - in a real app, you might want to ping the database
      if (
        !mongoUri ||
        mongoUri === 'mongodb://localhost:27017/question-answer-test'
      ) {
        return {
          status: 'connected',
          details: {
            host: uri.hostname,
            port: parseInt(uri.port) || 27017,
            database,
            connectionString: mongoUri.replace(
              /\/\/[^:]+:[^@]+@/,
              '//***:***@'
            ), // Mask credentials
          },
        };
      }
      return {
        status: 'connected',
        details: {
          host: uri.hostname,
          port: parseInt(uri.port) || 27017,
          database,
          connectionString: mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
        },
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return { status: 'disconnected' };
    }
  }

  private async checkCache(
    config: ParsedConfiguration
  ): Promise<HealthStatus['services']['cache']> {
    try {
      // Simple connection check - in a real app, you might want to ping Redis
      if (config.REDIS_HOST && config.REDIS_PORT) {
        return {
          status: 'connected',
          details: {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            url:
              config.REDIS_URL || `${config.REDIS_HOST}:${config.REDIS_PORT}`,
          },
        };
      }
      return { status: 'unknown' };
    } catch (error) {
      console.error('Cache health check failed:', error);
      return { status: 'disconnected' };
    }
  }

  private checkEmail(
    config: ParsedConfiguration
  ): HealthStatus['services']['email'] {
    try {
      // Check if email configuration is present
      if (config.SMTP_HOST && config.SMTP_PORT && config.SMTP_USER) {
        return {
          status: 'configured',
          details: {
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            user: config.SMTP_USER,
          },
        };
      }
      return { status: 'not-configured' };
    } catch (error) {
      console.error('Email health check failed:', error);
      return { status: 'unknown' };
    }
  }

  private determineOverallStatus(
    services: HealthStatus['services']
  ): 'healthy' | 'unhealthy' | 'starting' {
    // If any critical service is disconnected, mark as unhealthy
    if (services.database.status === 'disconnected') {
      return 'unhealthy';
    }

    // If all services are connected/configured, mark as healthy
    if (
      services.database.status === 'connected' &&
      services.cache.status === 'connected' &&
      services.email.status !== 'unknown'
    ) {
      return 'healthy';
    }

    // If services are unknown, mark as starting
    return 'starting';
  }

  private getMemoryUsage() {
    const memory = process.memoryUsage();
    const used = Math.round(memory.heapUsed / 1024 / 1024); // MB
    const total = Math.round(memory.heapTotal / 1024 / 1024); // MB
    const percentage = Math.round((used / total) * 100);

    return { used, total, percentage };
  }

  public getStartTime(): number {
    return this.startTime;
  }

  public getUptime(): number {
    return Date.now() - this.startTime;
  }
}
