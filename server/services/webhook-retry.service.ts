/**
 * Webhook Retry Service
 * Implements exponential backoff retry logic for failed webhook deliveries
 */

export interface WebhookRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
}

export interface WebhookRetryAttempt {
  id: string;
  webhookId: string;
  eventId: string;
  attemptNumber: number;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed' | 'scheduled';
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
  nextRetryTime?: Date;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
}

export interface WebhookRetryPolicy {
  webhookId: string;
  enabled: boolean;
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: WebhookRetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 3600000, // 1 hour
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
};

/**
 * Webhook Retry Service
 */
export class WebhookRetryService {
  private retryPolicies: Map<string, WebhookRetryPolicy> = new Map();
  private retryAttempts: WebhookRetryAttempt[] = [];
  private retryQueue: Map<string, ReturnType<typeof setTimeout>> = new Map(); // webhookId -> timeout

  /**
   * Calculate delay for next retry with exponential backoff
   */
  static calculateNextDelay(
    attemptNumber: number,
    config: WebhookRetryConfig,
  ): number {
    // Calculate exponential backoff: initialDelay * (backoffMultiplier ^ attemptNumber)
    const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);

    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

    // Add jitter: randomize by ±(jitterFactor * delay)
    const jitterRange = cappedDelay * config.jitterFactor;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;

    return Math.max(0, Math.floor(cappedDelay + jitter));
  }

  /**
   * Get retry policy for webhook
   */
  getRetryPolicy(webhookId: string): WebhookRetryPolicy {
    return (
      this.retryPolicies.get(webhookId) || {
        webhookId,
        enabled: true,
        ...DEFAULT_RETRY_CONFIG,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Set retry policy for webhook
   */
  setRetryPolicy(webhookId: string, config: Partial<WebhookRetryConfig>): WebhookRetryPolicy {
    const policy: WebhookRetryPolicy = {
      webhookId,
      enabled: true,
      ...DEFAULT_RETRY_CONFIG,
      ...config,
      createdAt: this.retryPolicies.get(webhookId)?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.retryPolicies.set(webhookId, policy);
    return policy;
  }

  /**
   * Record a retry attempt
   */
  recordAttempt(
    webhookId: string,
    eventId: string,
    attemptNumber: number,
    status: 'success' | 'failed',
    statusCode?: number,
    responseTime?: number,
    errorMessage?: string,
  ): WebhookRetryAttempt {
    const policy = this.getRetryPolicy(webhookId);
    const attempt: WebhookRetryAttempt = {
      id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      webhookId,
      eventId,
      attemptNumber,
      timestamp: new Date(),
      status: status === 'success' ? 'success' : 'failed',
      statusCode,
      responseTime,
      errorMessage,
    };

    // Calculate next retry time if failed and retries remaining
    if (status === 'failed' && attemptNumber < policy.maxRetries && policy.enabled) {
      const nextDelay = WebhookRetryService.calculateNextDelay(attemptNumber, policy);
      attempt.nextRetryTime = new Date(Date.now() + nextDelay);
      attempt.status = 'scheduled';

      console.log(
        `[WebhookRetry] Webhook ${webhookId} scheduled for retry #${attemptNumber + 1} in ${nextDelay}ms`,
      );
    }

    this.retryAttempts.push(attempt);
    return attempt;
  }

  /**
   * Get retry history for webhook
   */
  getRetryHistory(webhookId: string, eventId?: string): WebhookRetryAttempt[] {
    return this.retryAttempts.filter(
      (attempt) => attempt.webhookId === webhookId && (!eventId || attempt.eventId === eventId),
    );
  }

  /**
   * Get pending retries
   */
  getPendingRetries(): WebhookRetryAttempt[] {
    return this.retryAttempts.filter((attempt) => attempt.status === 'scheduled' && attempt.nextRetryTime && attempt.nextRetryTime <= new Date());
  }

  /**
   * Get retry statistics
   */
  getRetryStats(webhookId?: string): {
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageResponseTime: number;
  } {
    let attempts = this.retryAttempts;

    if (webhookId) {
      attempts = attempts.filter((a) => a.webhookId === webhookId);
    }

    const successCount = attempts.filter((a) => a.status === 'success').length;
    const failureCount = attempts.filter((a) => a.status === 'failed').length;
    const totalAttempts = attempts.length;

    const responseTimes = attempts.filter((a) => a.responseTime).map((a) => a.responseTime!);
    const averageResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    return {
      totalAttempts,
      successCount,
      failureCount,
      successRate: totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0,
      averageResponseTime,
    };
  }

  /**
   * Should retry webhook delivery
   */
  shouldRetry(webhookId: string, attemptNumber: number): boolean {
    const policy = this.getRetryPolicy(webhookId);
    return policy.enabled && attemptNumber < policy.maxRetries;
  }

  /**
   * Get next retry time
   */
  getNextRetryTime(webhookId: string, attemptNumber: number): Date | null {
    if (!this.shouldRetry(webhookId, attemptNumber)) {
      return null;
    }

    const policy = this.getRetryPolicy(webhookId);
    const delay = WebhookRetryService.calculateNextDelay(attemptNumber, policy);
    return new Date(Date.now() + delay);
  }

  /**
   * Schedule webhook retry
   */
  scheduleRetry(
    webhookId: string,
    eventId: string,
    attemptNumber: number,
    callback: () => Promise<void>,
  ): void {
    const nextRetryTime = this.getNextRetryTime(webhookId, attemptNumber);

    if (!nextRetryTime) {
      console.log(`[WebhookRetry] Max retries reached for webhook ${webhookId}`);
      return;
    }

    const delayMs = nextRetryTime.getTime() - Date.now();

    // Clear existing timeout if any
    const existingTimeout = this.retryQueue.get(webhookId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new retry
    const timeout = setTimeout(async () => {
      try {
        console.log(`[WebhookRetry] Executing retry #${attemptNumber + 1} for webhook ${webhookId}`);
        await callback();
        this.retryQueue.delete(webhookId);
      } catch (error) {
        console.error(`[WebhookRetry] Retry failed for webhook ${webhookId}:`, error);
      }
    }, delayMs);

    this.retryQueue.set(webhookId, timeout);
  }

  /**
   * Cancel pending retries
   */
  cancelRetries(webhookId: string): void {
    const timeout = this.retryQueue.get(webhookId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryQueue.delete(webhookId);
      console.log(`[WebhookRetry] Cancelled pending retries for webhook ${webhookId}`);
    }
  }

  /**
   * Get retry backoff schedule
   */
  getBackoffSchedule(webhookId: string, maxAttempts?: number): number[] {
    const policy = this.getRetryPolicy(webhookId);
    const attempts = maxAttempts || policy.maxRetries;
    const schedule: number[] = [];

    for (let i = 1; i <= attempts; i++) {
      const delay = WebhookRetryService.calculateNextDelay(i, policy);
      schedule.push(delay);
    }

    return schedule;
  }

  /**
   * Export retry logs
   */
  exportRetryLogs(webhookId?: string, format: 'json' | 'csv' = 'json'): string {
    let attempts = this.retryAttempts;

    if (webhookId) {
      attempts = attempts.filter((a) => a.webhookId === webhookId);
    }

    if (format === 'json') {
      return JSON.stringify(attempts, null, 2);
    } else {
      // CSV format
      const headers = ['ID', 'Webhook ID', 'Event ID', 'Attempt', 'Status', 'Status Code', 'Response Time (ms)', 'Error', 'Timestamp'];

      const rows = attempts.map((attempt) => [
        attempt.id,
        attempt.webhookId,
        attempt.eventId,
        attempt.attemptNumber,
        attempt.status,
        attempt.statusCode || '',
        attempt.responseTime || '',
        attempt.errorMessage || '',
        attempt.timestamp.toISOString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return csv;
    }
  }

  /**
   * Clean up old retry attempts
   */
  cleanupOldAttempts(daysToKeep: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialLength = this.retryAttempts.length;

    this.retryAttempts = this.retryAttempts.filter((attempt) => attempt.timestamp > cutoffDate);

    const deletedCount = initialLength - this.retryAttempts.length;
    console.log(`[WebhookRetry] Cleaned up ${deletedCount} old retry attempts (kept ${daysToKeep} days)`);

    return deletedCount;
  }
}

// Export singleton instance
export const webhookRetryService = new WebhookRetryService();
