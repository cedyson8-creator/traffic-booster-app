/**
 * Webhook Delivery Analytics Service
 * Tracks webhook delivery metrics, success rates, and retry effectiveness
 */

export interface WebhookDeliveryMetric {
  timestamp: Date;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  retryCount: number;
  webhookId: string;
  organizationId: string;
}

export interface WebhookAnalytics {
  webhookId: string;
  organizationId: string;
  successRate: number;
  failureRate: number;
  averageResponseTime: number;
  totalDeliveries: number;
  totalRetries: number;
  retryEffectiveness: number;
  metrics: WebhookDeliveryMetric[];
  timeRange: { start: Date; end: Date };
}

export class WebhookAnalyticsService {
  private static instance: WebhookAnalyticsService;
  private metrics: Map<string, WebhookDeliveryMetric[]> = new Map();

  private constructor() {}

  static getInstance(): WebhookAnalyticsService {
    if (!WebhookAnalyticsService.instance) {
      WebhookAnalyticsService.instance = new WebhookAnalyticsService();
    }
    return WebhookAnalyticsService.instance;
  }

  /**
   * Record webhook delivery metric
   */
  recordDelivery(metric: WebhookDeliveryMetric): void {
    const key = `${metric.organizationId}-${metric.webhookId}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);
  }

  /**
   * Get webhook analytics for time range
   */
  getAnalytics(webhookId: string, organizationId: string, startDate: Date, endDate: Date): WebhookAnalytics {
    const key = `${organizationId}-${webhookId}`;
    const allMetrics = this.metrics.get(key) || [];

    const rangeMetrics = allMetrics.filter(m => m.timestamp >= startDate && m.timestamp <= endDate);

    const totalDeliveries = rangeMetrics.reduce((sum, m) => sum + m.totalDeliveries, 0);
    const successfulDeliveries = rangeMetrics.reduce((sum, m) => sum + m.successfulDeliveries, 0);
    const failedDeliveries = rangeMetrics.reduce((sum, m) => sum + m.failedDeliveries, 0);
    const totalRetries = rangeMetrics.reduce((sum, m) => sum + m.retryCount, 0);

    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
    const failureRate = totalDeliveries > 0 ? (failedDeliveries / totalDeliveries) * 100 : 0;

    const avgResponseTime =
      rangeMetrics.length > 0 ? rangeMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / rangeMetrics.length : 0;

    // Retry effectiveness: successful retries / total retries
    const retryEffectiveness =
      totalRetries > 0 ? ((successfulDeliveries - (totalDeliveries - failedDeliveries - totalRetries)) / totalRetries) * 100 : 0;

    return {
      webhookId,
      organizationId,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime),
      totalDeliveries,
      totalRetries,
      retryEffectiveness: Math.max(0, Math.round(retryEffectiveness * 100) / 100),
      metrics: rangeMetrics,
      timeRange: { start: startDate, end: endDate },
    };
  }

  /**
   * Get success rate trend over time
   */
  getSuccessTrend(webhookId: string, organizationId: string, bucketSize: number = 3600000): Array<{ timestamp: Date; rate: number }> {
    const key = `${organizationId}-${webhookId}`;
    const metrics = this.metrics.get(key) || [];

    if (metrics.length === 0) {
      return [];
    }

    const buckets: Map<number, { successful: number; total: number }> = new Map();

    metrics.forEach(m => {
      const bucketKey = Math.floor(m.timestamp.getTime() / bucketSize) * bucketSize;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { successful: 0, total: 0 });
      }
      const bucket = buckets.get(bucketKey)!;
      bucket.successful += m.successfulDeliveries;
      bucket.total += m.totalDeliveries;
    });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucketKey, data]) => ({
        timestamp: new Date(bucketKey),
        rate: data.total > 0 ? Math.round((data.successful / data.total) * 100 * 100) / 100 : 0,
      }));
  }

  /**
   * Get response time trend
   */
  getResponseTimeTrend(webhookId: string, organizationId: string, bucketSize: number = 3600000): Array<{ timestamp: Date; avgTime: number }> {
    const key = `${organizationId}-${webhookId}`;
    const metrics = this.metrics.get(key) || [];

    if (metrics.length === 0) {
      return [];
    }

    const buckets: Map<number, { totalTime: number; count: number }> = new Map();

    metrics.forEach(m => {
      const bucketKey = Math.floor(m.timestamp.getTime() / bucketSize) * bucketSize;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { totalTime: 0, count: 0 });
      }
      const bucket = buckets.get(bucketKey)!;
      bucket.totalTime += m.averageResponseTime;
      bucket.count += 1;
    });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucketKey, data]) => ({
        timestamp: new Date(bucketKey),
        avgTime: Math.round(data.totalTime / data.count),
      }));
  }

  /**
   * Get failure reasons breakdown
   */
  getFailureBreakdown(webhookId: string, organizationId: string, startDate: Date, endDate: Date): Record<string, number> {
    const key = `${organizationId}-${webhookId}`;
    const metrics = this.metrics.get(key) || [];

    const breakdown: Record<string, number> = {
      timeout: 0,
      unauthorized: 0,
      notfound: 0,
      servererror: 0,
      other: 0,
    };

    metrics
      .filter(m => m.timestamp >= startDate && m.timestamp <= endDate)
      .forEach(m => {
        // In real implementation, would categorize based on status codes
        breakdown.other += m.failedDeliveries;
      });

    return breakdown;
  }

  /**
   * Get retry statistics
   */
  getRetryStats(webhookId: string, organizationId: string, startDate: Date, endDate: Date) {
    const key = `${organizationId}-${webhookId}`;
    const metrics = this.metrics.get(key) || [];

    const rangeMetrics = metrics.filter(m => m.timestamp >= startDate && m.timestamp <= endDate);

    const totalRetries = rangeMetrics.reduce((sum, m) => sum + m.retryCount, 0);
    const avgRetriesPerFailure = rangeMetrics.length > 0 ? totalRetries / rangeMetrics.length : 0;

    return {
      totalRetries,
      avgRetriesPerFailure: Math.round(avgRetriesPerFailure * 100) / 100,
      retryBuckets: {
        zeroRetries: rangeMetrics.filter(m => m.retryCount === 0).length,
        oneRetry: rangeMetrics.filter(m => m.retryCount === 1).length,
        twoRetries: rangeMetrics.filter(m => m.retryCount === 2).length,
        threeOrMore: rangeMetrics.filter(m => m.retryCount >= 3).length,
      },
    };
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get total metrics count
   */
  getTotalCount(): number {
    let count = 0;
    this.metrics.forEach(m => (count += m.length));
    return count;
  }
}

export const webhookAnalyticsService = WebhookAnalyticsService.getInstance();
