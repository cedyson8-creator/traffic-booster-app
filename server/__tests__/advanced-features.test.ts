import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiKeyService, type ApiKey } from '../services/api-key.service';
import { redisRateLimitService } from '../services/redis-rate-limit.service';

/**
 * Advanced Features Tests
 * Tests for Redis rate limiting, API key management, and monitoring
 */

describe('Redis Rate Limiting Service', () => {
  beforeEach(() => {
    // Reset services before each test
    redisRateLimitService.clearAll();
  });

  it('should check rate limit and return allowed status', async () => {
    const result = await redisRateLimitService.checkRateLimit('test-key', 10, 60000);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should reject requests exceeding limit', async () => {
    const key = 'test-key';
    const limit = 3;

    // Make 3 requests
    for (let i = 0; i < 3; i++) {
      const result = await redisRateLimitService.checkRateLimit(key, limit, 60000);
      expect(result.allowed).toBe(true);
    }

    // 4th request should be rejected
    const result = await redisRateLimitService.checkRateLimit(key, limit, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeDefined();
  });

  it('should return service status', () => {
    const status = redisRateLimitService.getServiceStatus();

    expect(status.backend).toBeDefined();
    expect(status.isHealthy).toBeDefined();
    expect(typeof status.entryCount).toBe('number');
  });

  it('should reset rate limit for a key', async () => {
    const key = 'test-key';

    // Make requests to hit limit
    for (let i = 0; i < 3; i++) {
      await redisRateLimitService.checkRateLimit(key, 3, 60000);
    }

    // Should be rejected
    let result = await redisRateLimitService.checkRateLimit(key, 3, 60000);
    expect(result.allowed).toBe(false);

    // Reset
    await redisRateLimitService.reset(key);

    // Should be allowed again
    result = await redisRateLimitService.checkRateLimit(key, 3, 60000);
    expect(result.allowed).toBe(true);
  });

  it('should clear all rate limits', async () => {
    // Make requests
    await redisRateLimitService.checkRateLimit('key1', 1, 60000);
    await redisRateLimitService.checkRateLimit('key2', 1, 60000);

    // Clear all
    await redisRateLimitService.clearAll();

    // Should be allowed again
    const result1 = await redisRateLimitService.checkRateLimit('key1', 1, 60000);
    const result2 = await redisRateLimitService.checkRateLimit('key2', 1, 60000);

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });
});

describe('API Key Service', () => {
  beforeEach(() => {
    ApiKeyService.clearAll();
  });

  it('should generate a new API key', () => {
    const apiKey = ApiKeyService.generateKey(1, 'Test Key', 'pro');

    expect(apiKey.id).toBeDefined();
    expect(apiKey.key).toMatch(/^sk_pro_/);
    expect(apiKey.name).toBe('Test Key');
    expect(apiKey.tier).toBe('pro');
    expect(apiKey.userId).toBe(1);
    expect(apiKey.isActive).toBe(true);
    expect(apiKey.rateLimit).toBe(1000);
  });

  it('should validate a correct API key', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');
    const validation = ApiKeyService.validateKey(generated.key);

    expect(validation.valid).toBe(true);
    expect(validation.keyId).toBe(generated.id);
    expect(validation.apiKey).toBeDefined();
  });

  it('should reject invalid API keys', () => {
    const validation = ApiKeyService.validateKey('invalid_key');

    expect(validation.valid).toBe(false);
    expect(validation.keyId).toBeUndefined();
  });

  it('should get API key by ID', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'pro');
    const retrieved = ApiKeyService.getKey(generated.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(generated.id);
    expect(retrieved?.userId).toBe(1);
  });

  it('should list API keys for a user', () => {
    ApiKeyService.generateKey(1, 'Key 1', 'free');
    ApiKeyService.generateKey(1, 'Key 2', 'pro');
    ApiKeyService.generateKey(2, 'Key 3', 'free');

    const user1Keys = ApiKeyService.listKeys(1);
    const user2Keys = ApiKeyService.listKeys(2);

    expect(user1Keys).toHaveLength(2);
    expect(user2Keys).toHaveLength(1);
  });

  it('should revoke an API key', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    ApiKeyService.revokeKey(generated.id);

    const validation = ApiKeyService.validateKey(generated.key);
    expect(validation.valid).toBe(false);
  });

  it('should delete an API key', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    ApiKeyService.deleteKey(generated.id);

    const retrieved = ApiKeyService.getKey(generated.id);
    expect(retrieved).toBeNull();
  });

  it('should track API key usage', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    ApiKeyService.trackUsage(generated.id, {
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 200,
      responseTime: 50,
      userId: 1,
    });

    const key = ApiKeyService.getKey(generated.id);
    expect(key?.usageCount).toBe(1);
    expect(key?.lastUsedAt).toBeDefined();
  });

  it('should get usage statistics', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    // Track multiple requests
    for (let i = 0; i < 5; i++) {
      ApiKeyService.trackUsage(generated.id, {
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 50 + i * 10,
        userId: 1,
      });
    }

    const stats = ApiKeyService.getUsageStats(generated.id, 24);

    expect(stats.totalRequests).toBe(5);
    expect(stats.requestsByEndpoint['/api/test']).toBe(5);
    expect(stats.requestsByMethod['GET']).toBe(5);
    expect(stats.errorCount).toBe(0);
    expect(stats.averageResponseTime).toBeGreaterThan(0);
  });

  it('should rotate an API key', () => {
    const original = ApiKeyService.generateKey(1, 'Test Key', 'pro');

    const result = ApiKeyService.rotateKey(original.id);

    expect(result).toBeDefined();
    expect(result?.oldKey.id).toBe(original.id);
    expect(result?.newKey.id).not.toBe(original.id);
    expect(result?.oldKey.expiresAt).toBeDefined();
  });

  it('should return service statistics', () => {
    ApiKeyService.generateKey(1, 'Key 1', 'free');
    ApiKeyService.generateKey(1, 'Key 2', 'pro');

    const stats = ApiKeyService.getServiceStats();

    expect(stats.totalKeys).toBe(2);
    expect(stats.activeKeys).toBe(2);
    expect(stats.totalUsageRecords).toBe(0);
  });

  it('should enforce tier-based rate limits', () => {
    const freeKey = ApiKeyService.generateKey(1, 'Free Key', 'free');
    const proKey = ApiKeyService.generateKey(2, 'Pro Key', 'pro');
    const enterpriseKey = ApiKeyService.generateKey(3, 'Enterprise Key', 'enterprise');

    expect(freeKey.rateLimit).toBe(100);
    expect(proKey.rateLimit).toBe(1000);
    expect(enterpriseKey.rateLimit).toBe(10000);
  });
});

describe('API Key Usage Tracking', () => {
  beforeEach(() => {
    ApiKeyService.clearAll();
  });

  it('should track different endpoint usage', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    ApiKeyService.trackUsage(generated.id, {
      endpoint: '/api/export',
      method: 'POST',
      statusCode: 200,
      responseTime: 100,
      userId: 1,
    });

    ApiKeyService.trackUsage(generated.id, {
      endpoint: '/api/payments',
      method: 'POST',
      statusCode: 201,
      responseTime: 150,
      userId: 1,
    });

    const stats = ApiKeyService.getUsageStats(generated.id, 24);

    expect(stats.totalRequests).toBe(2);
    expect(stats.requestsByEndpoint['/api/export']).toBe(1);
    expect(stats.requestsByEndpoint['/api/payments']).toBe(1);
  });

  it('should count errors in usage statistics', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    ApiKeyService.trackUsage(generated.id, {
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 200,
      responseTime: 50,
      userId: 1,
    });

    ApiKeyService.trackUsage(generated.id, {
      endpoint: '/api/test',
      method: 'GET',
      statusCode: 500,
      responseTime: 100,
      userId: 1,
    });

    const stats = ApiKeyService.getUsageStats(generated.id, 24);

    expect(stats.totalRequests).toBe(2);
    expect(stats.errorCount).toBe(1);
  });

  it('should get usage history', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    for (let i = 0; i < 10; i++) {
      ApiKeyService.trackUsage(generated.id, {
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 50,
        userId: 1,
      });
    }

    const history = ApiKeyService.getUsageHistory(generated.id, 5);

    expect(history).toHaveLength(5);
    expect(history[0].endpoint).toBe('/api/test');
  });
});

describe('API Key Expiration', () => {
  beforeEach(() => {
    ApiKeyService.clearAll();
  });

  it('should reject expired API keys', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    // Manually set expiration to past
    const key = ApiKeyService.getKey(generated.id);
    if (key) {
      key.expiresAt = new Date(Date.now() - 1000);
    }

    const validation = ApiKeyService.validateKey(generated.key);
    expect(validation.valid).toBe(false);
  });

  it('should accept non-expired API keys', () => {
    const generated = ApiKeyService.generateKey(1, 'Test Key', 'free');

    // Set expiration to future
    const key = ApiKeyService.getKey(generated.id);
    if (key) {
      key.expiresAt = new Date(Date.now() + 86400000); // 24 hours from now
    }

    const validation = ApiKeyService.validateKey(generated.key);
    expect(validation.valid).toBe(true);
  });
});
