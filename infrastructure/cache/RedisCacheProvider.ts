import { injectable } from 'tsyringe';
import { container } from 'tsyringe';
import Redis from 'ioredis';
import { ICacheProvider } from './ICacheProvider';
export { ICacheProvider } from './ICacheProvider';
import { CacheConnectionConfig } from '../../services/contracts/IConfigurationService';

/**
 * Redis-based cache provider with lazy initialization and graceful fallback.
 *
 * Features:
 * - Lazy connection: Only connects on first cache operation
 * - Config from DI container: Fetched at runtime after environment setup
 * - Fail-fast strategy: No retries, immediate fallback to memory cache
 * - Silent errors: No console spam when Redis is unavailable
 */
@injectable()
export class RedisCacheProvider implements ICacheProvider {
  private client: Redis | null = null;
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization - client will be created on first use
    // This ensures environment config is loaded before connection attempt
  }

  private getRedisDatabase(redisUrl?: string): string {
    if (!redisUrl) return 'localhost';
    return redisUrl.includes('/1') ? '1 (TEST)' : '0 (PRODUCTION)';
  }

  /**
   * Fetches Redis configuration from DI container at runtime.
   * This ensures config is available after environment initialization.
   */
  private getRedisConfiguration() {
    const connectionConfig = container.resolve<CacheConnectionConfig>(
      'ICacheConnectionConfig'
    );

    console.log('🔧 Redis Configuration:', connectionConfig);

    const redisUrl = connectionConfig.url;
    const redisHost = connectionConfig.host || 'localhost';
    const redisPort = connectionConfig.port || 6379;

    // Use cloud Redis if REDIS_URL is provided, otherwise use localhost
    if (redisUrl) {
      return {
        type: 'cloud' as const,
        url: redisUrl,
        database: this.getRedisDatabase(redisUrl),
      };
    }

    return {
      type: 'local' as const,
      host: redisHost,
      port: redisPort,
      database: 'localhost',
    };
  }

  /**
   * Initializes Redis client with lazy connection strategy.
   * Called once on first cache operation.
   */
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
        retryStrategy: () => null, // Fail fast - no retries
        reconnectOnError: () => false, // No automatic reconnection
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        commandTimeout: 3000,
        family: 4, // Force IPv4
      });
    }

    this.setupEventHandlers();
  }

  /**
   * Sets up Redis connection event handlers.
   * Only logs success, errors are silent to avoid console spam.
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.once('ready', () => {
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', () => {
      // Silent - graceful degradation to memory cache
    });
  }

  /**
   * Retrieves a value from cache by key.
   * Returns null if key doesn't exist or Redis is unavailable.
   */
  async get<T>(key: string): Promise<T | null> {
    this.initializeClient();
    if (!this.client) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null; // Silent fail - graceful degradation
    }
  }

  /**
   * Stores a value in cache with TTL.
   * @param key - Cache key
   * @param value - Value to store (will be JSON serialized)
   * @param ttlSeconds - Time to live in seconds (default: 3600)
   */
  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      // Silent fail - graceful degradation
    }
  }

  /**
   * Deletes a value from cache by key.
   * No-op if key doesn't exist or Redis is unavailable.
   */
  async del(key: string): Promise<void> {
    this.initializeClient();
    if (!this.client) return;

    try {
      await this.client.del(key);
    } catch (error) {
      // Silent fail - graceful degradation
    }
  }
}
