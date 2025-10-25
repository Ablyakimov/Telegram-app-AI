import { Injectable } from '@nestjs/common';

interface CacheEntry {
  message: string;
  timestamp: number;
}

@Injectable()
export class DedupCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds
  private readonly MAX_CACHE_SIZE = 1000; // Prevent memory leak

  /**
   * Generates a cache key based on userId, chatId, and message
   */
  private getCacheKey(userId: number, chatId: number, message: string): string {
    return `${userId}:${chatId}:${message.trim().toLowerCase()}`;
  }

  /**
   * Checks if a message is a duplicate (sent recently)
   */
  isDuplicate(userId: number, chatId: number, message: string): boolean {
    const key = this.getCacheKey(userId, chatId, message);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // If cache entry is expired, remove it
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      return false;
    }

    // It's a duplicate
    return true;
  }

  /**
   * Adds a message to the cache
   */
  add(userId: number, chatId: number, message: string): void {
    // Prevent memory leak by limiting cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries (first 100)
      const keysToDelete = Array.from(this.cache.keys()).slice(0, 100);
      keysToDelete.forEach(key => this.cache.delete(key));
    }

    const key = this.getCacheKey(userId, chatId, message);
    this.cache.set(key, {
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleans up expired entries (optional, can be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

