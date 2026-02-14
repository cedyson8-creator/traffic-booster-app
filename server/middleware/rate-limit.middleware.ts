import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting Configuration
 * Different limits based on subscription tier
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message: string; // Error message
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Rate limit configurations by subscription tier
 */
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  free: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    message: 'Free tier: 100 requests per hour',
  },
  pro: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Pro tier: 1000 requests per hour',
  },
  enterprise: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10000,
    message: 'Enterprise tier: 10000 requests per hour',
  },
};

/**
 * Endpoint-specific rate limits (stricter for expensive operations)
 */
const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  '/api/export/pdf': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'PDF export: 50 exports per hour',
  },
  '/api/export/csv': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    message: 'CSV export: 100 exports per hour',
  },
  '/api/email-scheduler/schedule': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Schedule creation: 20 schedules per hour',
  },
  '/api/delivery-analytics/resend': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    message: 'Email resend: 100 resends per hour',
  },
  '/api/payments/subscribe': {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 10,
    message: 'Subscription: 10 attempts per day',
  },
};

/**
 * In-memory store for rate limit tracking
 * In production, use Redis for distributed rate limiting
 */
const rateLimitStore: RateLimitStore = {};

/**
 * Generate rate limit key from request
 */
function generateKey(req: Request, userId?: number): string {
  const identifier = userId || req.ip || 'unknown';
  return `${identifier}:${req.path}`;
}

/**
 * Clean up expired entries from store
 */
function cleanupStore() {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}

/**
 * Rate limiting middleware factory
 * Creates a middleware function with specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    const key = generateKey(req, userId);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      cleanupStore();
    }

    const now = Date.now();
    const entry = rateLimitStore[key];

    // Initialize or reset entry if window expired
    if (!entry || entry.resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return next();
    }

    // Increment request count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const resetTime = new Date(entry.resetTime);
      return res.status(429).json({
        error: 'Too many requests',
        message: config.message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        resetTime: resetTime.toISOString(),
      });
    }

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - entry.count);
    res.setHeader('X-RateLimit-Reset', entry.resetTime);

    next();
  };
}

/**
 * Global rate limiter middleware
 * Applies tier-based rate limiting to all requests
 */
export function globalRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Skip rate limiting for health checks and public endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  const userId = (req as any).userId;

  // Unauthenticated requests use stricter limits
  if (!userId) {
    const config = RATE_LIMIT_CONFIGS.free;
    return createRateLimiter(config)(req, res, next);
  }

  // Get user's subscription tier (would come from database in production)
  const userTier = (req as any).userTier || 'free';
  const config = RATE_LIMIT_CONFIGS[userTier] || RATE_LIMIT_CONFIGS.free;

  return createRateLimiter(config)(req, res, next);
}

/**
 * Endpoint-specific rate limiter
 * Applies stricter limits to expensive operations
 */
export function endpointRateLimiter(req: Request, res: Response, next: NextFunction) {
  const endpointConfig = ENDPOINT_LIMITS[req.path];

  if (!endpointConfig) {
    return next();
  }

  return createRateLimiter(endpointConfig)(req, res, next);
}

/**
 * Payment-specific rate limiter
 * Extra strict limits for payment operations
 */
export function paymentRateLimiter(req: Request, res: Response, next: NextFunction) {
  const config: RateLimitConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Payment operations: 5 attempts per hour',
  };

  return createRateLimiter(config)(req, res, next);
}

/**
 * Export-specific rate limiter
 * Limits resource-intensive export operations
 */
export function exportRateLimiter(req: Request, res: Response, next: NextFunction) {
  const config: RateLimitConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Export operations: 50 exports per hour',
  };

  return createRateLimiter(config)(req, res, next);
}

/**
 * Email-specific rate limiter
 * Prevents email spam and abuse
 */
export function emailRateLimiter(req: Request, res: Response, next: NextFunction) {
  const config: RateLimitConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    message: 'Email operations: 100 emails per hour',
  };

  return createRateLimiter(config)(req, res, next);
}

/**
 * Get current rate limit status for a user
 * Useful for displaying rate limit info in UI
 */
export function getRateLimitStatus(userId: number, path: string) {
  const key = `${userId}:${path}`;
  const entry = rateLimitStore[key];
  const now = Date.now();

  if (!entry || entry.resetTime < now) {
    return {
      limit: 0,
      remaining: 0,
      resetTime: null,
    };
  }

  const config = ENDPOINT_LIMITS[path] || RATE_LIMIT_CONFIGS.free;

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: new Date(entry.resetTime),
  };
}

/**
 * Reset rate limit for a specific user/endpoint
 * Admin only - for testing or manual resets
 */
export function resetRateLimit(userId: number, path: string) {
  const key = `${userId}:${path}`;
  delete rateLimitStore[key];
}

/**
 * Clear all rate limits
 * Admin only - for testing
 */
export function clearAllRateLimits() {
  Object.keys(rateLimitStore).forEach((key) => {
    delete rateLimitStore[key];
  });
}
