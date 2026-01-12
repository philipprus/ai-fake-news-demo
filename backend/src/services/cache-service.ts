import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

/**
 * Cache service wrapper around node-cache
 * Provides a thin abstraction layer with logging
 */
export class CacheService {
  private cache: NodeCache;

  constructor(ttlMinutes: number = 10) {
    this.cache = new NodeCache({
      stdTTL: ttlMinutes * 60, // Convert minutes to seconds
      checkperiod: 60, // Cleanup every 60 seconds
      useClones: false, // Don't clone objects (faster)
    });

    // Log cache events
    this.cache.on('expired', (key: string) => {
      logger.debug('Cache expired', { key });
    });

    logger.info('Cache service initialized', { ttlMinutes });
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const value: unknown = this.cache.get(key);
    
    if (value === undefined) {
      logger.debug('Cache miss', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return value as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    let success: boolean;
    
    if (ttlMinutes !== undefined) {
      success = this.cache.set(key, data, ttlMinutes * 60);
    } else {
      success = this.cache.set(key, data);
    }
    
    if (success) {
      const defaultTtl = this.cache.options.stdTTL;
      logger.debug('Cache set', { 
        key, 
        ttlMinutes: ttlMinutes || (defaultTtl ? defaultTtl / 60 : 0),
      });
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.del(key);
    logger.debug('Cache deleted', { key });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const keys = this.cache.keys();
    this.cache.flushAll();
    logger.info('Cache cleared', { entriesRemoved: keys.length });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.keys().length,
      keys: this.cache.keys(),
    };
  }
}

