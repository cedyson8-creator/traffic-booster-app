/**
 * Real-time webhook delivery monitoring service
 * Tracks webhook delivery status and provides live updates
 */

export interface WebhookDeliveryEvent {
  webhookId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  timestamp: Date;
  responseCode?: number;
  responseTime?: number;
  errorMessage?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

export interface WebhookMonitoringStats {
  totalWebhooks: number;
  activeWebhooks: number;
  successRate: number;
  averageResponseTime: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  recentEvents: WebhookDeliveryEvent[];
}

export class WebhookMonitoringService {
  private static instance: WebhookMonitoringService;
  private events: Map<string, WebhookDeliveryEvent> = new Map();
  private webhookStats: Map<string, { success: number; failed: number; totalTime: number; count: number }> = new Map();
  private subscribers: Set<(event: WebhookDeliveryEvent) => void> = new Set();

  private constructor() {}

  static getInstance(): WebhookMonitoringService {
    if (!WebhookMonitoringService.instance) {
      WebhookMonitoringService.instance = new WebhookMonitoringService();
    }
    return WebhookMonitoringService.instance;
  }

  /**
   * Record webhook delivery event
   */
  recordEvent(event: WebhookDeliveryEvent): void {
    this.events.set(event.eventId, event);
    
    // Update stats
    if (!this.webhookStats.has(event.webhookId)) {
      this.webhookStats.set(event.webhookId, { success: 0, failed: 0, totalTime: 0, count: 0 });
    }
    
    const stats = this.webhookStats.get(event.webhookId)!;
    if (event.status === 'delivered') {
      stats.success++;
      if (event.responseTime) {
        stats.totalTime += event.responseTime;
      }
    } else if (event.status === 'failed') {
      stats.failed++;
    }
    stats.count++;
    
    // Notify subscribers
    this.notifySubscribers(event);
  }

  /**
   * Subscribe to webhook delivery events
   */
  subscribe(callback: (event: WebhookDeliveryEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get monitoring statistics
   */
  getStats(): WebhookMonitoringStats {
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalTime = 0;
    let totalCount = 0;
    let activeWebhooks = 0;

    this.webhookStats.forEach(stats => {
      totalSuccess += stats.success;
      totalFailed += stats.failed;
      totalTime += stats.totalTime;
      totalCount += stats.count;
      if (stats.success > 0 || stats.failed > 0) {
        activeWebhooks++;
      }
    });

    const successRate = totalCount > 0 ? (totalSuccess / totalCount) * 100 : 0;
    const averageResponseTime = totalSuccess > 0 ? totalTime / totalSuccess : 0;

    const recentEvents = Array.from(this.events.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    return {
      totalWebhooks: this.webhookStats.size,
      activeWebhooks,
      successRate,
      averageResponseTime,
      failedDeliveries: totalFailed,
      pendingDeliveries: Array.from(this.events.values()).filter(e => e.status === 'pending').length,
      recentEvents,
    };
  }

  /**
   * Get webhook-specific stats
   */
  getWebhookStats(webhookId: string): { success: number; failed: number; averageResponseTime: number } | null {
    const stats = this.webhookStats.get(webhookId);
    if (!stats) return null;

    return {
      success: stats.success,
      failed: stats.failed,
      averageResponseTime: stats.count > 0 ? stats.totalTime / stats.success : 0,
    };
  }

  /**
   * Get recent events for webhook
   */
  getRecentEvents(webhookId: string, limit: number = 20): WebhookDeliveryEvent[] {
    return Array.from(this.events.values())
      .filter(e => e.webhookId === webhookId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Notify all subscribers of event
   */
  private notifySubscribers(event: WebhookDeliveryEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[WebhookMonitoring] Subscriber error:', error);
      }
    });
  }

  /**
   * Clear old events (keep last 1000)
   */
  cleanup(): void {
    if (this.events.size > 1000) {
      const sortedEvents = Array.from(this.events.entries())
        .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime())
        .slice(0, 1000);
      
      this.events.clear();
      sortedEvents.forEach(([key, value]) => this.events.set(key, value));
    }
  }

  /**
   * Reset for testing
   */
  static resetInstance(): void {
    WebhookMonitoringService.instance = new WebhookMonitoringService();
  }
}

export const webhookMonitoringService = WebhookMonitoringService.getInstance();
