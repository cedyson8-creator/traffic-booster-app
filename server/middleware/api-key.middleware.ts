import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key.service';
import { redisRateLimitService } from '../services/redis-rate-limit.service';

/**
 * API Key Authentication Middleware
 * Validates API key and enforces per-key rate limiting
 */

declare global {
  namespace Express {
    interface Request {
      apiKeyId?: string;
      userId?: number;
      apiKeyTier?: 'free' | 'pro' | 'enterprise';
      startTime?: number;
    }
  }
}

/**
 * Extract API key from request
 */
function extractApiKey(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  // Check query parameter
  const queryKey = req.query.api_key;
  if (typeof queryKey === 'string') {
    return queryKey;
  }

  return null;
}

/**
 * API Key validation middleware
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required',
      hint: 'Provide API key via Authorization header (Bearer), X-API-Key header, or api_key query parameter',
    });
    return;
  }

  const validation = ApiKeyService.validateKey(apiKey);

  if (!validation.valid || !validation.keyId || !validation.apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired API key',
    });
    return;
  }

  // Attach key info to request
  req.apiKeyId = validation.keyId;
  req.userId = validation.apiKey.userId;
  req.apiKeyTier = validation.apiKey.tier;
  req.startTime = Date.now();

  next();
}

/**
 * API Key rate limiting middleware
 */
export async function apiKeyRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.apiKeyId) {
    next();
    return;
  }

  const apiKey = ApiKeyService.getKey(req.apiKeyId);

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key not found',
    });
    return;
  }

  // Check rate limit
  const rateLimitKey = `apikey:${req.apiKeyId}`;
  const result = await redisRateLimitService.checkRateLimit(
    rateLimitKey,
    apiKey.rateLimit,
    60 * 60 * 1000, // 1 hour window
  );

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', apiKey.rateLimit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

  if (!result.allowed) {
    res.status(429).json({
      error: 'Too many requests',
      message: `API key rate limit exceeded (${apiKey.rateLimit} requests per hour)`,
      retryAfter: result.retryAfter,
      resetTime: new Date(result.resetTime).toISOString(),
    });
    return;
  }

  next();
}

/**
 * Track API key usage after request completes
 */
export function trackApiKeyUsage(req: Request, res: Response, next: NextFunction) {
  if (!req.apiKeyId || !req.startTime) {
    return next();
  }

  // Intercept response to track usage
  const originalSend = res.send;

  res.send = function (data: any) {
    const responseTime = Date.now() - req.startTime!;

    ApiKeyService.trackUsage(req.apiKeyId!, {
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      userId: req.userId || 0,
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Require API key for specific routes
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (!req.apiKeyId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required for this endpoint',
    });
    return;
  }

  next();
}

/**
 * Require specific API key tier
 */
export function requireApiKeyTier(...tiers: Array<'free' | 'pro' | 'enterprise'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.apiKeyTier || !tiers.includes(req.apiKeyTier)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This endpoint requires one of these API key tiers: ${tiers.join(', ')}`,
        yourTier: req.apiKeyTier,
      });
      return;
    }

    next();
  };
}

/**
 * Optional API key authentication (doesn't fail if missing)
 */
export function optionalApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    next();
    return;
  }

  const validation = ApiKeyService.validateKey(apiKey);

  if (validation.valid && validation.keyId && validation.apiKey) {
    req.apiKeyId = validation.keyId;
    req.userId = validation.apiKey.userId;
    req.apiKeyTier = validation.apiKey.tier;
    req.startTime = Date.now();
  }

  next();
}
