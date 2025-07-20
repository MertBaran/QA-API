import { injectable } from 'tsyringe';
import { BootstrapService, ParsedConfiguration } from './BootstrapService';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'unknown';
    cache: 'connected' | 'disconnected' | 'unknown';
    email: 'configured' | 'not-configured' | 'unknown';
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

@injectable()
export class HealthCheckService {
  private startTime: number;

  constructor(private bootstrapService: BootstrapService) {
    this.startTime = Date.now();
  }

  public async checkHealth(): Promise<HealthStatus> {
    const config = this.bootstrapService.getConfig();

    // Check service statuses
    const services = await this.checkServices(config);

    // Get memory usage
    const memory = this.getMemoryUsage();

    return {
      status: this.determineOverallStatus(services),
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      services,
      uptime: Date.now() - this.startTime,
      memory,
    };
  }

  private async checkServices(config: ParsedConfiguration) {
    return {
      database: await this.checkDatabase(config.MONGO_URI),
      cache: await this.checkCache(config),
      email: this.checkEmail(config),
    };
  }

  private async checkDatabase(
    mongoUri: string
  ): Promise<'connected' | 'disconnected' | 'unknown'> {
    try {
      // Basic URI validation
      if (!mongoUri || !mongoUri.includes('mongodb')) {
        return 'disconnected';
      }

      // For now, just check if URI is valid
      // In a real implementation, you'd test the actual connection
      return 'connected';
    } catch (error) {
      console.error('Database health check failed:', error);
      return 'unknown';
    }
  }

  private async checkCache(
    config: ParsedConfiguration
  ): Promise<'connected' | 'disconnected' | 'unknown'> {
    try {
      // Check if Redis is configured
      if (config.REDIS_URL || (config.REDIS_HOST && config.REDIS_PORT)) {
        // In a real implementation, you'd test the actual connection
        return 'connected';
      }
      return 'disconnected';
    } catch (error) {
      console.error('Cache health check failed:', error);
      return 'unknown';
    }
  }

  private checkEmail(
    config: ParsedConfiguration
  ): 'configured' | 'not-configured' | 'unknown' {
    try {
      if (
        config.SMTP_HOST &&
        config.SMTP_PORT &&
        config.SMTP_USER &&
        config.SMTP_APP_PASS
      ) {
        return 'configured';
      }
      return 'not-configured';
    } catch (error) {
      console.error('Email health check failed:', error);
      return 'unknown';
    }
  }

  private determineOverallStatus(
    services: HealthStatus['services']
  ): 'healthy' | 'unhealthy' {
    // Consider unhealthy if critical services are down
    if (services.database === 'disconnected') {
      return 'unhealthy';
    }

    // For now, consider it healthy if database is connected
    return 'healthy';
  }

  private getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const used = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    const total = Math.round(memUsage.heapTotal / 1024 / 1024); // MB
    const percentage = Math.round((used / total) * 100);

    return {
      used,
      total,
      percentage,
    };
  }

  public getStartTime(): number {
    return this.startTime;
  }

  public getUptime(): number {
    return Date.now() - this.startTime;
  }
}
