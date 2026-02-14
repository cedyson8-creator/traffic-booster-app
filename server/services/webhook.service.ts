import axios, { AxiosError } from 'axios';

/**
 * Webhook Event System
 * Manages webhook subscriptions and delivery for third-party integrations
 */

export type WebhookEventType =
  | 'rate_limit.exceeded'
  | 'api_key.created'
  | 'api_key.rotated'
  | 'api_key.revoked'
  | 'api_key.deleted'
  | 'usage.threshold_exceeded'
  | 'error.critical'
  | 'health.degraded';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: Date;
  userId: number;
  data: Record<string, any>;
}

export interface WebhookEndpoint {
  id: string;
  userId: number;
  url: string;
  events: WebhookEventType[];
  isActive: boolean;
  secret?: string;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
  maxRetries: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  attempt: number;
  statusCode?: number;
  response?: string;
  error?: string;
  timestamp: Date;
  nextRetryAt?: Date;
}

/**
 * In-memory webhook store
 */
const webhookStore: Map<string, WebhookEndpoint> = new Map();
const deliveryStore: Map<string, WebhookDelivery[]> = new Map();
const eventQueue: WebhookEvent[] = [];

export class WebhookService {
  private static processingQueue = false;
  private static retryIntervals = [5000, 30000, 300000, 3600000]; // 5s, 30s, 5m, 1h

  /**
   * Register a webhook endpoint
   */
  static registerWebhook(userId: number, url: string, events: WebhookEventType[], secret?: string): WebhookEndpoint {
    const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const webhook: WebhookEndpoint = {
      id: webhookId,
      userId,
      url,
      events,
      isActive: true,
      secret,
      createdAt: new Date(),
      failureCount: 0,
      maxRetries: 3,
    };

    webhookStore.set(webhookId, webhook);
    deliveryStore.set(webhookId, []);

    return webhook;
  }

  /**
   * Get webhook by ID
   */
  static getWebhook(webhookId: string): WebhookEndpoint | null {
    return webhookStore.get(webhookId) || null;
  }

  /**
   * List webhooks for a user
   */
  static listWebhooks(userId: number): WebhookEndpoint[] {
    return Array.from(webhookStore.values()).filter((w) => w.userId === userId);
  }

  /**
   * Update webhook
   */
  static updateWebhook(webhookId: string, updates: Partial<WebhookEndpoint>): WebhookEndpoint | null {
    const webhook = webhookStore.get(webhookId);

    if (!webhook) {
      return null;
    }

    Object.assign(webhook, updates);
    return webhook;
  }

  /**
   * Delete webhook
   */
  static deleteWebhook(webhookId: string): boolean {
    webhookStore.delete(webhookId);
    deliveryStore.delete(webhookId);
    return true;
  }

  /**
   * Trigger a webhook event
   */
  static async triggerEvent(type: WebhookEventType, userId: number, data: Record<string, any>) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: WebhookEvent = {
      id: eventId,
      type,
      timestamp: new Date(),
      userId,
      data,
    };

    // Queue event for processing
    eventQueue.push(event);

    // Start processing if not already running
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process webhook queue
   */
  private static async processQueue() {
    if (this.processingQueue || eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (eventQueue.length > 0) {
        const event = eventQueue.shift();

        if (!event) {
          break;
        }

        // Find matching webhooks
        const webhooks = Array.from(webhookStore.values()).filter(
          (w) => w.userId === event.userId && w.isActive && w.events.includes(event.type),
        );

        // Deliver to each webhook
        for (const webhook of webhooks) {
          await this.deliverEvent(webhook, event);
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Deliver event to webhook endpoint
   */
  private static async deliverEvent(webhook: WebhookEndpoint, event: WebhookEvent, attempt: number = 1) {
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      eventId: event.id,
      attempt,
      timestamp: new Date(),
    };

    try {
      const payload = {
        event: event.type,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
      };

      const response = await axios.post(webhook.url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event.type,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Signature': this.generateSignature(payload, webhook.secret),
        },
      });

      delivery.statusCode = response.status;
      delivery.response = JSON.stringify(response.data);

      // Reset failure count on success
      webhook.failureCount = 0;
      webhook.lastTriggeredAt = new Date();

      console.log(`[Webhook] Delivered ${event.type} to ${webhook.url} (attempt ${attempt})`);
    } catch (error) {
      const axiosError = error as AxiosError;
      delivery.error = axiosError.message;
      delivery.statusCode = axiosError.response?.status;

      webhook.failureCount++;

      // Retry with exponential backoff
      if (attempt < webhook.maxRetries) {
        const retryDelay = this.retryIntervals[Math.min(attempt, this.retryIntervals.length - 1)];
        delivery.nextRetryAt = new Date(Date.now() + retryDelay);

        console.warn(
          `[Webhook] Failed to deliver ${event.type} to ${webhook.url} (attempt ${attempt}/${webhook.maxRetries}), retrying in ${retryDelay}ms`,
        );

        // Schedule retry
        setTimeout(() => {
          this.deliverEvent(webhook, event, attempt + 1);
        }, retryDelay);
      } else {
        // Disable webhook after max retries
        webhook.isActive = false;
        console.error(
          `[Webhook] Max retries exceeded for ${webhook.url}, webhook disabled`,
        );
      }
    }

    // Store delivery record
    const deliveries = deliveryStore.get(webhook.id) || [];
    deliveries.push(delivery);

    // Keep only last 1000 deliveries
    if (deliveries.length > 1000) {
      deliveries.shift();
    }

    deliveryStore.set(webhook.id, deliveries);
  }

  /**
   * Generate webhook signature
   */
  private static generateSignature(payload: Record<string, any>, secret?: string): string {
    if (!secret) {
      return '';
    }

    const crypto = require('crypto');
    const message = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Get delivery history for webhook
   */
  static getDeliveryHistory(webhookId: string, limit: number = 100): WebhookDelivery[] {
    const deliveries = deliveryStore.get(webhookId) || [];
    return deliveries.slice(-limit).reverse();
  }

  /**
   * Get webhook statistics
   */
  static getWebhookStats(webhookId: string): {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  } {
    const deliveries = deliveryStore.get(webhookId) || [];
    const successful = deliveries.filter((d) => d.statusCode && d.statusCode >= 200 && d.statusCode < 300).length;
    const failed = deliveries.length - successful;

    return {
      totalDeliveries: deliveries.length,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      successRate: deliveries.length > 0 ? (successful / deliveries.length) * 100 : 0,
    };
  }

  /**
   * Test webhook delivery
   */
  static async testWebhook(webhookId: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const webhook = webhookStore.get(webhookId);

    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testEvent: WebhookEvent = {
      id: `test_${Date.now()}`,
      type: 'health.degraded',
      timestamp: new Date(),
      userId: webhook.userId,
      data: {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const payload = {
        event: testEvent.type,
        timestamp: testEvent.timestamp.toISOString(),
        data: testEvent.data,
      };

      const response = await axios.post(webhook.url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': testEvent.type,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Signature': this.generateSignature(payload, webhook.secret),
        },
      });

      return { success: true, statusCode: response.status };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        statusCode: axiosError.response?.status,
        error: axiosError.message,
      };
    }
  }

  /**
   * Get service status
   */
  static getStatus(): {
    totalWebhooks: number;
    activeWebhooks: number;
    queuedEvents: number;
    isProcessing: boolean;
  } {
    const activeWebhooks = Array.from(webhookStore.values()).filter((w) => w.isActive).length;

    return {
      totalWebhooks: webhookStore.size,
      activeWebhooks,
      queuedEvents: eventQueue.length,
      isProcessing: this.processingQueue,
    };
  }

  /**
   * Clear all webhooks (testing only)
   */
  static clearAll() {
    webhookStore.clear();
    deliveryStore.clear();
    eventQueue.length = 0;
  }
}
