import { ICacheProvider } from "../../../infrastructure/cache/ICacheProvider";

export class FakeCacheProvider implements ICacheProvider {
  public store = new Map<string, any>(); // Made public for test access

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.has(key) ? this.store.get(key) : null;
    console.debug(`FakeCache GET: ${key} => ${value ? "HIT" : "MISS"}`);
    return value;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.store.set(key, value);
    console.debug(`FakeCache SET: ${key} => ${value} (TTL: ${ttlSeconds}s)`);
  }

  async del(key: string): Promise<void> {
    const existed = this.store.has(key);
    this.store.delete(key);
    console.debug(`FakeCache DEL: ${key} (existed: ${existed})`);
  }

  // Additional methods for testing
  async clear(): Promise<void> {
    this.store.clear();
    console.debug("FakeCache CLEAR: All keys deleted");
  }

  getKeys(): string[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    return this.store.size;
  }
}
