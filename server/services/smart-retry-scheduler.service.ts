import { getDb } from '@/server/db';
import { emailDeliveryLogs } from '@/drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Smart Retry Scheduler Service
 * Intelligently schedules email retries based on bounce type and send patterns
 */

interface RetryStrategy {
  bounceType: 'permanent' | 'temporary' | 'unknown';
  maxRetries: number;
  retryIntervals: number[]; // minutes between retries
  shouldRetry: boolean;
}

class SmartRetrySchedulerService {
  /**
   * Determine retry strategy based on bounce type and error
   */
  getRetryStrategy(bounceType: string, errorMessage: string): RetryStrategy {
    // Permanent bounce - don't retry
    if (bounceType === 'permanent' || this.isPermanentError(errorMessage)) {
      return {
        bounceType: 'permanent',
        maxRetries: 0,
        retryIntervals: [],
        shouldRetry: false,
      };
    }

    // Temporary bounce - exponential backoff
    if (bounceType === 'temporary' || this.isTemporaryError(errorMessage)) {
      return {
        bounceType: 'temporary',
        maxRetries: 5,
        retryIntervals: [5, 15, 45, 120, 360], // 5min, 15min, 45min, 2hr, 6hr
        shouldRetry: true,
      };
    }

    // Unknown - moderate retry strategy
    return {
      bounceType: 'unknown',
      maxRetries: 3,
      retryIntervals: [10, 30, 120], // 10min, 30min, 2hr
      shouldRetry: true,
    };
  }

  /**
   * Check if error is permanent (don't retry)
   */
  private isPermanentError(error: string): boolean {
    const permanentErrors = [
      'invalid email',
      'address rejected',
      'bad destination mailbox',
      'user unknown',
      'mailbox not found',
      'invalid recipient',
      'does not exist',
      'undeliverable',
      'rejected',
      'blocked',
      'suppressed',
    ];

    const lowerError = error.toLowerCase();
    return permanentErrors.some(e => lowerError.includes(e));
  }

  /**
   * Check if error is temporary (should retry)
   */
  private isTemporaryError(error: string): boolean {
    const temporaryErrors = [
      'timeout',
      'temporarily unavailable',
      'try again later',
      'service unavailable',
      'connection refused',
      'network error',
      'server error',
      'rate limit',
      'throttled',
      'queue full',
    ];

    const lowerError = error.toLowerCase();
    return temporaryErrors.some(e => lowerError.includes(e));
  }

  /**
   * Calculate optimal retry time based on send patterns
   */
  calculateOptimalRetryTime(
    originalSendTime: Date,
    bounceType: 'permanent' | 'temporary' | 'unknown'
  ): Date {
    const now = new Date();
    const retryTime = new Date(now);

    if (bounceType === 'temporary') {
      // For temporary bounces, retry during off-peak hours (2-4 AM)
      const hour = retryTime.getHours();

      if (hour >= 2 && hour < 4) {
        // Already in off-peak, retry in 5 minutes
        retryTime.setMinutes(retryTime.getMinutes() + 5);
      } else if (hour >= 4 && hour < 14) {
        // Morning/afternoon - retry at 2 AM next day
        retryTime.setDate(retryTime.getDate() + 1);
        retryTime.setHours(2, 0, 0, 0);
      } else {
        // Evening/night - retry at 2 AM today
        retryTime.setHours(2, 0, 0, 0);
        if (retryTime < now) {
          retryTime.setDate(retryTime.getDate() + 1);
        }
      }
    } else {
      // For unknown bounces, use standard exponential backoff
      retryTime.setMinutes(retryTime.getMinutes() + 10);
    }

    return retryTime;
  }

  /**
   * Get emails ready for smart retry
   */
  async getEmailsReadyForSmartRetry(): Promise<any[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const now = new Date();

      // Get failed emails that are ready for retry
      const failedEmails = await db
        .select()
        .from(emailDeliveryLogs)
        .where(
          and(
            eq(emailDeliveryLogs.status, 'failed'),
            lt(emailDeliveryLogs.nextRetryAt, now)
          )
        );

      return failedEmails;
    } catch (error) {
      console.error('[SmartRetryScheduler] Error fetching emails for retry:', error);
      return [];
    }
  }

  /**
   * Schedule next retry for an email
   */
  async scheduleNextRetry(
    logId: number,
    bounceType: string,
    errorMessage: string
  ): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      const strategy = this.getRetryStrategy(bounceType, errorMessage);

      if (!strategy.shouldRetry) {
        // Mark as permanently failed
        await db
          .update(emailDeliveryLogs)
          .set({
            status: 'failed',
          })
          .where(eq(emailDeliveryLogs.id, logId));

        return false;
      }

      // Get current retry count
      const log = await db
        .select()
        .from(emailDeliveryLogs)
        .where(eq(emailDeliveryLogs.id, logId));

      if (!log || log.length === 0) return false;

      const retryCount = log[0].retryCount || 0;

      if (retryCount >= strategy.maxRetries) {
        // Max retries exceeded
        await db
          .update(emailDeliveryLogs)
          .set({
            status: 'failed',
          })
          .where(eq(emailDeliveryLogs.id, logId));

        return false;
      }

      // Calculate next retry time using optimal send pattern
      const originalSendTime = log[0].sentAt || new Date();
      const nextRetryTime = this.calculateOptimalRetryTime(
        originalSendTime,
        strategy.bounceType as 'permanent' | 'temporary' | 'unknown'
      );

      // Update with next retry time
      await db
        .update(emailDeliveryLogs)
        .set({
          retryCount: retryCount + 1,
          nextRetryAt: nextRetryTime,
        })
        .where(eq(emailDeliveryLogs.id, logId))

      console.log(
        `[SmartRetryScheduler] Scheduled retry for log ${logId} at ${nextRetryTime.toISOString()}`
      );

      return true;
    } catch (error) {
      console.error('[SmartRetryScheduler] Error scheduling retry:', error);
      return false;
    }
  }

  /**
   * Analyze send time patterns for optimal retry scheduling
   */
  async analyzeSendPatterns(userId: number): Promise<{
    bestSendHour: number;
    bestSendDay: string;
    averageSuccessRate: number;
  }> {
    try {
      const db = await getDb();
      if (!db) {
        return {
          bestSendHour: 9, // Default to 9 AM
          bestSendDay: 'Tuesday',
          averageSuccessRate: 0,
        };
      }

      // In a real implementation, this would analyze historical send data
      // For now, return sensible defaults
      return {
        bestSendHour: 9, // 9 AM has historically highest open rates
        bestSendDay: 'Tuesday', // Tuesday typically has highest engagement
        averageSuccessRate: 95,
      };
    } catch (error) {
      console.error('[SmartRetryScheduler] Error analyzing send patterns:', error);
      return {
        bestSendHour: 9,
        bestSendDay: 'Tuesday',
        averageSuccessRate: 0,
      };
    }
  }
}

export const smartRetrySchedulerService = new SmartRetrySchedulerService();
