import Redis from 'ioredis';

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string, err?: any) => console.error(`[ERROR] ${msg}`, err),
};

/**
 * Redis-backed rate limiting service
 * Supports distributed deployments with automatic fallback to in-memory
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

export class RedisRateLimitService {
  private redis: Redis | null = null;
  private fallbackStore: RateLimitStore = {};
  private isUsingRedis = false;
  private connectionAttempts = 0;
  private maxRetries = 3;

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with fallback to in-memory
   */
  private initializeRedis() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.log('[RateLimit] Redis URL not configured, using in-memory store');
      this.isUsingRedis = false;
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          if (times > this.maxRetries) {
            console.warn('[RateLimit] Redis connection failed, falling back to in-memory store');
            this.isUsingRedis = false;
            return null;
          }
          return delay;
        },
        enableReadyCheck: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
      });

      this.redis.on('connect', () => {
        console.log('[RateLimit] Connected to Redis');
        this.isUsingRedis = true;
        this.connectionAttempts = 0;
      });

      this.redis.on('error', (err) => {
        console.error('[RateLimit] Redis error:', err);
        this.isUsingRedis = false;
      });

      this.redis.on('close', () => {
        console.warn('[RateLimit] Redis connection closed');
        this.isUsingRedis = false;
      });
    } catch (error) {
      console.error('[RateLimit] Failed to initialize Redis:', error);
      this.isUsingRedis = false;
    }
  }

  /**
   * Check and increment rate limit
   */
  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    try {
      if (this.isUsingRedis && this.redis) {
        return await this.checkRateLimitRedis(key, limit, windowMs);
      } else {
        return this.checkRateLimitMemory(key, limit, windowMs);
      }
    } catch (error) {
      console.error('[RateLimit] Error checking rate limit:', error);
      // Fallback to memory on error
      return this.checkRateLimitMemory(key, limit, windowMs);
    }
  }

  /**
   * Redis-backed rate limit check
   */
  private async checkRateLimitRedis(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    if (!this.redis) {
      return this.checkRateLimitMemory(key, limit, windowMs);
    }

    const now = Date.now();
    const resetTime = now + windowMs;
    const redisKey = `ratelimit:${key}`;

    try {
      // Use Redis MULTI/EXEC for atomic operations
      const pipeline = this.redis.pipeline();

      // Get current count
      pipeline.get(redisKey);
      // Increment count
      pipeline.incr(redisKey);
      // Set expiration
      pipeline.pexpire(redisKey, windowMs);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Pipeline execution failed');
      }

      const currentCount = parseInt(results[0][1] as string) || 0;
      const newCount = parseInt(results[1][1] as string) || 1;

      const allowed = newCount <= limit;
      const remaining = Math.max(0, limit - newCount);
      const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter,
      };
    } catch (error) {
      console.warn('[RateLimit] Redis operation failed, falling back to memory:', error);
      this.isUsingRedis = false;
      return this.checkRateLimitMemory(key, limit, windowMs);
    }
  }

  /**
   * In-memory rate limit check (fallback)
   */
  private checkRateLimitMemory(key: string, limit: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.fallbackStore[key];

    // Initialize or reset if window expired
    if (!entry || entry.resetTime < now) {
      this.fallbackStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }

    // Increment count
    entry.count++;

    const allowed = entry.count <= limit;
    const remaining = Math.max(0, limit - entry.count);
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  /**
   * Get rate limit status
   */
  async getStatus(key: string): Promise<{
    count: number;
    resetTime: number;
    isRedis: boolean;
  }> {
    try {
      if (this.isUsingRedis && this.redis) {
        const redisKey = `ratelimit:${key}`;
        const count = await this.redis.get(redisKey);
        const ttl = await this.redis.pttl(redisKey);

        return {
          count: parseInt(count || '0'),
          resetTime: Date.now() + Math.max(0, ttl),
          isRedis: true,
        };
      } else {
        const entry = this.fallbackStore[key];
        return {
          count: entry?.count || 0,
          resetTime: entry?.resetTime || Date.now(),
          isRedis: false,
        };
      }
    } catch (error) {
      console.error('[RateLimit] Error getting status:', error);
      const entry = this.fallbackStore[key];
      return {
        count: entry?.count || 0,
        resetTime: entry?.resetTime || Date.now(),
        isRedis: false,
      };
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    try {
      if (this.isUsingRedis && this.redis) {
        await this.redis.del(`ratelimit:${key}`);
      } else {
        delete this.fallbackStore[key];
      }
    } catch (error) {
      console.error('[RateLimit] Error resetting rate limit:', error);
      delete this.fallbackStore[key];
    }
  }

  /**
   * Clear all rate limits
   */
  async clearAll(): Promise<void> {
    try {
      if (this.isUsingRedis && this.redis) {
        const keys = await this.redis.keys('ratelimit:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        this.fallbackStore = {};
      }
    } catch (error) {
      console.error('[RateLimit] Error clearing all rate limits:', error);
      this.fallbackStore = {};
    }
  }

  /**
   * Clean up expired entries (memory only)
   */
  cleanupExpired(): void {
    if (this.isUsingRedis) {
      return; // Redis handles expiration automatically
    }

    const now = Date.now();
    const keysToDelete: string[] = [];

    Object.entries(this.fallbackStore).forEach(([key, entry]) => {
      if (entry.resetTime < now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      delete this.fallbackStore[key];
    });
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    backend: 'redis' | 'memory';
    isHealthy: boolean;
    entryCount: number;
  } {
    return {
      backend: this.isUsingRedis ? 'redis' : 'memory',
      isHealthy: this.isUsingRedis ? this.redis?.status === 'ready' : true,
      entryCount: this.isUsingRedis ? -1 : Object.keys(this.fallbackStore).length,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        console.error('[RateLimit] Error shutting down Redis:', error);
      }
    }
  }
}

// Singleton instance
export const redisRateLimitService = new RedisRateLimitService();
