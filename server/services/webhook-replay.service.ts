/**
 * Webhook Replay Service
 * Handles replaying webhooks with payload editing and retry tracking
 */

export interface WebhookReplayRequest {
  webhookId: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  retryCount?: number;
}

export interface WebhookReplayLog {
  id: string;
  webhookId: string;
  originalPayload: Record<string, any>;
  replayPayload: Record<string, any>;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  errorMessage?: string;
  replayedAt: Date;
  responseTime: number;
  retryCount: number;
  maxRetries: number;
}

export interface ReplayStats {
  totalReplays: number;
  successfulReplays: number;
  failedReplays: number;
  successRate: number;
  avgResponseTime: number;
}

export class WebhookReplayService {
  private replayLogs: Map<string, WebhookReplayLog> = new Map();
  private replayQueue: WebhookReplayRequest[] = [];
  private maxRetries = 5;
  private retryDelay = 1000; // 1 second base delay

  /**
   * Replay a webhook with custom payload
   */
  async replayWebhook(request: WebhookReplayRequest): Promise<WebhookReplayLog> {
    const replayLog: WebhookReplayLog = {
      id: this.generateId(),
      webhookId: request.webhookId,
      originalPayload: request.payload,
      replayPayload: request.payload,
      status: 'pending',
      replayedAt: new Date(),
      responseTime: 0,
      retryCount: 0,
      maxRetries: request.retryCount || this.maxRetries,
    };

    this.replayLogs.set(replayLog.id, replayLog);
    this.replayQueue.push(request);

    // Simulate webhook delivery
    await this.processReplay(replayLog);

    return replayLog;
  }

  /**
   * Process webhook replay with retries
   */
  private async processReplay(log: WebhookReplayLog): Promise<void> {
    const startTime = Date.now();

    try {
      // Simulate HTTP request
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        log.status = 'success';
        log.statusCode = 200;
        log.responseTime = Date.now() - startTime;
      } else {
        throw new Error('Webhook delivery failed');
      }
    } catch (error) {
      log.status = 'failed';
      log.statusCode = 500;
      log.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.responseTime = Date.now() - startTime;

      // Retry logic
      if (log.retryCount < log.maxRetries) {
        log.retryCount++;
        const delay = this.calculateBackoffDelay(log.retryCount);
        await this.delay(delay);
        await this.processReplay(log);
      }
    }
  }

  /**
   * Edit webhook payload and replay
   */
  async replayWithEditedPayload(
    webhookId: string,
    originalPayload: Record<string, any>,
    editedPayload: Record<string, any>,
  ): Promise<WebhookReplayLog> {
    const replayLog: WebhookReplayLog = {
      id: this.generateId(),
      webhookId,
      originalPayload,
      replayPayload: editedPayload,
      status: 'pending',
      replayedAt: new Date(),
      responseTime: 0,
      retryCount: 0,
      maxRetries: this.maxRetries,
    };

    this.replayLogs.set(replayLog.id, replayLog);

    // Validate JSON
    try {
      JSON.stringify(editedPayload);
    } catch {
      replayLog.status = 'failed';
      replayLog.errorMessage = 'Invalid JSON payload';
      return replayLog;
    }

    await this.processReplay(replayLog);
    return replayLog;
  }

  /**
   * Get replay history for a webhook
   */
  getReplayHistory(webhookId: string, limit = 50): WebhookReplayLog[] {
    return Array.from(this.replayLogs.values())
      .filter((log) => log.webhookId === webhookId)
      .sort((a, b) => b.replayedAt.getTime() - a.replayedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get replay log by ID
   */
  getReplayLog(replayId: string): WebhookReplayLog | null {
    return this.replayLogs.get(replayId) || null;
  }

  /**
   * Batch replay webhooks
   */
  async batchReplay(webhookIds: string[]): Promise<WebhookReplayLog[]> {
    const results: WebhookReplayLog[] = [];

    for (const webhookId of webhookIds) {
      const log: WebhookReplayLog = {
        id: this.generateId(),
        webhookId,
        originalPayload: {},
        replayPayload: {},
        status: 'pending',
        replayedAt: new Date(),
        responseTime: 0,
        retryCount: 0,
        maxRetries: this.maxRetries,
      };

      this.replayLogs.set(log.id, log);
      await this.processReplay(log);
      results.push(log);
    }

    return results;
  }

  /**
   * Schedule replay for later
   */
  scheduleReplay(
    webhookId: string,
    payload: Record<string, any>,
    delayMs: number,
  ): string {
    const replayId = this.generateId();

    setTimeout(() => {
      this.replayWebhook({
        webhookId,
        payload,
      });
    }, delayMs);

    return replayId;
  }

  /**
   * Get replay statistics
   */
  getReplayStats(webhookId?: string): ReplayStats {
    let logs = Array.from(this.replayLogs.values());

    if (webhookId) {
      logs = logs.filter((log) => log.webhookId === webhookId);
    }

    const successful = logs.filter((log) => log.status === 'success').length;
    const failed = logs.filter((log) => log.status === 'failed').length;
    const avgResponseTime =
      logs.length > 0
        ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
        : 0;

    return {
      totalReplays: logs.length,
      successfulReplays: successful,
      failedReplays: failed,
      successRate: logs.length > 0 ? (successful / logs.length) * 100 : 0,
      avgResponseTime,
    };
  }

  /**
   * Clear replay logs
   */
  clearReplayLogs(webhookId?: string): void {
    if (webhookId) {
      Array.from(this.replayLogs.entries()).forEach(([id, log]) => {
        if (log.webhookId === webhookId) {
          this.replayLogs.delete(id);
        }
      });
    } else {
      this.replayLogs.clear();
    }
  }

  /**
   * Validate webhook payload
   */
  validatePayload(payload: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      JSON.stringify(payload);
    } catch {
      errors.push('Invalid JSON structure');
    }

    if (Object.keys(payload).length === 0) {
      errors.push('Payload cannot be empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get replay queue status
   */
  getQueueStatus(): { pending: number; processing: number } {
    return {
      pending: this.replayQueue.length,
      processing: Array.from(this.replayLogs.values()).filter(
        (log) => log.status === 'pending',
      ).length,
    };
  }

  /**
   * Export replay logs as JSON
   */
  exportReplayLogs(webhookId?: string): string {
    let logs = Array.from(this.replayLogs.values());

    if (webhookId) {
      logs = logs.filter((log) => log.webhookId === webhookId);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Get replay logs with filters
   */
  getReplayLogsFiltered(
    webhookId?: string,
    status?: 'pending' | 'success' | 'failed',
    startDate?: Date,
    endDate?: Date,
  ): WebhookReplayLog[] {
    let logs = Array.from(this.replayLogs.values());

    if (webhookId) {
      logs = logs.filter((log) => log.webhookId === webhookId);
    }

    if (status) {
      logs = logs.filter((log) => log.status === status);
    }

    if (startDate) {
      logs = logs.filter((log) => log.replayedAt >= startDate);
    }

    if (endDate) {
      logs = logs.filter((log) => log.replayedAt <= endDate);
    }

    return logs.sort((a, b) => b.replayedAt.getTime() - a.replayedAt.getTime());
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const exponentialDelay = this.retryDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 60000); // Cap at 60 seconds
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const webhookReplayService = new WebhookReplayService();
