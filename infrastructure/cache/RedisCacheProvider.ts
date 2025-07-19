import { injectable } from "tsyringe";
import Redis from "ioredis";
import { ICacheProvider } from "./ICacheProvider";
export { ICacheProvider } from "./ICacheProvider";
import { RedisConfig } from "./RedisConfig";

@injectable()
export class RedisCacheProvider implements ICacheProvider {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    // Check if Redis URL is provided (cloud Redis)
    if (process.env["REDIS_URL"]) {
      this.client = new Redis(process.env["REDIS_URL"], {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } else {
      // Local Redis configuration
      this.client = new Redis({
        host: process.env["REDIS_HOST"] || "localhost",
        port: parseInt(process.env["REDIS_PORT"] || "6379"),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    }

    // Handle connection events
    this.client.on("connect", () => {
      this.isConnected = true;
      console.log("Redis connected successfully");
    });

    this.client.on("error", (err) => {
      this.isConnected = false;
      console.warn(
        "⚠️ Redis connection error (falling back to memory cache):",
        err.message
      );
    });

    // Try to connect
    this.client.connect().catch((err) => {
      console.warn("⚠️ Redis initial connection failed:", err.message);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn("Redis GET error:", error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.warn("Redis SET error:", error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.warn("Redis DEL error:", error);
    }
  }
}
