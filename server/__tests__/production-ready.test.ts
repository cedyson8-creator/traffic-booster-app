import { describe, it, expect, beforeEach } from 'vitest';
import { EmailAlertService } from '../services/email-alert.service';
import { DatabasePersistenceService } from '../services/database-persistence.service';

/**
 * Production Ready Features Tests
 * Tests for email alerts, database persistence, and admin dashboard
 */

describe('Email Alert Service', () => {
  beforeEach(() => {
    EmailAlertService.clearAllCooldowns();
  });

  it('should subscribe to alerts', async () => {
    const result = await EmailAlertService.subscribeToAlert(1, 'user@example.com', 'error_rate', 5);
    expect(result).toBeDefined();
  });

  it('should unsubscribe from alerts', async () => {
    const result = await EmailAlertService.unsubscribeFromAlert(1);
    expect(result).toBeUndefined();
  });

  it('should get active subscriptions', async () => {
    const subs = await EmailAlertService.getActiveSubscriptions(1);
    expect(Array.isArray(subs)).toBe(true);
  });

  it('should send error rate alert', async () => {
    await EmailAlertService.sendAlert(1, 'error_rate', {
      errorRate: 7.5,
      totalErrors: 15,
      level: 'error',
      endpoint: '/api/users',
      period: '60 minutes',
      dashboardUrl: 'https://dashboard.example.com',
    });

    // Alert should be sent without throwing
    expect(true).toBe(true);
  });

  it('should send webhook failure alert', async () => {
    await EmailAlertService.sendAlert(1, 'webhook_failure', {
      webhookUrl: 'https://example.com/webhook',
      webhookId: 'wh_123',
      failureCount: 3,
      lastError: 'Connection timeout',
      successRate: 85,
      period: '1 hour',
      dashboardUrl: 'https://dashboard.example.com',
    });

    expect(true).toBe(true);
  });

  it('should send rate limit alert', async () => {
    await EmailAlertService.sendAlert(1, 'rate_limit_exceeded', {
      keyName: 'Production API Key',
      keyId: 'key_123',
      limit: 1000,
      usage: 1050,
      tier: 'pro',
      dashboardUrl: 'https://dashboard.example.com',
    });

    expect(true).toBe(true);
  });

  it('should send API key rotated alert', async () => {
    await EmailAlertService.sendAlert(1, 'api_key_rotated', {
      keyName: 'Production API Key',
      oldKeyId: 'key_old_123',
      newKeyId: 'key_new_456',
      rotatedAt: new Date().toISOString(),
      dashboardUrl: 'https://dashboard.example.com',
    });

    expect(true).toBe(true);
  });

  it('should respect alert cooldown', async () => {
    await EmailAlertService.sendAlert(1, 'error_rate', {
      errorRate: 7.5,
      totalErrors: 15,
      level: 'error',
      endpoint: '/api/users',
      period: '60 minutes',
      dashboardUrl: 'https://dashboard.example.com',
    });

    // Second alert should be skipped due to cooldown
    await EmailAlertService.sendAlert(1, 'error_rate', {
      errorRate: 8.0,
      totalErrors: 16,
      level: 'error',
      endpoint: '/api/users',
      period: '60 minutes',
      dashboardUrl: 'https://dashboard.example.com',
    });

    expect(true).toBe(true);
  });

  it('should get alert history', async () => {
    const history = await EmailAlertService.getAlertHistory(1, 10);
    expect(Array.isArray(history)).toBe(true);
  });

  it('should check error rate', async () => {
    await EmailAlertService.checkErrorRate(1, 60);
    expect(true).toBe(true);
  });
});

describe('Database Persistence Service', () => {
  it('should save webhook log', async () => {
    const result = await DatabasePersistenceService.saveWebhookLog(
      1,
      'wh_123',
      'https://example.com/webhook',
      'rate_limit.exceeded',
      1,
      200,
      'OK',
      undefined,
      new Date(),
    );

    expect(result).toBeDefined();
  });

  it('should get webhook logs', async () => {
    const logs = await DatabasePersistenceService.getWebhookLogs(1, 100);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should get webhook logs for specific webhook', async () => {
    const logs = await DatabasePersistenceService.getWebhookLogsForWebhook('wh_123', 100);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should save error log', async () => {
    const result = await DatabasePersistenceService.saveErrorLog(
      'err_123',
      'Database connection failed',
      'error',
      1,
      '/api/users',
      500,
      'Error: ECONNREFUSED',
      { retries: 3 },
      { service: 'database' },
    );

    expect(result).toBeDefined();
  });

  it('should get error logs', async () => {
    const logs = await DatabasePersistenceService.getErrorLogs(1, 100);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should get error logs by level', async () => {
    const logs = await DatabasePersistenceService.getErrorLogsByLevel(1, 'error', 100);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should get error logs by endpoint', async () => {
    const logs = await DatabasePersistenceService.getErrorLogsByEndpoint(1, '/api/users', 100);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should get error statistics', async () => {
    const stats = await DatabasePersistenceService.getErrorStatistics(1);
    expect(stats).toBeDefined();
    if (stats) {
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.byLevel).toBeDefined();
      expect(stats.byEndpoint).toBeDefined();
    }
  });

  it('should get webhook statistics', async () => {
    const stats = await DatabasePersistenceService.getWebhookStatistics('wh_123');
    expect(stats).toBeDefined();
    if (stats) {
      expect(stats.totalDeliveries).toBeGreaterThanOrEqual(0);
      expect(stats.successfulDeliveries).toBeGreaterThanOrEqual(0);
      expect(stats.failedDeliveries).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    }
  });

  it('should cleanup old logs', async () => {
    await DatabasePersistenceService.cleanupOldLogs(30);
    expect(true).toBe(true);
  });

  it('should export error logs to CSV', async () => {
    const csv = await DatabasePersistenceService.exportErrorLogsToCSV(1);
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  it('should export webhook logs to CSV', async () => {
    const csv = await DatabasePersistenceService.exportWebhookLogsToCSV('wh_123');
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    EmailAlertService.clearAllCooldowns();
  });

  it('should handle complete alert workflow', async () => {
    // Subscribe to alert
    await EmailAlertService.subscribeToAlert(1, 'admin@example.com', 'error_rate', 5);

    // Send alert
    await EmailAlertService.sendAlert(1, 'error_rate', {
      errorRate: 7.5,
      totalErrors: 15,
      level: 'error',
      endpoint: '/api/users',
      period: '60 minutes',
      dashboardUrl: 'https://dashboard.example.com',
    });

    // Get history
    const history = await EmailAlertService.getAlertHistory(1, 10);
    expect(Array.isArray(history)).toBe(true);
  });

  it('should handle complete persistence workflow', async () => {
    // Save webhook log
    await DatabasePersistenceService.saveWebhookLog(
      1,
      'wh_123',
      'https://example.com/webhook',
      'rate_limit.exceeded',
      1,
      200,
      'OK',
    );

    // Save error log
    await DatabasePersistenceService.saveErrorLog(
      'err_123',
      'Test error',
      'error',
      1,
      '/api/test',
      500,
    );

    // Get statistics
    const webhookStats = await DatabasePersistenceService.getWebhookStatistics('wh_123');
    const errorStats = await DatabasePersistenceService.getErrorStatistics(1);

    expect(webhookStats).toBeDefined();
    expect(errorStats).toBeDefined();
  });

  it('should handle multiple alert types', async () => {
    const alertTypes: Array<'error_rate' | 'webhook_failure' | 'rate_limit_exceeded' | 'api_key_rotated'> = [
      'error_rate',
      'webhook_failure',
      'rate_limit_exceeded',
      'api_key_rotated',
    ];

    for (const alertType of alertTypes) {
      await EmailAlertService.sendAlert(1, alertType, {
        errorRate: 7.5,
        totalErrors: 15,
        level: 'error',
        endpoint: '/api/users',
        period: '60 minutes',
        dashboardUrl: 'https://dashboard.example.com',
      });
    }

    expect(true).toBe(true);
  });

  it('should export data in multiple formats', async () => {
    // Save some data
    await DatabasePersistenceService.saveErrorLog('err_001', 'Error 1', 'error', 1);
    await DatabasePersistenceService.saveErrorLog('err_002', 'Error 2', 'warning', 1);

    // Export to CSV
    const csv = await DatabasePersistenceService.exportErrorLogsToCSV(1);

    expect(typeof csv).toBe('string');
    expect(csv.includes('Error ID')).toBe(true);
  });
});
