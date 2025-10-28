import { injectable, inject } from 'tsyringe';
import Redis from 'ioredis';
import { ICacheProvider } from './ICacheProvider';
export { ICacheProvider } from './ICacheProvider';
import { CacheConnectionConfig } from '../../services/contracts/IConfigurationService';

@injectable()
export class RedisCacheProvider implements ICacheProvider {
  private client: Redis | null = null;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize Redis client here - wait for first use
    // This allows environment variables to be loaded first
    // Config will be fetched from container during initialization
  }

  private getRedisDatabase(redisUrl?: string): string {
    if (!redisUrl) return 'localhost';
    return redisUrl.includes('/1') ? '1 (TEST)' : '0 (PRODUCTION)';
  }

  private getRedisConfiguration() {
    // Fetch config from container at runtime (after it's registered)
    const { container } = require('tsyringe');
    const connectionConfig = container.resolve<CacheConnectionConfig>(
      'ICacheConnectionConfig'
    );

    console.log('🔧 Redis Configuration:', connectionConfig);

    const redisUrl = connectionConfig.url;
    const redisHost = connectionConfig.host || 'localhost';
    const redisPort = connectionConfig.port || 6379;

    // Business logic: If REDIS_URL exists, use cloud Redis
    // Otherwise use localhost
    if (redisUrl) {
      // Use cloud Redis if REDIS_URL exists
      return {
        type: 'cloud',
        url: redisUrl,
        database: this.getRedisDatabase(redisUrl),
      };
    } else {
      // Default to localhost:6379
      return {
        type: 'local',
        host: redisHost,
        port: redisPort,
        database: 'localhost',
      };
    }
  }

  private initializeClient(): void {
    if (this.initialized) return;

    this.initialized = true;
    const config = this.getRedisConfiguration();

    if (config.type === 'cloud') {
      console.log(`🔗 Redis: Connecting to Cloud (${config.database})`);

      this.client = new Redis(config.url!, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } else {
      console.log(`🔗 Redis: Connecting to ${config.host}:${config.port}`);

      this.client = new Redis({
        host: config.host,
        port: config.port,
        lazyConnect: true,
        enableReadyCheck: false,
        // Never retry - fail fast
        retryStrategy: () => null,
        reconnectOnError: () => false,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000, // 5 seconds timeout
        commandTimeout: 3000,
        family: 4, // Force IPv4
      });
    }

    // Handle connection events (only log success, silent on errors)
    this.client.once('ready', () => {
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', () => {
      // Silent - don't spam console with errors
    });

    // DON'T call connect() - lazyConnect will connect on first command
    // This prevents multiple connection attempts
  }

  async get<T>(key: string): Promise<T | null> {
    this.initializeClient();
    if (!this.client) return null;

    try {
      // lazyConnect will auto-connect on first command
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // Silent fail - Redis not available or connection broken
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      // lazyConnect will auto-connect on first command
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      // Silent fail - Redis not available or connection broken
    }
  }

  async del(key: string): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      // lazyConnect will auto-connect on first command
      await this.client.del(key);
    } catch (error) {
      // Silent fail - Redis not available or connection broken
    }
  }
}
