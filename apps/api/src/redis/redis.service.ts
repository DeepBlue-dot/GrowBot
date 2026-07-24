import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private store = new Map<string, { value: string; expiresAt: number }>();

  setKey(
    key: string,
    value: string,
    ttlSeconds: number = 86400,
  ): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.logger.debug(`[Redis Cache] Set key ${key} with TTL ${ttlSeconds}s`);
    return Promise.resolve();
  }

  getKey(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return Promise.resolve(null);
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(item.value);
  }

  deleteKey(key: string): Promise<void> {
    this.store.delete(key);
    this.logger.debug(`[Redis Cache] Deleted key ${key}`);
    return Promise.resolve();
  }

  onModuleDestroy() {
    this.store.clear();
  }
}
