import { Router, Request, Response } from 'express';
import { WebhookService, type WebhookEventType } from '../services/webhook.service';
import { apiKeyAuth } from '../middleware/api-key.middleware';

const router = Router();

/**
 * Register a new webhook
 * POST /api/webhooks
 */
router.post('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { url, events, secret } = req.body;
    const userId = req.userId;

    if (!url) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Webhook URL is required',
      });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'At least one event type is required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid webhook URL format',
      });
    }

    const webhook = WebhookService.registerWebhook(userId!, url, events as WebhookEventType[], secret);

    return res.status(201).json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error) {
    console.error('Error registering webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register webhook',
    });
  }
});

/**
 * List webhooks for authenticated user
 * GET /api/webhooks
 */
router.get('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const webhooks = WebhookService.listWebhooks(userId!);

    return res.json({
      success: true,
      data: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.isActive,
        createdAt: w.createdAt,
        lastTriggeredAt: w.lastTriggeredAt,
        failureCount: w.failureCount,
      })),
    });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list webhooks',
    });
  }
});

/**
 * Get webhook details
 * GET /api/webhooks/:webhookId
 */
router.get('/:webhookId', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId;

    const webhook = WebhookService.getWebhook(webhookId);

    if (!webhook || webhook.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Webhook not found',
      });
    }

    return res.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
        lastTriggeredAt: webhook.lastTriggeredAt,
        failureCount: webhook.failureCount,
        maxRetries: webhook.maxRetries,
      },
    });
  } catch (error) {
    console.error('Error getting webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get webhook',
    });
  }
});

/**
 * Update webhook
 * PATCH /api/webhooks/:webhookId
 */
router.patch('/:webhookId', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId;
    const { url, events, isActive } = req.body;

    const webhook = WebhookService.getWebhook(webhookId);

    if (!webhook || webhook.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Webhook not found',
      });
    }

    const updates: any = {};

    if (url) {
      try {
        new URL(url);
        updates.url = url;
      } catch {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Invalid webhook URL format',
        });
      }
    }

    if (events) {
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'At least one event type is required',
        });
      }
      updates.events = events;
    }

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
    }

    const updated = WebhookService.updateWebhook(webhookId, updates);

    return res.json({
      success: true,
      data: {
        id: updated!.id,
        url: updated!.url,
        events: updated!.events,
        isActive: updated!.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update webhook',
    });
  }
});

/**
 * Delete webhook
 * DELETE /api/webhooks/:webhookId
 */
router.delete('/:webhookId', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId;

    const webhook = WebhookService.getWebhook(webhookId);

    if (!webhook || webhook.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Webhook not found',
      });
    }

    WebhookService.deleteWebhook(webhookId);

    return res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete webhook',
    });
  }
});

/**
 * Get webhook delivery history
 * GET /api/webhooks/:webhookId/deliveries
 */
router.get('/:webhookId/deliveries', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const { limit = '100' } = req.query;
    const userId = req.userId;

    const webhook = WebhookService.getWebhook(webhookId);

    if (!webhook || webhook.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Webhook not found',
      });
    }

    const limitNum = Math.min(Math.max(parseInt(limit as string) || 100, 1), 1000);
    const deliveries = WebhookService.getDeliveryHistory(webhookId, limitNum);

    return res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error('Error getting webhook deliveries:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get webhook deliveries',
    });
  }
});

/**
 * Get webhook statistics
 * GET /api/webhooks/:webhookId/stats
 */
router.get('/:webhookId/stats', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId;

    const webhook = WebhookService.getWebhook(webhookId);

    if (!webhook || webhook.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Webhook not found',
      });
    }

    const stats = WebhookService.getWebhookStats(webhookId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting webhook stats:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get webhook stats',
    });
  }
});

/**
 * Test webhook delivery
 * POST /api/webhooks/:webhookId/test
 */
router.post('/:webhookId/test', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId;

    const webhook = WebhookService.getWebhook(webhookId);

    if (!webhook || webhook.userId !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Webhook not found',
      });
    }

    const result = await WebhookService.testWebhook(webhookId);

    return res.json({
      success: result.success,
      data: {
        statusCode: result.statusCode,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to test webhook',
    });
  }
});

export default router;
