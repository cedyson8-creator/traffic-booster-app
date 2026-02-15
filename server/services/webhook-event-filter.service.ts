/**
 * Webhook Event Filtering Service
 * Provides advanced filtering and search capabilities for webhook replay logs
 */

export interface FilterOptions {
  eventType?: string;
  status?: 'pending' | 'success' | 'failed' | 'scheduled';
  startDate?: Date;
  endDate?: Date;
  webhookId?: string;
  minResponseTime?: number;
  maxResponseTime?: number;
  searchQuery?: string;
}

export interface FilteredLog {
  id: string;
  webhookId: string;
  eventType: string;
  status: 'pending' | 'success' | 'failed' | 'scheduled';
  payload: Record<string, unknown>;
  response?: string;
  responseTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookEventFilterService {
  private logs: Map<string, FilteredLog> = new Map();

  /**
   * Add a webhook log entry
   */
  addLog(log: FilteredLog): void {
    this.logs.set(log.id, log);
  }

  /**
   * Filter logs by multiple criteria
   */
  filterLogs(options: FilterOptions): FilteredLog[] {
    let filtered = Array.from(this.logs.values());

    if (options.eventType) {
      filtered = filtered.filter(log => log.eventType === options.eventType);
    }

    if (options.status) {
      filtered = filtered.filter(log => log.status === options.status);
    }

    if (options.startDate) {
      filtered = filtered.filter(log => log.createdAt >= options.startDate!);
    }

    if (options.endDate) {
      filtered = filtered.filter(log => log.createdAt <= options.endDate!);
    }

    if (options.webhookId) {
      filtered = filtered.filter(log => log.webhookId === options.webhookId);
    }

    if (options.minResponseTime !== undefined) {
      filtered = filtered.filter(log => log.responseTime >= options.minResponseTime!);
    }

    if (options.maxResponseTime !== undefined) {
      filtered = filtered.filter(log => log.responseTime <= options.maxResponseTime!);
    }

    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        JSON.stringify(log.payload).toLowerCase().includes(query) ||
        log.response?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  /**
   * Get logs by event type
   */
  getLogsByEventType(eventType: string): FilteredLog[] {
    return this.filterLogs({ eventType });
  }

  /**
   * Get logs by status
   */
  getLogsByStatus(status: 'pending' | 'success' | 'failed' | 'scheduled'): FilteredLog[] {
    return this.filterLogs({ status });
  }

  /**
   * Get logs by date range
   */
  getLogsByDateRange(startDate: Date, endDate: Date): FilteredLog[] {
    return this.filterLogs({ startDate, endDate });
  }

  /**
   * Get logs by response time range
   */
  getLogsByResponseTime(minTime: number, maxTime: number): FilteredLog[] {
    return this.filterLogs({ minResponseTime: minTime, maxResponseTime: maxTime });
  }

  /**
   * Search logs by query
   */
  searchLogs(query: string): FilteredLog[] {
    return this.filterLogs({ searchQuery: query });
  }

  /**
   * Get event type statistics
   */
  getEventTypeStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const log of this.logs.values()) {
      stats[log.eventType] = (stats[log.eventType] || 0) + 1;
    }
    return stats;
  }

  /**
   * Get status statistics
   */
  getStatusStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const log of this.logs.values()) {
      stats[log.status] = (stats[log.status] || 0) + 1;
    }
    return stats;
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(logs?: FilteredLog[]): number {
    const logsToAnalyze = logs || Array.from(this.logs.values());
    if (logsToAnalyze.length === 0) return 0;
    const total = logsToAnalyze.reduce((sum, log) => sum + log.responseTime, 0);
    return total / logsToAnalyze.length;
  }

  /**
   * Get success rate
   */
  getSuccessRate(logs?: FilteredLog[]): number {
    const logsToAnalyze = logs || Array.from(this.logs.values());
    if (logsToAnalyze.length === 0) return 0;
    const successful = logsToAnalyze.filter(log => log.status === 'success').length;
    return (successful / logsToAnalyze.length) * 100;
  }

  /**
   * Clear old logs (cleanup)
   */
  clearOldLogs(daysOld: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    for (const [id, log] of this.logs.entries()) {
      if (log.createdAt < cutoffDate) {
        this.logs.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * Export filtered logs as JSON
   */
  exportLogs(options: FilterOptions): string {
    const filtered = this.filterLogs(options);
    return JSON.stringify(filtered, null, 2);
  }

  /**
   * Get total log count
   */
  getTotalLogCount(): number {
    return this.logs.size;
  }

  /**
   * Get logs for specific webhook
   */
  getWebhookLogs(webhookId: string): FilteredLog[] {
    return this.filterLogs({ webhookId });
  }
}

export const webhookEventFilterService = new WebhookEventFilterService();
