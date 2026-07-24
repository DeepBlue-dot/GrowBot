import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private store = new Map<string, { value: string; expiresAt: number }>();

  async setKey(key: string, value: string, ttlSeconds: number = 86400): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.logger.debug(`[Redis Cache] Set key ${key} with TTL ${ttlSeconds}s`);
  }

  async getKey(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async deleteKey(key: string): Promise<void> {
    this.store.delete(key);
    this.logger.debug(`[Redis Cache] Deleted key ${key}`);
  }

  onModuleDestroy() {
    this.store.clear();
  }
}
