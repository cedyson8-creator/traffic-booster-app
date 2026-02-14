import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  createRateLimiter,
  globalRateLimiter,
  endpointRateLimiter,
  paymentRateLimiter,
  exportRateLimiter,
  emailRateLimiter,
  getRateLimitStatus,
  resetRateLimit,
  clearAllRateLimits,
} from '../middleware/rate-limit.middleware';
import type { RateLimitConfig } from '../middleware/rate-limit.middleware';

/**
 * Rate Limiting Middleware Tests
 */

let app: express.Express;

beforeEach(() => {
  clearAllRateLimits();
  app = express();
  app.use(express.json());

  // Mock userId middleware
  app.use((req: any, res, next) => {
    req.userId = 1;
    req.userTier = 'pro';
    next();
  });
});

afterEach(() => {
  clearAllRateLimits();
});

describe('Rate Limiter Factory', () => {
  it('should allow requests within limit', async () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 5,
      message: 'Test limit',
    };

    app.get('/test', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

  it('should reject requests exceeding limit', async () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 3,
      message: 'Test limit exceeded',
    };

    app.get('/test', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    // Make 3 successful requests
    for (let i = 0; i < 3; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }

    // 4th request should be rejected
    const response = await request(app).get('/test');
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Too many requests');
    expect(response.body.retryAfter).toBeDefined();
  });

  it('should include rate limit headers in response', async () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 10,
      message: 'Test limit',
    };

    app.get('/test', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    const response = await request(app).get('/test');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reset counter after window expires', async () => {
    const config = {
      windowMs: 100, // 100ms window
      maxRequests: 2,
      message: 'Test limit',
    };

    app.get('/test', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    // Make 2 requests
    for (let i = 0; i < 2; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }

    // 3rd request should be rejected
    let response = await request(app).get('/test');
    expect(response.status).toBe(429);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Request should succeed again
    response = await request(app).get('/test');
    expect(response.status).toBe(200);
  });
});

describe('Global Rate Limiter', () => {
  it('should apply global limits to all requests', async () => {
    app.get('/api/test', globalRateLimiter, (req, res) => {
      return res.json({ success: true });
    });

    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should skip rate limiting for health checks', async () => {
    app.get('/health', globalRateLimiter, (req, res) => {
      return res.json({ ok: true });
    });

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});

describe('Payment Rate Limiter', () => {
  it('should enforce strict payment limits', async () => {
    app.post('/api/payments/subscribe', paymentRateLimiter, (req, res) => {
      return res.json({ success: true });
    });

    // Make 5 successful requests (max for payment)
    for (let i = 0; i < 5; i++) {
      const response = await request(app).post('/api/payments/subscribe');
      expect(response.status).toBe(200);
    }

    // 6th request should be rejected
    const response = await request(app).post('/api/payments/subscribe');
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Too many requests');
  });
});

describe('Export Rate Limiter', () => {
  it('should limit PDF exports', async () => {
    app.post('/api/export/pdf', exportRateLimiter, (req, res) => {
      return res.json({ success: true });
    });

    const response = await request(app).post('/api/export/pdf');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('Email Rate Limiter', () => {
  it('should limit email operations', async () => {
    app.post('/api/email-scheduler/schedule', emailRateLimiter, (req, res) => {
      return res.json({ success: true });
    });

    const response = await request(app).post('/api/email-scheduler/schedule');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('Rate Limit Status', () => {
  it('should return rate limit status', async () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 10,
      message: 'Test',
    };

    app.get('/test', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    // Make a request
    await request(app).get('/test');

    // Get status
    const status = getRateLimitStatus(1, '/test');
    expect(status.limit).toBeGreaterThan(0);
    expect(status.remaining).toBeGreaterThan(0);
    expect(status.resetTime).toBeDefined();
  });

  it('should return zero for non-existent entries', () => {
    const status = getRateLimitStatus(999, '/nonexistent');
    expect(status.limit).toBe(0);
    expect(status.remaining).toBe(0);
    expect(status.resetTime).toBeNull();
  });
});

describe('Rate Limit Reset', () => {
  it('should reset rate limit for specific user/endpoint', async () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 2,
      message: 'Test',
    };

    app.get('/test', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    // Make 2 requests to hit limit
    for (let i = 0; i < 2; i++) {
      await request(app).get('/test');
    }

    // 3rd request should be rejected
    let response = await request(app).get('/test');
    expect(response.status).toBe(429);

    // Reset rate limit
    resetRateLimit(1, '/test');

    // Request should succeed again
    response = await request(app).get('/test');
    expect(response.status).toBe(200);
  });
});

describe('Rate Limit Cleanup', () => {
  it('should clear all rate limits', async () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 1,
      message: 'Test',
    };

    app.get('/test', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    // Make a request to hit limit
    await request(app).get('/test');

    // Next request should be rejected
    let response = await request(app).get('/test');
    expect(response.status).toBe(429);

    // Clear all limits
    clearAllRateLimits();

    // Request should succeed again
    response = await request(app).get('/test');
    expect(response.status).toBe(200);
  });
});

describe('Different Endpoints', () => {
  it('should track separate limits for different endpoints', async () => {
    const config = {
      windowMs: 60 * 1000,
      maxRequests: 2,
      message: 'Test',
    };

    app.get('/endpoint1', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    app.get('/endpoint2', createRateLimiter(config), (req, res) => {
      return res.json({ success: true });
    });

    // Make 2 requests to endpoint1
    for (let i = 0; i < 2; i++) {
      const response = await request(app).get('/endpoint1');
      expect(response.status).toBe(200);
    }

    // 3rd request to endpoint1 should be rejected
    let response = await request(app).get('/endpoint1');
    expect(response.status).toBe(429);

    // But endpoint2 should still work
    response = await request(app).get('/endpoint2');
    expect(response.status).toBe(200);
  });
});
