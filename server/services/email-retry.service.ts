import { getDb } from '@/server/db';
import { emailDeliveryLogs } from '@/drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';
import { EmailSenderService } from './email-sender.service';

interface RetryableEmail {
  id: number;
  scheduleId: number;
  userId: number;
  email: string;
  retryCount: number;
  nextRetryAt: Date;
  lastError: string | null;
}

/**
 * Email Retry Service
 * Handles automatic retry of failed email sends with exponential backoff
 */
export class EmailRetryService {
  private static readonly MAX_RETRIES = 5;
  private static readonly BASE_DELAY_MINUTES = 5; // Start with 5 minutes
  private static readonly MAX_DELAY_HOURS = 24; // Cap at 24 hours

  /**
   * Calculate next retry time using exponential backoff
   * Delay = BASE_DELAY * (2 ^ retryCount), capped at MAX_DELAY
   */
  static calculateNextRetryTime(retryCount: number): Date {
    const delayMinutes = Math.min(
      this.BASE_DELAY_MINUTES * Math.pow(2, retryCount),
      this.MAX_DELAY_HOURS * 60
    );
    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }

  /**
   * Process failed emails and schedule retries
   */
  static async processFailedEmails(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.error('[EmailRetry] Database connection failed');
        return;
      }

      // Find emails ready for retry
      const failedEmails = await db
        .select({
          id: emailDeliveryLogs.id,
          scheduleId: emailDeliveryLogs.scheduleId,
          userId: emailDeliveryLogs.userId,
          email: emailDeliveryLogs.email,
          retryCount: emailDeliveryLogs.retryCount,
          nextRetryAt: emailDeliveryLogs.nextRetryAt,
          lastError: emailDeliveryLogs.errorMessage,
        })
        .from(emailDeliveryLogs)
        .where(
          and(
            eq(emailDeliveryLogs.status, 'failed'),
            lt(emailDeliveryLogs.nextRetryAt, new Date()),
            lt(emailDeliveryLogs.retryCount, this.MAX_RETRIES)
          )
        );

      console.log(`[EmailRetry] Found ${failedEmails.length} emails ready for retry`);

      for (const failedEmail of failedEmails) {
        await this.retryEmail(failedEmail);
      }
    } catch (error) {
      console.error('[EmailRetry] Error processing failed emails:', error);
    }
  }

  /**
   * Retry sending a single email
   */
  private static async retryEmail(email: RetryableEmail): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.error('[EmailRetry] Database connection failed for retry');
        return;
      }

      console.log(
        `[EmailRetry] Retrying email ${email.id} (attempt ${email.retryCount + 1}/${this.MAX_RETRIES})`
      );

      // Attempt to send
      const result = await EmailSenderService.sendReport({
        email: email.email,
        subject: 'Scheduled Report (Retry)',
        htmlContent: '<p>Retrying scheduled report delivery...</p>',
      });

      if (result !== null) {
        // Update as sent
        await db
          .update(emailDeliveryLogs)
          .set({
            status: 'sent',
            sentAt: new Date(),
            retryCount: email.retryCount + 1,
            errorMessage: null,
          })
          .where(eq(emailDeliveryLogs.id, email.id));

        console.log(`[EmailRetry] Successfully retried email ${email.id}`);
      } else {
        // Schedule next retry
        const nextRetry = this.calculateNextRetryTime(email.retryCount + 1);

        await db
          .update(emailDeliveryLogs)
          .set({
            retryCount: email.retryCount + 1,
            nextRetryAt: nextRetry,
            errorMessage: 'Retry failed',
          })
          .where(eq(emailDeliveryLogs.id, email.id));

        console.log(
          `[EmailRetry] Retry failed for email ${email.id}, next attempt at ${nextRetry.toISOString()}`
        );
      }
    } catch (error) {
      console.error(`[EmailRetry] Error retrying email ${email.id}:`, error);

      try {
        const db = await getDb();
        if (db && email.retryCount + 1 >= this.MAX_RETRIES) {
          // Mark as permanently failed after max retries
          await db
            .update(emailDeliveryLogs)
            .set({
              status: 'failed',
              retryCount: email.retryCount + 1,
              errorMessage: `Max retries exceeded: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
            .where(eq(emailDeliveryLogs.id, email.id));

          console.log(`[EmailRetry] Email ${email.id} marked as permanently failed`);
        }
      } catch (updateError) {
        console.error('[EmailRetry] Error updating email status:', updateError);
      }
    }
  }

  /**
   * Get retry statistics
   */
  static async getRetryStats(): Promise<{
    pendingRetries: number;
    totalFailed: number;
    avgRetryCount: number;
  }> {
    try {
      const db = await getDb();
      if (!db) {
        return { pendingRetries: 0, totalFailed: 0, avgRetryCount: 0 };
      }

      const stats = await db
        .select({
          status: emailDeliveryLogs.status,
          retryCount: emailDeliveryLogs.retryCount,
        })
        .from(emailDeliveryLogs)
        .where(eq(emailDeliveryLogs.status, 'failed'));

      const pendingRetries = stats.filter(
        (s: any) => s.status === 'failed'
      ).length;

      const avgRetries = stats.length > 0 
        ? Math.round(stats.reduce((sum, s: any) => sum + s.retryCount, 0) / stats.length)
        : 0;

      return {
        pendingRetries,
        totalFailed: stats.length,
        avgRetryCount: avgRetries,
      };
    } catch (error) {
      console.error('[EmailRetry] Error getting retry stats:', error);
      return { pendingRetries: 0, totalFailed: 0, avgRetryCount: 0 };
    }
  }
}
