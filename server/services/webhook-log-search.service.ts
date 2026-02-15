/**
 * Webhook Log Search Service
 * Provides full-text search and advanced filtering for webhook logs
 */

export interface WebhookLogEntry {
  id: string;
  eventType: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  statusCode?: number;
  responseTime: number;
  timestamp: Date;
  payload: Record<string, unknown>;
  response?: string;
  retryCount: number;
  webhookUrl: string;
  organizationId: string;
}

export interface SearchFilter {
  eventType?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minResponseTime?: number;
  maxResponseTime?: number;
  statusCode?: number;
  retryCountMin?: number;
  retryCountMax?: number;
  webhookUrl?: string;
  searchQuery?: string; // Full-text search
}

export interface SearchResult {
  logs: WebhookLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class WebhookLogSearchService {
  private logs: WebhookLogEntry[] = [];

  /**
   * Add webhook log entry
   */
  addLog(log: WebhookLogEntry): void {
    this.logs.push(log);
  }

  /**
   * Search logs with filters
   */
  search(filters: SearchFilter, page: number = 1, pageSize: number = 20): SearchResult {
    let results = [...this.logs];

    // Apply filters
    if (filters.eventType) {
      results = results.filter(log => log.eventType === filters.eventType);
    }

    if (filters.status) {
      results = results.filter(log => log.status === filters.status);
    }

    if (filters.startDate) {
      results = results.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters.minResponseTime !== undefined) {
      results = results.filter(log => log.responseTime >= filters.minResponseTime!);
    }

    if (filters.maxResponseTime !== undefined) {
      results = results.filter(log => log.responseTime <= filters.maxResponseTime!);
    }

    if (filters.statusCode) {
      results = results.filter(log => log.statusCode === filters.statusCode);
    }

    if (filters.retryCountMin !== undefined) {
      results = results.filter(log => log.retryCount >= filters.retryCountMin!);
    }

    if (filters.retryCountMax !== undefined) {
      results = results.filter(log => log.retryCount <= filters.retryCountMax!);
    }

    if (filters.webhookUrl) {
      results = results.filter(log => log.webhookUrl.includes(filters.webhookUrl!));
    }

    // Full-text search
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(log =>
        JSON.stringify(log).toLowerCase().includes(query) ||
        log.eventType.toLowerCase().includes(query) ||
        log.webhookUrl.toLowerCase().includes(query) ||
        (log.response && log.response.toLowerCase().includes(query))
      );
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const total = results.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedResults = results.slice(start, end);

    return {
      logs: paginatedResults,
      total,
      page,
      pageSize,
      hasMore: end < total,
    };
  }

  /**
   * Get logs by event type
   */
  getByEventType(eventType: string): WebhookLogEntry[] {
    return this.logs.filter(log => log.eventType === eventType);
  }

  /**
   * Get logs by status
   */
  getByStatus(status: string): WebhookLogEntry[] {
    return this.logs.filter(log => log.status === status);
  }

  /**
   * Get failed logs
   */
  getFailedLogs(): WebhookLogEntry[] {
    return this.logs.filter(log => log.status === 'failed');
  }

  /**
   * Get slow logs (response time > threshold)
   */
  getSlowLogs(thresholdMs: number = 5000): WebhookLogEntry[] {
    return this.logs.filter(log => log.responseTime > thresholdMs);
  }

  /**
   * Get logs with retries
   */
  getLogsWithRetries(): WebhookLogEntry[] {
    return this.logs.filter(log => log.retryCount > 0);
  }

  /**
   * Get statistics
   */
  getStatistics(filters?: SearchFilter): Record<string, unknown> {
    let filtered = [...this.logs];

    if (filters) {
      if (filters.eventType) {
        filtered = filtered.filter(log => log.eventType === filters.eventType);
      }
      if (filters.status) {
        filtered = filtered.filter(log => log.status === filters.status);
      }
      if (filters.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    const total = filtered.length;
    const successful = filtered.filter(log => log.status === 'success').length;
    const failed = filtered.filter(log => log.status === 'failed').length;
    const pending = filtered.filter(log => log.status === 'pending').length;
    const retrying = filtered.filter(log => log.status === 'retrying').length;

    const responseTimes = filtered.map(log => log.responseTime);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) : '0.00';

    return {
      total,
      successful,
      failed,
      pending,
      retrying,
      successRate: `${successRate}%`,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      totalRetries: filtered.reduce((sum, log) => sum + log.retryCount, 0),
    };
  }

  /**
   * Get event type distribution
   */
  getEventTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.logs.forEach(log => {
      distribution[log.eventType] = (distribution[log.eventType] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get status distribution
   */
  getStatusDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.logs.forEach(log => {
      distribution[log.status] = (distribution[log.status] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV(filters?: SearchFilter): string {
    const result = this.search(filters || {}, 1, 10000);
    const logs = result.logs;

    const headers = ['ID', 'Event Type', 'Status', 'Response Time (ms)', 'Timestamp', 'Webhook URL', 'Retry Count'];
    const rows = logs.map(log => [
      log.id,
      log.eventType,
      log.status,
      log.responseTime.toString(),
      log.timestamp.toISOString(),
      log.webhookUrl,
      log.retryCount.toString(),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Export logs as JSON
   */
  exportAsJSON(filters?: SearchFilter): string {
    const result = this.search(filters || {}, 1, 10000);
    return JSON.stringify(result.logs, null, 2);
  }

  /**
   * Clear old logs (older than days)
   */
  clearOldLogs(days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const initialLength = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    return initialLength - this.logs.length;
  }

  /**
   * Get total logs count
   */
  getTotalCount(): number {
    return this.logs.length;
  }

  /**
   * Delete log by ID
   */
  deleteLog(id: string): boolean {
    const initialLength = this.logs.length;
    this.logs = this.logs.filter(log => log.id !== id);
    return this.logs.length < initialLength;
  }

  /**
   * Get log by ID
   */
  getLogById(id: string): WebhookLogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 50): WebhookLogEntry[] {
    return [...this.logs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs for organization
   */
  getLogsForOrganization(organizationId: string): WebhookLogEntry[] {
    return this.logs.filter(log => log.organizationId === organizationId);
  }
}

export const webhookLogSearchService = new WebhookLogSearchService();
