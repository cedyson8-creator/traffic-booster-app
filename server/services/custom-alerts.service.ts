/**
 * Custom Alerts Service
 * Handles alert creation, triggering, and delivery
 */

export type AlertChannel = 'email' | 'slack' | 'discord' | 'webhook';
export type AlertTrigger = 'error_rate' | 'api_latency' | 'webhook_failure' | 'quota_exceeded' | 'failed_auth';

export interface AlertConfig {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  trigger: AlertTrigger;
  threshold: number;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  channels: AlertChannel[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  cooldownMinutes: number;
  testMode: boolean;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  organizationId: string;
  trigger: AlertTrigger;
  currentValue: number;
  threshold: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AlertDelivery {
  id: string;
  alertEventId: string;
  channel: AlertChannel;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  failureReason?: string;
  retryCount: number;
}

export class CustomAlertsService {
  private alerts: Map<string, AlertConfig> = new Map();
  private alertEvents: Map<string, AlertEvent> = new Map();
  private deliveries: Map<string, AlertDelivery> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();

  /**
   * Create a new alert
   */
  createAlert(config: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt'>): AlertConfig {
    const alert: AlertConfig = {
      ...config,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Update an alert
   */
  updateAlert(alertId: string, updates: Partial<AlertConfig>): AlertConfig | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    const updated = {
      ...alert,
      ...updates,
      id: alert.id,
      createdAt: alert.createdAt,
      updatedAt: new Date(),
    };

    this.alerts.set(alertId, updated);
    return updated;
  }

  /**
   * Delete an alert
   */
  deleteAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): AlertConfig | null {
    return this.alerts.get(alertId) || null;
  }

  /**
   * Get all alerts for organization
   */
  getAlerts(organizationId: string): AlertConfig[] {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.organizationId === organizationId,
    );
  }

  /**
   * Enable/disable alert
   */
  toggleAlert(alertId: string): AlertConfig | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.enabled = !alert.enabled;
    alert.updatedAt = new Date();
    this.alerts.set(alertId, alert);
    return alert;
  }

  /**
   * Check if alert should trigger
   */
  private shouldTrigger(alert: AlertConfig, currentValue: number): boolean {
    switch (alert.operator) {
      case '>':
        return currentValue > alert.threshold;
      case '<':
        return currentValue < alert.threshold;
      case '==':
        return currentValue === alert.threshold;
      case '!=':
        return currentValue !== alert.threshold;
      case '>=':
        return currentValue >= alert.threshold;
      case '<=':
        return currentValue <= alert.threshold;
      default:
        return false;
    }
  }

  /**
   * Check if alert is in cooldown
   */
  private isInCooldown(alertId: string, cooldownMinutes: number): boolean {
    const lastTrigger = this.alertCooldowns.get(alertId);
    if (!lastTrigger) return false;

    const now = new Date();
    const cooldownMs = cooldownMinutes * 60 * 1000;
    return now.getTime() - lastTrigger.getTime() < cooldownMs;
  }

  /**
   * Trigger alert check
   */
  async triggerAlert(
    alertId: string,
    currentValue: number,
    message: string,
  ): Promise<AlertEvent | null> {
    const alert = this.alerts.get(alertId);
    if (!alert || !alert.enabled) return null;

    // Check if should trigger
    if (!this.shouldTrigger(alert, currentValue)) return null;

    // Check cooldown
    if (this.isInCooldown(alertId, alert.cooldownMinutes)) return null;

    // Determine severity
    const severity = this.calculateSeverity(alert, currentValue);

    // Create alert event
    const event: AlertEvent = {
      id: this.generateId(),
      alertId,
      organizationId: alert.organizationId,
      trigger: alert.trigger,
      currentValue,
      threshold: alert.threshold,
      message,
      severity,
      triggeredAt: new Date(),
      acknowledged: false,
    };

    this.alertEvents.set(event.id, event);
    this.alertCooldowns.set(alertId, new Date());
    alert.lastTriggeredAt = new Date();

    // Deliver alert
    await this.deliverAlert(alert, event);

    return event;
  }

  /**
   * Deliver alert through channels
   */
  private async deliverAlert(alert: AlertConfig, event: AlertEvent): Promise<void> {
    for (const channel of alert.channels) {
      const delivery: AlertDelivery = {
        id: this.generateId(),
        alertEventId: event.id,
        channel,
        status: 'pending',
        retryCount: 0,
      };

      this.deliveries.set(delivery.id, delivery);

      // Simulate delivery
      try {
        await this.sendAlert(alert, event, channel);
        delivery.status = 'sent';
        delivery.sentAt = new Date();
      } catch (error) {
        delivery.status = 'failed';
        delivery.failureReason = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  /**
   * Send alert through channel
   */
  private async sendAlert(
    alert: AlertConfig,
    event: AlertEvent,
    channel: AlertChannel,
  ): Promise<void> {
    const message = this.formatAlertMessage(alert, event);

    switch (channel) {
      case 'email':
        // Simulate email delivery
        console.log(`[Email Alert] ${message}`);
        break;
      case 'slack':
        // Simulate Slack delivery
        console.log(`[Slack Alert] ${message}`);
        break;
      case 'discord':
        // Simulate Discord delivery
        console.log(`[Discord Alert] ${message}`);
        break;
      case 'webhook':
        // Simulate webhook delivery
        console.log(`[Webhook Alert] ${message}`);
        break;
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: AlertConfig, event: AlertEvent): string {
    return `Alert: ${alert.name}\nTrigger: ${event.trigger}\nCurrent: ${event.currentValue}\nThreshold: ${event.threshold}\nSeverity: ${event.severity}\nMessage: ${event.message}`;
  }

  /**
   * Calculate alert severity
   */
  private calculateSeverity(
    alert: AlertConfig,
    currentValue: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const deviation = Math.abs(currentValue - alert.threshold);
    const deviationPercent = (deviation / alert.threshold) * 100;

    if (deviationPercent > 100) return 'critical';
    if (deviationPercent > 50) return 'high';
    if (deviationPercent > 25) return 'medium';
    return 'low';
  }

  /**
   * Get alert events
   */
  getAlertEvents(
    organizationId: string,
    alertId?: string,
    limit = 50,
  ): AlertEvent[] {
    let events = Array.from(this.alertEvents.values()).filter(
      (event) => event.organizationId === organizationId,
    );

    if (alertId) {
      events = events.filter((event) => event.alertId === alertId);
    }

    return events
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  /**
   * Acknowledge alert event
   */
  acknowledgeEvent(eventId: string, acknowledgedBy: string): AlertEvent | null {
    const event = this.alertEvents.get(eventId);
    if (!event) return null;

    event.acknowledged = true;
    event.acknowledgedAt = new Date();
    event.acknowledgedBy = acknowledgedBy;
    return event;
  }

  /**
   * Test alert
   */
  async testAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    // Create test event
    const testValue = alert.threshold + (alert.operator === '>' ? 1 : -1);
    const event = await this.triggerAlert(alertId, testValue, 'Test alert');

    return event !== null;
  }

  /**
   * Get alert statistics
   */
  getAlertStats(organizationId: string): {
    totalAlerts: number;
    enabledAlerts: number;
    totalEvents: number;
    unacknowledgedEvents: number;
  } {
    const alerts = this.getAlerts(organizationId);
    const events = this.getAlertEvents(organizationId);

    return {
      totalAlerts: alerts.length,
      enabledAlerts: alerts.filter((a) => a.enabled).length,
      totalEvents: events.length,
      unacknowledgedEvents: events.filter((e) => !e.acknowledged).length,
    };
  }

  /**
   * Get alert delivery history
   */
  getDeliveryHistory(alertEventId: string): AlertDelivery[] {
    return Array.from(this.deliveries.values())
      .filter((delivery) => delivery.alertEventId === alertEventId)
      .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0));
  }

  /**
   * Export alerts as JSON
   */
  exportAlerts(organizationId: string): string {
    const alerts = this.getAlerts(organizationId);
    return JSON.stringify(alerts, null, 2);
  }

  /**
   * Export alert events as JSON
   */
  exportEvents(organizationId: string): string {
    const events = this.getAlertEvents(organizationId);
    return JSON.stringify(events, null, 2);
  }

  /**
   * Clear old events
   */
  clearOldEvents(organizationId: string, daysOld: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deleted = 0;
    Array.from(this.alertEvents.entries()).forEach(([id, event]) => {
      if (event.organizationId === organizationId && event.triggeredAt < cutoffDate) {
        this.alertEvents.delete(id);
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const customAlertsService = new CustomAlertsService();
