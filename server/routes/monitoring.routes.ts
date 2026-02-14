import { Router, Request, Response } from 'express';
import { redisRateLimitService } from '../services/redis-rate-limit.service';
import { ApiKeyService } from '../services/api-key.service';
import { apiKeyAuth } from '../middleware/api-key.middleware';

const router = Router();

/**
 * Get rate limiting metrics
 * GET /api/monitoring/rate-limits
 */
router.get('/rate-limits', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const status = redisRateLimitService.getServiceStatus();

    return res.json({
      success: true,
      data: {
        backend: status.backend,
        isHealthy: status.isHealthy,
        entryCount: status.entryCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting rate limit metrics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get rate limit metrics',
    });
  }
});

/**
 * Get API key usage metrics
 * GET /api/monitoring/api-keys
 */
router.get('/api-keys', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const stats = ApiKeyService.getServiceStats();

    return res.json({
      success: true,
      data: {
        totalKeys: stats.totalKeys,
        activeKeys: stats.activeKeys,
        inactiveKeys: stats.totalKeys - stats.activeKeys,
        totalUsageRecords: stats.totalUsageRecords,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting API key metrics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get API key metrics',
    });
  }
});

/**
 * Get error tracking metrics
 * GET /api/monitoring/errors
 */
router.get('/errors', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { hours = '24' } = req.query;
    const hoursBack = Math.min(Math.max(parseInt(hours as string) || 24, 1), 720);

    // In production, this would query from a real error tracking service
    return res.json({
      success: true,
      data: {
        period: `${hoursBack} hours`,
        totalErrors: 0,
        errorsByType: {},
        errorsByEndpoint: {},
        topErrors: [],
        timestamp: new Date().toISOString(),
        note: 'Connect to error tracking service (e.g., Sentry, LogRocket) for real data',
      },
    });
  } catch (error) {
    console.error('Error getting error metrics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get error metrics',
    });
  }
});

/**
 * Get test coverage metrics
 * GET /api/monitoring/coverage
 */
router.get('/coverage', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    // In production, this would read from coverage reports
    return res.json({
      success: true,
      data: {
        statements: {
          total: 0,
          covered: 0,
          percentage: 0,
        },
        branches: {
          total: 0,
          covered: 0,
          percentage: 0,
        },
        functions: {
          total: 0,
          covered: 0,
          percentage: 0,
        },
        lines: {
          total: 0,
          covered: 0,
          percentage: 0,
        },
        timestamp: new Date().toISOString(),
        note: 'Run: pnpm test --coverage to generate coverage reports',
      },
    });
  } catch (error) {
    console.error('Error getting coverage metrics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get coverage metrics',
    });
  }
});

/**
 * Get comprehensive monitoring dashboard data
 * GET /api/monitoring/dashboard
 */
router.get('/dashboard', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const rateLimitStatus = redisRateLimitService.getServiceStatus();
    const apiKeyStats = ApiKeyService.getServiceStats();

    return res.json({
      success: true,
      data: {
        summary: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
        },
        rateLimiting: {
          backend: rateLimitStatus.backend,
          isHealthy: rateLimitStatus.isHealthy,
          entryCount: rateLimitStatus.entryCount,
        },
        apiKeys: {
          total: apiKeyStats.totalKeys,
          active: apiKeyStats.activeKeys,
          inactive: apiKeyStats.totalKeys - apiKeyStats.activeKeys,
          usageRecords: apiKeyStats.totalUsageRecords,
        },
        system: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
      },
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get dashboard data',
    });
  }
});

/**
 * Get rate limit status for specific key
 * GET /api/monitoring/rate-limits/:keyId
 */
router.get('/rate-limits/:keyId', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const status = await redisRateLimitService.getStatus(`apikey:${keyId}`);

    return res.json({
      success: true,
      data: {
        keyId,
        count: status.count,
        resetTime: new Date(status.resetTime).toISOString(),
        backend: status.isRedis ? 'redis' : 'memory',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get rate limit status',
    });
  }
});

/**
 * Get health check endpoint
 * GET /api/monitoring/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const rateLimitStatus = redisRateLimitService.getServiceStatus();

    return res.json({
      success: true,
      status: 'healthy',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        rateLimiting: {
          backend: rateLimitStatus.backend,
          isHealthy: rateLimitStatus.isHealthy,
        },
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
      },
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Internal server error',
    });
  }
});

export default router;
