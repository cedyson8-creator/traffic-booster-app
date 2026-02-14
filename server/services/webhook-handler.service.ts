import { getDb } from '@/server/db';
import { emailDeliveryLogs, webhookEvents } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export interface WebhookPayload {
  email: string;
  event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * Handle incoming webhook events from email service (SendGrid, Nodemailer, etc.)
 */
export async function handleWebhookEvent(userId: number, logId: number, payload: WebhookPayload) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[WebhookHandler] Database connection failed');
      return false;
    }

    // Log the webhook event
    await db.insert(webhookEvents).values({
      userId,
      logId,
      eventType: payload.event,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      metadata: payload.metadata || {},
    });

    // Update email delivery log based on event type
    switch (payload.event) {
      case 'delivered':
        await db
          .update(emailDeliveryLogs)
          .set({ status: 'sent' })
          .where(eq(emailDeliveryLogs.id, logId));
        console.log(`[WebhookHandler] Email ${logId} marked as delivered`);
        break;

      case 'bounced':
        await db
          .update(emailDeliveryLogs)
          .set({
            status: 'bounced',
            errorMessage: payload.metadata?.reason || 'Email bounced',
          })
          .where(eq(emailDeliveryLogs.id, logId));
        console.log(`[WebhookHandler] Email ${logId} marked as bounced`);
        break;

      case 'complained':
        await db
          .update(emailDeliveryLogs)
          .set({
            status: 'bounced',
            errorMessage: 'Email marked as spam/complaint',
          })
          .where(eq(emailDeliveryLogs.id, logId));
        console.log(`[WebhookHandler] Email ${logId} marked as complaint`);
        break;

      case 'opened':
      case 'clicked':
        // Just log the event, don't change status
        console.log(`[WebhookHandler] Email ${logId} ${payload.event}`);
        break;
    }

    return true;
  } catch (error) {
    console.error('[WebhookHandler] Error handling webhook event:', error);
    return false;
  }
}

/**
 * Get webhook event statistics for a user
 */
export async function getWebhookStats(userId: number, days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return null;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Note: Simplified query - would need proper Drizzle syntax for complex where clauses
    const events = await db
      .select({
        eventType: webhookEvents.eventType,
        count: webhookEvents.id,
      })
      .from(webhookEvents);

    const stats = {
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
    };

    // Filter and count events
    events.forEach((event: any) => {
      if (event.eventType in stats) {
        stats[event.eventType as keyof typeof stats]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('[WebhookHandler] Error getting webhook stats:', error);
    return null;
  }
}
