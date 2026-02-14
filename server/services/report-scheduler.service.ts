import { EmailSenderService } from './email-sender.service';

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
        await EmailSenderService.sendDueReports();
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
    } catch (error) {
      console.error('[ReportScheduler] Error running job:', error);
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
