import express, { Request, Response } from 'express';
import { handleWebhookEvent } from '@/server/services/webhook-handler.service';

const router = express.Router();

/**
 * POST /api/webhooks/delivery
 * Receive webhook events from email service (SendGrid, Nodemailer, etc.)
 * 
 * Expected payload:
 * {
 *   userId: number,
 *   logId: number,
 *   email: string,
 *   event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained',
 *   timestamp?: number,
 *   metadata?: object
 * }
 */
router.post('/delivery', async (req: Request, res: Response) => {
  try {
    const { userId, logId, email, event, timestamp, metadata } = req.body;

    // Validate required fields
    if (!userId || !logId || !email || !event) {
      return res.status(400).json({
        error: 'Missing required fields: userId, logId, email, event',
      });
    }

    // Validate event type
    const validEvents = ['delivered', 'opened', 'clicked', 'bounced', 'complained'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({
        error: `Invalid event type. Must be one of: ${validEvents.join(', ')}`,
      });
    }

    // Process webhook event
    const success = await handleWebhookEvent(userId, logId, {
      email,
      event,
      timestamp,
      metadata,
    });

    if (success) {
      res.json({ success: true, message: 'Webhook event processed' });
    } else {
      res.status(500).json({ error: 'Failed to process webhook event' });
    }
  } catch (error) {
    console.error('[Webhooks] Error processing delivery webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/delivery/batch
 * Receive multiple webhook events in a single request
 */
router.post('/delivery/batch', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'events must be an array' });
    }

    let processed = 0;
    let failed = 0;

    for (const event of events) {
      const { userId, logId, email, eventType, timestamp, metadata } = event;

      if (!userId || !logId || !email || !eventType) {
        failed++;
        continue;
      }

      const success = await handleWebhookEvent(userId, logId, {
        email,
        event: eventType,
        timestamp,
        metadata,
      });

      if (success) {
        processed++;
      } else {
        failed++;
      }
    }

    res.json({
      success: true,
      processed,
      failed,
      message: `Processed ${processed} events, ${failed} failed`,
    });
  } catch (error) {
    console.error('[Webhooks] Error processing batch webhooks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/webhooks/events/:logId
 * Get all webhook events for a specific email delivery log
 */
router.get('/events/:logId', async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;
    const userId = req.query.userId as string;

    if (!userId || !logId) {
      return res.status(400).json({ error: 'userId and logId required' });
    }

    // In a real app, fetch from database
    // For now, return empty array
    res.json({
      success: true,
      logId: parseInt(logId),
      events: [],
      message: 'No events found',
    });
  } catch (error) {
    console.error('[Webhooks] Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
