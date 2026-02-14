import { EmailSenderService } from './email-sender.service';
import { EmailRetryService } from './email-retry.service';
import { PerformanceAlertsService } from './performance-alerts.service';

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
        
        // Process failed emails for retry
        await EmailRetryService.processFailedEmails();
        
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
      await EmailRetryService.processFailedEmails();
    } catch (error) {
      console.error('[ReportScheduler] Error running job:', error);
    }
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
}
