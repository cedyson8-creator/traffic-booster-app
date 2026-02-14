import { getDb } from '../db';
import { alertSubscriptions, alertHistory, errorLogs } from '../../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';

/**
 * Email Alert Service
 * Manages alert subscriptions and sends email notifications for critical events
 */

export type AlertType = 'error_rate' | 'webhook_failure' | 'rate_limit_exceeded' | 'api_key_rotated';

export interface AlertConfig {
  type: AlertType;
  threshold?: number;
  description: string;
  emailTemplate: (data: any) => { subject: string; message: string };
}

const alertConfigs: Record<AlertType, AlertConfig> = {
  error_rate: {
    type: 'error_rate',
    threshold: 5, // 5% error rate
    description: 'Error rate exceeds threshold',
    emailTemplate: (data) => ({
      subject: `🚨 Alert: High Error Rate Detected (${data.errorRate}%)`,
      message: `Your API is experiencing a high error rate of ${data.errorRate}%. 
      
Error Details:
- Total Errors: ${data.totalErrors}
- Error Level: ${data.level}
- Affected Endpoint: ${data.endpoint}
- Time Period: ${data.period}

Please investigate immediately and take corrective action.

View full error details: ${data.dashboardUrl}`,
    }),
  },
  webhook_failure: {
    type: 'webhook_failure',
    threshold: 3, // 3 consecutive failures
    description: 'Webhook delivery failures',
    emailTemplate: (data) => ({
      subject: `⚠️ Alert: Webhook Delivery Failures (${data.failureCount} failures)`,
      message: `Your webhook at ${data.webhookUrl} has failed ${data.failureCount} times.

Failure Details:
- Webhook ID: ${data.webhookId}
- Last Error: ${data.lastError}
- Success Rate: ${data.successRate}%
- Time Period: ${data.period}

The webhook will be disabled if failures continue.

View webhook details: ${data.dashboardUrl}`,
    }),
  },
  rate_limit_exceeded: {
    type: 'rate_limit_exceeded',
    description: 'API rate limit exceeded',
    emailTemplate: (data) => ({
      subject: `⚠️ Alert: Rate Limit Exceeded for API Key`,
      message: `Your API key "${data.keyName}" has exceeded its rate limit.

Rate Limit Details:
- API Key: ${data.keyId}
- Limit: ${data.limit} requests/hour
- Current Usage: ${data.usage} requests
- Tier: ${data.tier}

Consider upgrading your plan for higher limits.

View API key details: ${data.dashboardUrl}`,
    }),
  },
  api_key_rotated: {
    type: 'api_key_rotated',
    description: 'API key rotated',
    emailTemplate: (data) => ({
      subject: `ℹ️ Notification: API Key Rotated`,
      message: `Your API key "${data.keyName}" has been rotated.

Rotation Details:
- Old Key ID: ${data.oldKeyId}
- New Key ID: ${data.newKeyId}
- Grace Period: 7 days (old key still valid)
- Rotated At: ${data.rotatedAt}

Update your applications to use the new key before the grace period expires.

View API key details: ${data.dashboardUrl}`,
    }),
  },
};

/**
 * In-memory alert tracking for rate limiting
 */
const alertSentTracker: Map<string, number> = new Map();
const ALERT_COOLDOWN_MS = 3600000; // 1 hour

export class EmailAlertService {
  /**
   * Subscribe to alerts
   */
  static async subscribeToAlert(
    userId: number,
    email: string,
    alertType: AlertType,
    threshold?: number,
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const subscription = await db.insert(alertSubscriptions).values({
        userId,
        email,
        alertType,
        threshold,
        isActive: true,
      });

      console.log(`[EmailAlert] User ${userId} subscribed to ${alertType} alerts`);
      return subscription;
    } catch (error) {
      console.error('[EmailAlert] Error subscribing to alerts:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from alerts
   */
  static async unsubscribeFromAlert(subscriptionId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db
        .update(alertSubscriptions)
        .set({ isActive: false })
        .where(eq(alertSubscriptions.id, subscriptionId));

      console.log(`[EmailAlert] Subscription ${subscriptionId} disabled`);
    } catch (error) {
      console.error('[EmailAlert] Error unsubscribing from alerts:', error);
      throw error;
    }
  }

  /**
   * Get active alert subscriptions for user
   */
  static async getActiveSubscriptions(userId: number) {
    try {
      const db = await getDb();
      if (!db) return [];
      const subs = await db
        .select()
        .from(alertSubscriptions)
        .where(and(eq(alertSubscriptions.userId, userId), eq(alertSubscriptions.isActive, true)));

      return subs;
    } catch (error) {
      console.error('[EmailAlert] Error fetching subscriptions:', error);
      return [];
    }
  }

  /**
   * Send alert email
   */
  static async sendAlert(userId: number, alertType: AlertType, data: any) {
    try {
      const config = alertConfigs[alertType];

      if (!config) {
        console.warn(`[EmailAlert] Unknown alert type: ${alertType}`);
        return;
      }

      // Check cooldown to avoid alert spam
      const cooldownKey = `${userId}:${alertType}`;
      const lastSentTime = alertSentTracker.get(cooldownKey);

      if (lastSentTime && Date.now() - lastSentTime < ALERT_COOLDOWN_MS) {
        console.log(`[EmailAlert] Alert cooldown active for ${cooldownKey}, skipping`);
        return;
      }

      // Get active subscriptions
      const subscriptions = await this.getActiveSubscriptions(userId);
      const relevantSubs = subscriptions.filter((s: any) => s.alertType === alertType);

      if (relevantSubs.length === 0) {
        console.log(`[EmailAlert] No active subscriptions for ${alertType}`);
        return;
      }

      // Generate email content
      const { subject, message } = config.emailTemplate(data);

      // Send to each subscriber
      for (const sub of relevantSubs) {
        await this.sendEmailNotification(sub.id, userId, sub.email, alertType, subject, message);
      }

      // Update cooldown
      alertSentTracker.set(cooldownKey, Date.now());

      console.log(`[EmailAlert] Sent ${alertType} alerts to ${relevantSubs.length} subscribers`);
    } catch (error) {
      console.error('[EmailAlert] Error sending alert:', error);
    }
  }

  /**
   * Send email notification (placeholder for actual email service)
   */
  private static async sendEmailNotification(
    subscriptionId: number,
    userId: number,
    email: string,
    alertType: AlertType,
    subject: string,
    message: string,
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // For now, just log and record in database

      console.log(`[EmailAlert] Would send email to ${email}: ${subject}`);

      // Record in alert history
      await db.insert(alertHistory).values({
        subscriptionId,
        userId,
        email,
        alertType,
        subject,
        message,
        status: 'sent', // In production, set to 'pending' until confirmed
        sentAt: new Date(),
      });

      console.log(`[EmailAlert] Alert history recorded for ${email}`);
    } catch (error) {
      console.error('[EmailAlert] Error sending email notification:', error);

      // Record failure
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        await db.insert(alertHistory).values({
          subscriptionId,
          userId,
          email,
          alertType,
          subject,
          message,
          status: 'failed',
          sentAt: new Date(),
        });
      } catch (dbError) {
        console.error('[EmailAlert] Error recording failed alert:', dbError);
      }
    }
  }

  /**
   * Check error rate and send alert if threshold exceeded
   */
  static async checkErrorRate(userId: number, windowMinutes: number = 60) {
    try {
      const db = await getDb();
      if (!db) return;
      const subscriptions = await this.getActiveSubscriptions(userId);
      const errorRateSubs = subscriptions.filter((s: any) => s.alertType === 'error_rate');

      if (errorRateSubs.length === 0) {
        return;
      }

      // Get recent errors
      const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);
      const recentErrors = await db
        .select()
        .from(errorLogs)
        .where(and(eq(errorLogs.userId, userId), gte(errorLogs.createdAt, cutoffTime)));

      if (recentErrors.length === 0) {
        return;
      }

      // Calculate error rate
      const errorCount = recentErrors.filter((e: any) => e.level === 'error' || e.level === 'fatal').length;
      const errorRate = (errorCount / recentErrors.length) * 100;

      // Check against threshold
      for (const sub of errorRateSubs as any[]) {
        const threshold = sub.threshold || 5;

        if (errorRate >= threshold) {
          await this.sendAlert(userId, 'error_rate', {
            errorRate: errorRate.toFixed(2),
            totalErrors: errorCount,
            level: 'error',
            endpoint: recentErrors[0]?.endpoint || 'unknown',
            period: `${windowMinutes} minutes`,
            dashboardUrl: 'https://dashboard.example.com/monitoring',
          });
        }
      }
    } catch (error) {
      console.error('[EmailAlert] Error checking error rate:', error);
    }
  }

  /**
   * Get alert history for user
   */
  static async getAlertHistory(userId: number, limit: number = 50) {
    try {
      const db = await getDb();
      if (!db) return [];
      const history = await db
        .select()
        .from(alertHistory)
        .where(eq(alertHistory.userId, userId))
        .orderBy((t: any) => t.sentAt)
        .limit(limit);

      return history;
    } catch (error) {
      console.error('[EmailAlert] Error fetching alert history:', error);
      return [];
    }
  }

  /**
   * Clear alert cooldown (for testing)
   */
  static clearCooldown(userId: number, alertType: AlertType) {
    const key = `${userId}:${alertType}`;
    alertSentTracker.delete(key);
  }

  /**
   * Clear all cooldowns (for testing)
   */
  static clearAllCooldowns() {
    alertSentTracker.clear();
  }
}
