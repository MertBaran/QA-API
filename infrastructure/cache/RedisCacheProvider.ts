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
    const redisHost = this.connectionConfig.host;
    const redisPort = this.connectionConfig.port;

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
      // Default to localhost
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
      this.client = new Redis(config.url!, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } else {
      this.client = new Redis({
        host: config.host,
        port: config.port,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableReadyCheck: false,
        connectTimeout: 5000,
        commandTimeout: 3000,
        family: 4,
      });
    }

    // Handle connection events silently
    this.client.on('connect', () => {
      this.isConnected = true;
      // Silent success
    });

    this.client.on('error', () => {
      this.isConnected = false;
      // Silent fail
    });

    this.client.on('close', () => {
      this.isConnected = false;
      // Silent close
    });

    // Try to connect silently
    this.client.connect().catch(() => {
      // Silent connection failure - just use memory cache
    });
  }

  private tryLocalFallback(): void {
    console.log('🔄 Attempting to connect to localhost Redis as fallback...');

    // Create new client for localhost
    const localClient = new Redis({
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: false,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    localClient.on('connect', () => {
      this.isConnected = true;
      this.client = localClient;
      console.log('✅ Redis localhost fallback connected successfully');
    });

    localClient.on('error', err => {
      console.warn('⚠️ Redis localhost fallback also failed:', err.message);
      console.log('📝 Using memory cache only');
    });

    localClient.connect().catch(err => {
      console.warn(
        '⚠️ Redis localhost fallback connection failed:',
        err.message
      );
      console.log('📝 All Redis options exhausted, using memory cache only');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    this.initializeClient();
    if (!this.client) return null;

    try {
      if (!this.client.status || this.client.status !== 'ready') {
        return null;
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      if (!this.client.status || this.client.status !== 'ready') {
        return;
      }

      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      // Silent fail
    }
  }

  async del(key: string): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      if (!this.client.status || this.client.status !== 'ready') {
        return;
      }

      await this.client.del(key);
    } catch (error) {
      // Silent fail
    }
  }
}
