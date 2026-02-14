import { EmailSenderService } from './email-sender.service';
import { EmailRetryService } from './email-retry.service';
import { PerformanceAlertsService } from './performance-alerts.service';
import { smartRetrySchedulerService } from './smart-retry-scheduler.service';

/**
 * Report Scheduler Service
 * Manages background jobs for sending scheduled reports
 */
export class ReportSchedulerService {
  private static intervalId: ReturnType<typeof setInterval> | null = null;
  private static isRunning = false;

  /**
   * Start the report scheduler
   * Checks for due reports every minute
   */
  static start(): void {
    if (this.isRunning) {
      console.warn('[ReportScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[ReportScheduler] Starting report scheduler');

    // Check for due reports every minute
    this.intervalId = setInterval(async () => {
      try {
        // Send due reports
        await EmailSenderService.sendDueReports();
        
        // Process failed emails with smart retry logic
        await this.processSmartRetries();
        
        // Check performance metrics and create alerts
        // Note: In production, would iterate through all users
        // For now, this is called per-user as needed
      } catch (error) {
        console.error('[ReportScheduler] Error in scheduled job:', error);
      }
    }, 60 * 1000); // 60 seconds

    // Also run immediately on startup
    this.runNow();
  }

  /**
   * Stop the report scheduler
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[ReportScheduler] Stopped');
  }

  /**
   * Run the scheduler immediately (for testing)
   */
  static async runNow(): Promise<void> {
    try {
      console.log('[ReportScheduler] Running scheduled job now');
      await EmailSenderService.sendDueReports();
      await this.processSmartRetries();
    } catch (error) {
      console.error('[ReportScheduler] Error running job:', error);
    }
  }

  /**
   * Process failed emails with smart retry logic
   * Differentiates between permanent and temporary bounces
   */
  private static async processSmartRetries(): Promise<void> {
    try {
      // Get emails ready for smart retry
      const emailsToRetry = await smartRetrySchedulerService.getEmailsReadyForSmartRetry();
      
      if (emailsToRetry.length === 0) {
        return;
      }

      console.log(`[ReportScheduler] Processing ${emailsToRetry.length} emails with smart retry logic`);

      for (const email of emailsToRetry) {
        // Determine bounce type from error message
        const bounceType = this.determineBounceType(email.errorMessage);
        
        // Schedule next retry based on bounce type
        await smartRetrySchedulerService.scheduleNextRetry(
          email.id,
          bounceType,
          email.errorMessage || 'Unknown error'
        );
      }
    } catch (error) {
      console.error('[ReportScheduler] Error processing smart retries:', error);
    }
  }

  /**
   * Determine bounce type from error message
   */
  private static determineBounceType(errorMessage: string | null): string {
    if (!errorMessage) return 'unknown';

    const lowerError = errorMessage.toLowerCase();

    // Permanent bounce indicators
    if (
      lowerError.includes('invalid email') ||
      lowerError.includes('address rejected') ||
      lowerError.includes('user unknown') ||
      lowerError.includes('mailbox not found') ||
      lowerError.includes('does not exist') ||
      lowerError.includes('suppressed')
    ) {
      return 'permanent';
    }

    // Temporary bounce indicators
    if (
      lowerError.includes('timeout') ||
      lowerError.includes('temporarily unavailable') ||
      lowerError.includes('try again later') ||
      lowerError.includes('service unavailable') ||
      lowerError.includes('rate limit')
    ) {
      return 'temporary';
    }

    return 'unknown';
  }

  /**
   * Check performance metrics for a user and create alerts
   */
  static async checkUserPerformance(userId: number): Promise<void> {
    try {
      await PerformanceAlertsService.checkPerformance(userId);
    } catch (error) {
      console.error('[ReportScheduler] Error checking performance:', error);
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus(): { isRunning: boolean; lastRun?: Date } {
    return {
      isRunning: this.isRunning,
    };
  }

  /**
   * Get retry statistics including smart retry insights
   */
  static async getRetryStats(): Promise<any> {
    try {
      const basicStats = await EmailRetryService.getRetryStats();
      return {
        ...basicStats,
        smartRetryEnabled: true,
      };
    } catch (error) {
      console.error('[ReportScheduler] Error getting retry stats:', error);
      return { pendingRetries: 0, totalFailed: 0, avgRetryCount: 0, smartRetryEnabled: true };
    }
  }
}
