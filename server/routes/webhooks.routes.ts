import express, { Request, Response } from 'express';
import { handleWebhookEvent } from '@/server/services/webhook-handler.service';
import { webhookConfigService } from '@/server/services/webhook-config.service';
import { smartRetrySchedulerService } from '@/server/services/smart-retry-scheduler.service';

const router = express.Router();

/**
 * POST /api/webhooks/sendgrid
 * Receive webhook events from SendGrid with signature verification
 */
router.post('/sendgrid', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
    const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;
    const config = webhookConfigService.getConfig('sendgrid');

    if (!config?.signingSecret) {
      console.warn('[Webhooks] SendGrid signing secret not configured');
      return res.status(400).json({ error: 'SendGrid not configured' });
    }

    // Verify signature
    const isValid = webhookConfigService.verifySendGridSignature(
      timestamp,
      signature,
      JSON.stringify(req.body),
      config.signingSecret
    );

    if (!isValid) {
      console.warn('[Webhooks] Invalid SendGrid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process SendGrid events
    const events = Array.isArray(req.body) ? req.body : [req.body];
    let processed = 0;

    for (const event of events) {
      const parsedEvent = webhookConfigService.parseSendGridEvent(event);
      
      // Extract userId and logId from metadata
      const userId = event.userId || 1; // Default for testing
      const logId = event.logId || 1;

      const success = await handleWebhookEvent(userId, logId, {
        email: parsedEvent.email,
        event: parsedEvent.event as any,
        timestamp: parsedEvent.timestamp,
        metadata: parsedEvent.metadata,
      });

      if (success) {
        processed++;
      }
    }

    res.json({
      success: true,
      processed,
      message: `Processed ${processed} SendGrid events`,
    });
  } catch (error) {
    console.error('[Webhooks] Error processing SendGrid webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/mailgun
 * Receive webhook events from Mailgun with signature verification
 */
router.post('/mailgun', async (req: Request, res: Response) => {
  try {
    const { signature, timestamp, token } = req.body;
    const config = webhookConfigService.getConfig('mailgun');

    if (!config?.signingSecret) {
      console.warn('[Webhooks] Mailgun signing secret not configured');
      return res.status(400).json({ error: 'Mailgun not configured' });
    }

    // Verify signature
    const isValid = webhookConfigService.verifyMailgunSignature(
      timestamp,
      token,
      signature,
      config.signingSecret
    );

    if (!isValid) {
      console.warn('[Webhooks] Invalid Mailgun signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process Mailgun event
    const parsedEvent = webhookConfigService.parseMailgunEvent(req.body);
    
    const userId = req.body.userId || 1;
    const logId = req.body.logId || 1;

    const success = await handleWebhookEvent(userId, logId, {
      email: parsedEvent.email,
      event: parsedEvent.event as any,
      timestamp: parsedEvent.timestamp,
      metadata: parsedEvent.metadata,
    });

    res.json({
      success,
      message: success ? 'Mailgun event processed' : 'Failed to process event',
    });
  } catch (error) {
    console.error('[Webhooks] Error processing Mailgun webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/aws-ses
 * Receive webhook events from AWS SES (SNS format)
 */
router.post('/aws-ses', async (req: Request, res: Response) => {
  try {
    // AWS SNS sends subscription confirmation messages
    if (req.body.Type === 'SubscriptionConfirmation') {
      console.log('[Webhooks] AWS SNS subscription confirmation received');
      return res.json({ success: true, message: 'Subscription confirmed' });
    }

    if (req.body.Type !== 'Notification') {
      return res.status(400).json({ error: 'Invalid SNS message type' });
    }

    const config = webhookConfigService.getConfig('aws-ses');
    if (!config) {
      console.warn('[Webhooks] AWS SES not configured');
      return res.status(400).json({ error: 'AWS SES not configured' });
    }

    // Parse AWS SES event
    const parsedEvent = webhookConfigService.parseAwsSesEvent(req.body);
    
    const userId = req.body.userId || 1;
    const logId = req.body.logId || 1;

    const success = await handleWebhookEvent(userId, logId, {
      email: parsedEvent.email,
      event: parsedEvent.event as any,
      timestamp: parsedEvent.timestamp,
      metadata: parsedEvent.metadata,
    });

    res.json({
      success,
      message: success ? 'AWS SES event processed' : 'Failed to process event',
    });
  } catch (error) {
    console.error('[Webhooks] Error processing AWS SES webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/delivery
 * Generic webhook endpoint for any email service
 * Used for testing and services without signature verification
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

/**
 * POST /api/webhooks/test
 * Test webhook endpoint for development
 * Simulates a webhook event for testing
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { userId = 1, logId = 1, email = 'test@example.com', event = 'delivered' } = req.body;

    const success = await handleWebhookEvent(userId, logId, {
      email,
      event: event as any,
      timestamp: Date.now(),
      metadata: { source: 'test' },
    });

    res.json({
      success,
      message: success ? 'Test webhook processed' : 'Failed to process test webhook',
    });
  } catch (error) {
    console.error('[Webhooks] Error processing test webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
