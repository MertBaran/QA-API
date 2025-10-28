import { injectable, inject } from 'tsyringe';
import Redis from 'ioredis';
import { ICacheProvider } from './ICacheProvider';
export { ICacheProvider } from './ICacheProvider';
import { CacheConnectionConfig } from '../../services/contracts/IConfigurationService';

@injectable()
export class RedisCacheProvider implements ICacheProvider {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private initialized: boolean = false;
  private connectionConfig: CacheConnectionConfig;

  constructor(
    @inject('ICacheConnectionConfig') connectionConfig: CacheConnectionConfig
  ) {
    // Don't initialize Redis client here - wait for first use
    // This allows environment variables to be loaded first
    this.connectionConfig = connectionConfig;
  }

  private getRedisDatabase(redisUrl?: string): string {
    if (!redisUrl) return 'localhost';
    return redisUrl.includes('/1') ? '1 (TEST)' : '0 (PRODUCTION)';
  }

  private getRedisConfiguration() {
    const redisUrl = this.connectionConfig.url;
    const redisHost = this.connectionConfig.host || 'localhost';
    const redisPort = this.connectionConfig.port || 6379;

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

    // Handle connection events
    this.client.once('connect', () => {
      this.isConnected = true;
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', err => {
      this.isConnected = false;
      // Silent - don't spam console
    });

    this.client.once('close', () => {
      this.isConnected = false;
      // Silent - connection closed
    });

    // Try to connect - fail fast
    this.client.connect().catch(err => {
      console.warn('⚠️ Redis not available, using memory cache fallback');
      this.isConnected = false;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    this.initializeClient();
    if (!this.client || !this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // Silent fail - connection might be broken
      this.isConnected = false;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.initializeClient();
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      // Silent fail - connection might be broken
      this.isConnected = false;
    }
  }

  async del(key: string): Promise<void> {
    this.initializeClient();
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      // Silent fail - connection might be broken
      this.isConnected = false;
    }
  }
}
