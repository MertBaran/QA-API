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
    
    // Temporarily disable Redis for development
    console.log('🔗 Redis: Disabled for development - using memory cache only');
    this.client = null;
    this.isConnected = false;
    return;

    const config = this.getRedisConfiguration();

    if (config.type === 'cloud') {
      console.log(`🔗 Redis: Connecting to Cloud (${config.database})`);

      this.client = new Redis(config.url!, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } else {
      console.log(`🔗 Redis: Connecting to Localhost (${config.port})`);

      this.client = new Redis({
        host: config.host,
        port: config.port,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: false,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });
    }

    // Handle connection events
    this.client.on('connect', () => {
      this.isConnected = true;
      if (config.type === 'cloud') {
        console.log(`✅ Redis: Cloud connected (${config.database})`);
      } else {
        console.log(`✅ Redis: Localhost connected (${config.port})`);
      }
    });

    this.client.on('error', err => {
      this.isConnected = false;
      if (config.type === 'cloud') {
        console.warn(
          '⚠️ Redis Cloud connection error, falling back to memory cache:',
          err.message
        );
        // Try to connect to localhost as fallback
        this.tryLocalFallback();
      } else {
        console.warn(
          '⚠️ Redis localhost connection error (using memory cache):',
          err.message
        );
      }
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('🔌 Redis connection closed');
    });

    // Try to connect
    this.client.connect().catch(err => {
      if (config.type === 'cloud') {
        console.warn(
          '⚠️ Redis Cloud initial connection failed, trying localhost fallback:',
          err.message
        );
        this.tryLocalFallback();
      } else {
        console.warn(
          '⚠️ Redis localhost initial connection failed:',
          err.message
        );
      }
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
      // Check if client is ready before using
      if (!this.client.status || this.client.status !== 'ready') {
        return null;
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Redis GET error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      // Check if client is ready before using
      if (!this.client.status || this.client.status !== 'ready') {
        return;
      }

      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.warn('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      // Check if client is ready before using
      if (!this.client.status || this.client.status !== 'ready') {
        return;
      }

      await this.client.del(key);
    } catch (error) {
      console.warn('Redis DEL error:', error);
    }
  }
}
