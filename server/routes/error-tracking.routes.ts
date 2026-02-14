import { Router, Request, Response } from 'express';
import { ErrorTrackingService } from '../services/error-tracking.service';
import { apiKeyAuth } from '../middleware/api-key.middleware';

const router = Router();

/**
 * Get error tracking status
 * GET /api/errors/status
 */
router.get('/status', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const status = ErrorTrackingService.getStatus();

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting error tracking status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get error tracking status',
    });
  }
});

/**
 * Get recent errors
 * GET /api/errors/recent
 */
router.get('/recent', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 500);

    const errors = ErrorTrackingService.getRecentErrors(limitNum);

    return res.json({
      success: true,
      data: errors,
    });
  } catch (error) {
    console.error('Error getting recent errors:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get recent errors',
    });
  }
});

/**
 * Get errors by level
 * GET /api/errors/by-level/:level
 */
router.get('/by-level/:level', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const validLevels = ['fatal', 'error', 'warning', 'info', 'debug'];

    if (!validLevels.includes(level)) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Invalid level. Must be one of: ${validLevels.join(', ')}`,
      });
    }

    const errors = ErrorTrackingService.getErrorsByLevel(level as any);

    return res.json({
      success: true,
      data: errors,
    });
  } catch (error) {
    console.error('Error getting errors by level:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get errors by level',
    });
  }
});

/**
 * Get errors by endpoint
 * GET /api/errors/by-endpoint/:endpoint
 */
router.get('/by-endpoint/:endpoint', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.params;
    const errors = ErrorTrackingService.getErrorsByEndpoint(endpoint);

    return res.json({
      success: true,
      data: errors,
    });
  } catch (error) {
    console.error('Error getting errors by endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get errors by endpoint',
    });
  }
});

/**
 * Get error statistics
 * GET /api/errors/stats
 */
router.get('/stats', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const stats = ErrorTrackingService.getStatistics();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting error statistics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get error statistics',
    });
  }
});

/**
 * Get errors in time range
 * GET /api/errors/range
 */
router.get('/range', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'startTime and endTime query parameters are required',
      });
    }

    const start = new Date(startTime as string);
    const end = new Date(endTime as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid date format. Use ISO 8601 format (e.g., 2026-02-14T12:00:00Z)',
      });
    }

    const errors = ErrorTrackingService.getErrorsInRange(start, end);

    return res.json({
      success: true,
      data: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        count: errors.length,
        errors,
      },
    });
  } catch (error) {
    console.error('Error getting errors in range:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get errors in range',
    });
  }
});

/**
 * Get specific error by ID
 * GET /api/errors/:errorId
 */
router.get('/:errorId', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const error = ErrorTrackingService.getError(errorId);

    if (!error) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Error not found',
      });
    }

    return res.json({
      success: true,
      data: error,
    });
  } catch (error) {
    console.error('Error getting error details:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get error details',
    });
  }
});

export default router;
