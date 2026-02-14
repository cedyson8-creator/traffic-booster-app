import { Router, Request, Response } from 'express';
import { ApiKeyService } from '../services/api-key.service';
import { apiKeyAuth, requireApiKey } from '../middleware/api-key.middleware';

const router = Router();

/**
 * Generate a new API key
 * POST /api/api-keys/generate
 */
router.post('/generate', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { name, tier = 'free' } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'API key name is required',
      });
    }

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid tier. Must be one of: free, pro, enterprise',
      });
    }

    const apiKey = ApiKeyService.generateKey(userId!, name, tier);

    return res.status(201).json({
      success: true,
      data: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        tier: apiKey.tier,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
        message: 'Save your API key in a secure location. You will not be able to see it again.',
      },
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate API key',
    });
  }
});

/**
 * List API keys for authenticated user
 * GET /api/api-keys
 */
router.get('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const keys = ApiKeyService.listKeys(userId!);

    return res.json({
      success: true,
      data: keys.map((key) => ({
        id: key.id,
        name: key.name,
        tier: key.tier,
        rateLimit: key.rateLimit,
        isActive: key.isActive,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        usageCount: key.usageCount,
      })),
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list API keys',
    });
  }
});

/**
 * Get API key details
 * GET /api/api-keys/:keyId
 */
router.get('/:keyId', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const userId = req.userId;

    const apiKey = ApiKeyService.getKey(keyId);

    if (!apiKey || apiKey.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API key not found',
      });
    }

    return res.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        tier: apiKey.tier,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        usageCount: apiKey.usageCount,
      },
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get API key',
    });
  }
});

/**
 * Get API key usage statistics
 * GET /api/api-keys/:keyId/usage
 */
router.get('/:keyId/usage', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { hours = '24' } = req.query;
    const userId = req.userId;

    const apiKey = ApiKeyService.getKey(keyId);

    if (!apiKey || apiKey.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API key not found',
      });
    }

    const hoursBack = Math.min(Math.max(parseInt(hours as string) || 24, 1), 720); // 1 hour to 30 days
    const stats = ApiKeyService.getUsageStats(keyId, hoursBack);

    return res.json({
      success: true,
      data: {
        keyId,
        period: `${hoursBack} hours`,
        ...stats,
      },
    });
  } catch (error) {
    console.error('Error getting API key usage:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get API key usage',
    });
  }
});

/**
 * Get API key usage history
 * GET /api/api-keys/:keyId/history
 */
router.get('/:keyId/history', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { limit = '100' } = req.query;
    const userId = req.userId;

    const apiKey = ApiKeyService.getKey(keyId);

    if (!apiKey || apiKey.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API key not found',
      });
    }

    const limitNum = Math.min(Math.max(parseInt(limit as string) || 100, 1), 1000);
    const history = ApiKeyService.getUsageHistory(keyId, limitNum);

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting API key history:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get API key history',
    });
  }
});

/**
 * Revoke an API key
 * POST /api/api-keys/:keyId/revoke
 */
router.post('/:keyId/revoke', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const userId = req.userId;

    const apiKey = ApiKeyService.getKey(keyId);

    if (!apiKey || apiKey.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API key not found',
      });
    }

    ApiKeyService.revokeKey(keyId);

    return res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to revoke API key',
    });
  }
});

/**
 * Delete an API key
 * DELETE /api/api-keys/:keyId
 */
router.delete('/:keyId', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const userId = req.userId;

    const apiKey = ApiKeyService.getKey(keyId);

    if (!apiKey || apiKey.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API key not found',
      });
    }

    ApiKeyService.deleteKey(keyId);

    return res.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete API key',
    });
  }
});

/**
 * Rotate an API key
 * POST /api/api-keys/:keyId/rotate
 */
router.post('/:keyId/rotate', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const userId = req.userId;

    const apiKey = ApiKeyService.getKey(keyId);

    if (!apiKey || apiKey.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API key not found',
      });
    }

    const result = ApiKeyService.rotateKey(keyId);

    if (!result) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to rotate API key',
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        oldKey: {
          id: result.oldKey.id,
          name: result.oldKey.name,
          expiresAt: result.oldKey.expiresAt,
          message: 'Old key will be valid for 7 more days',
        },
        newKey: {
          id: result.newKey.id,
          key: result.newKey.key,
          name: result.newKey.name,
          tier: result.newKey.tier,
          rateLimit: result.newKey.rateLimit,
          message: 'Save your new API key in a secure location',
        },
      },
    });
  } catch (error) {
    console.error('Error rotating API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to rotate API key',
    });
  }
});

export default router;
