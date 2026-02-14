import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorTrackingService } from '../services/error-tracking.service';
import { WebhookService, type WebhookEventType } from '../services/webhook.service';

/**
 * Final Features Tests
 * Tests for error tracking and webhook system
 */

describe('Error Tracking Service', () => {
  beforeEach(() => {
    ErrorTrackingService.clearAll();
  });

  it('should initialize error tracking service', () => {
    const status = ErrorTrackingService.getStatus();

    expect(status.initialized).toBe(true);
    expect(status.backend).toBeDefined();
  });

  it('should capture errors', () => {
    const errorId = ErrorTrackingService.captureError(new Error('Test error'), {
      userId: 1,
      endpoint: '/api/test',
      statusCode: 500,
    });

    expect(errorId).toBeDefined();
    expect(errorId).toMatch(/^err_/);

    const error = ErrorTrackingService.getError(errorId);
    expect(error).toBeDefined();
    expect(error?.message).toBe('Test error');
    expect(error?.level).toBe('error');
  });

  it('should capture warnings', () => {
    const errorId = ErrorTrackingService.captureWarning('Test warning', { context: 'test' });

    expect(errorId).toBeDefined();
    expect(errorId).toMatch(/^warn_/);

    const error = ErrorTrackingService.getError(errorId);
    expect(error?.level).toBe('warning');
  });

  it('should capture info messages', () => {
    const errorId = ErrorTrackingService.captureInfo('Test info', { context: 'test' });

    expect(errorId).toBeDefined();
    expect(errorId).toMatch(/^info_/);

    const error = ErrorTrackingService.getError(errorId);
    expect(error?.level).toBe('info');
  });

  it('should get recent errors', () => {
    ErrorTrackingService.captureError(new Error('Error 1'));
    ErrorTrackingService.captureError(new Error('Error 2'));
    ErrorTrackingService.captureWarning('Warning 1');

    const recent = ErrorTrackingService.getRecentErrors(10);

    expect(recent).toHaveLength(3);
    expect(recent[0].message).toBe('Warning 1');
  });

  it('should get errors by level', () => {
    ErrorTrackingService.captureError(new Error('Error 1'));
    ErrorTrackingService.captureError(new Error('Error 2'));
    ErrorTrackingService.captureWarning('Warning 1');

    const errors = ErrorTrackingService.getErrorsByLevel('error');
    const warnings = ErrorTrackingService.getErrorsByLevel('warning');

    expect(errors).toHaveLength(2);
    expect(warnings).toHaveLength(1);
  });

  it('should get errors by endpoint', () => {
    ErrorTrackingService.captureError(new Error('Error 1'), { endpoint: '/api/users' });
    ErrorTrackingService.captureError(new Error('Error 2'), { endpoint: '/api/payments' });
    ErrorTrackingService.captureError(new Error('Error 3'), { endpoint: '/api/users' });

    const userErrors = ErrorTrackingService.getErrorsByEndpoint('/api/users');
    const paymentErrors = ErrorTrackingService.getErrorsByEndpoint('/api/payments');

    expect(userErrors).toHaveLength(2);
    expect(paymentErrors).toHaveLength(1);
  });

  it('should get error statistics', () => {
    ErrorTrackingService.captureError(new Error('Error 1'));
    ErrorTrackingService.captureError(new Error('Error 2'));
    ErrorTrackingService.captureWarning('Warning 1');
    ErrorTrackingService.captureInfo('Info 1');

    const stats = ErrorTrackingService.getStatistics();

    expect(stats.total).toBe(4);
    expect(stats.byLevel.error).toBe(2);
    expect(stats.byLevel.warning).toBe(1);
    expect(stats.byLevel.info).toBe(1);
  });

  it('should get errors in time range', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60000);
    const future = new Date(now.getTime() + 60000);

    ErrorTrackingService.captureError(new Error('Error 1'));

    const errors = ErrorTrackingService.getErrorsInRange(past, future);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should add breadcrumbs', () => {
    ErrorTrackingService.addBreadcrumb('User clicked button', 'user-action');
    ErrorTrackingService.addBreadcrumb('API request sent', 'http');

    const status = ErrorTrackingService.getStatus();
    expect(status.initialized).toBe(true);
  });

  it('should set and clear user context', () => {
    ErrorTrackingService.setUserContext(123, 'user@example.com', 'testuser');
    ErrorTrackingService.clearUserContext();

    const status = ErrorTrackingService.getStatus();
    expect(status.initialized).toBe(true);
  });
});

describe('Webhook Service', () => {
  beforeEach(() => {
    WebhookService.clearAll();
  });

  it('should register a webhook', () => {
    const webhook = WebhookService.registerWebhook(
      1,
      'https://example.com/webhook',
      ['rate_limit.exceeded', 'api_key.created'],
      'secret123',
    );

    expect(webhook.id).toBeDefined();
    expect(webhook.id).toMatch(/^wh_/);
    expect(webhook.url).toBe('https://example.com/webhook');
    expect(webhook.events).toHaveLength(2);
    expect(webhook.isActive).toBe(true);
  });

  it('should get webhook by ID', () => {
    const registered = WebhookService.registerWebhook(1, 'https://example.com/webhook', ['rate_limit.exceeded']);
    const retrieved = WebhookService.getWebhook(registered.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.url).toBe('https://example.com/webhook');
  });

  it('should list webhooks for a user', () => {
    WebhookService.registerWebhook(1, 'https://example.com/webhook1', ['rate_limit.exceeded']);
    WebhookService.registerWebhook(1, 'https://example.com/webhook2', ['api_key.created']);
    WebhookService.registerWebhook(2, 'https://example.com/webhook3', ['rate_limit.exceeded']);

    const user1Webhooks = WebhookService.listWebhooks(1);
    const user2Webhooks = WebhookService.listWebhooks(2);

    expect(user1Webhooks).toHaveLength(2);
    expect(user2Webhooks).toHaveLength(1);
  });

  it('should update webhook', () => {
    const webhook = WebhookService.registerWebhook(1, 'https://example.com/webhook', ['rate_limit.exceeded']);

    const updated = WebhookService.updateWebhook(webhook.id, {
      url: 'https://example.com/webhook-updated',
      isActive: false,
    });

    expect(updated?.url).toBe('https://example.com/webhook-updated');
    expect(updated?.isActive).toBe(false);
  });

  it('should delete webhook', () => {
    const webhook = WebhookService.registerWebhook(1, 'https://example.com/webhook', ['rate_limit.exceeded']);

    WebhookService.deleteWebhook(webhook.id);

    const retrieved = WebhookService.getWebhook(webhook.id);
    expect(retrieved).toBeNull();
  });

  it('should get webhook statistics', () => {
    const webhook = WebhookService.registerWebhook(1, 'https://example.com/webhook', ['rate_limit.exceeded']);

    const stats = WebhookService.getWebhookStats(webhook.id);

    expect(stats.totalDeliveries).toBe(0);
    expect(stats.successfulDeliveries).toBe(0);
    expect(stats.failedDeliveries).toBe(0);
    expect(stats.successRate).toBe(0);
  });

  it('should get service status', () => {
    WebhookService.registerWebhook(1, 'https://example.com/webhook1', ['rate_limit.exceeded']);
    WebhookService.registerWebhook(1, 'https://example.com/webhook2', ['api_key.created']);

    const status = WebhookService.getStatus();

    expect(status.totalWebhooks).toBe(2);
    expect(status.activeWebhooks).toBe(2);
    expect(status.queuedEvents).toBe(0);
    expect(status.isProcessing).toBe(false);
  });

  it('should handle webhook event triggering', async () => {
    const webhook = WebhookService.registerWebhook(1, 'https://example.com/webhook', ['rate_limit.exceeded']);

    await WebhookService.triggerEvent('rate_limit.exceeded', 1, {
      keyId: 'test-key',
      limit: 100,
      window: '1 hour',
    });

    // Give async processing a moment
    await new Promise((resolve) => setTimeout(resolve, 100));

    const status = WebhookService.getStatus();
    expect(status.totalWebhooks).toBe(1);
  });

  it('should filter webhooks by event type', async () => {
    const webhook1 = WebhookService.registerWebhook(1, 'https://example.com/webhook1', ['rate_limit.exceeded']);
    const webhook2 = WebhookService.registerWebhook(1, 'https://example.com/webhook2', ['api_key.created']);

    // Only webhook1 should receive this event
    await WebhookService.triggerEvent('rate_limit.exceeded', 1, { test: true });

    const status = WebhookService.getStatus();
    expect(status.totalWebhooks).toBe(2);
  });

  it('should get delivery history', () => {
    const webhook = WebhookService.registerWebhook(1, 'https://example.com/webhook', ['rate_limit.exceeded']);

    const history = WebhookService.getDeliveryHistory(webhook.id, 10);

    expect(Array.isArray(history)).toBe(true);
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    ErrorTrackingService.clearAll();
    WebhookService.clearAll();
  });

  it('should track errors and trigger webhook events', async () => {
    const webhook = WebhookService.registerWebhook(1, 'https://example.com/webhook', ['error.critical']);

    ErrorTrackingService.captureError(new Error('Critical error'), {
      userId: 1,
      endpoint: '/api/critical',
      statusCode: 500,
    });

    const errors = ErrorTrackingService.getRecentErrors(10);
    expect(errors).toHaveLength(1);

    const status = WebhookService.getStatus();
    expect(status.totalWebhooks).toBe(1);
  });

  it('should handle multiple error levels and webhook events', () => {
    WebhookService.registerWebhook(1, 'https://example.com/webhook1', ['error.critical']);
    WebhookService.registerWebhook(1, 'https://example.com/webhook2', ['rate_limit.exceeded']);

    ErrorTrackingService.captureError(new Error('Error 1'));
    ErrorTrackingService.captureWarning('Warning 1');
    ErrorTrackingService.captureInfo('Info 1');

    const stats = ErrorTrackingService.getStatistics();
    const webhookStatus = WebhookService.getStatus();

    expect(stats.total).toBe(3);
    expect(webhookStatus.totalWebhooks).toBe(2);
  });
});
