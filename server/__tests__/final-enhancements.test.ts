import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookEventFilterService, FilteredLog } from '../services/webhook-event-filter.service';
import { AlertTemplatesService } from '../services/alert-templates.service';
import { AlertAggregationService, AlertEvent } from '../services/alert-aggregation.service';

describe('Webhook Event Filter Service', () => {
  let filterService: WebhookEventFilterService;

  beforeEach(() => {
    filterService = new WebhookEventFilterService();
  });

  it('should filter logs by event type', () => {
    const log: FilteredLog = {
      id: '1',
      webhookId: 'webhook-1',
      eventType: 'user.created',
      status: 'success',
      payload: { userId: '123' },
      responseTime: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    filterService.addLog(log);
    const filtered = filterService.getLogsByEventType('user.created');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].eventType).toBe('user.created');
  });

  it('should filter logs by status', () => {
    const logs: FilteredLog[] = [
      {
        id: '1',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'success',
        payload: {},
        responseTime: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'failed',
        payload: {},
        responseTime: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    logs.forEach(log => filterService.addLog(log));
    const failed = filterService.getLogsByStatus('failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].status).toBe('failed');
  });

  it('should filter logs by response time range', () => {
    const logs: FilteredLog[] = [
      {
        id: '1',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'success',
        payload: {},
        responseTime: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'success',
        payload: {},
        responseTime: 2000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    logs.forEach(log => filterService.addLog(log));
    const slow = filterService.getLogsByResponseTime(1000, 3000);
    expect(slow).toHaveLength(1);
    expect(slow[0].responseTime).toBe(2000);
  });

  it('should calculate event type statistics', () => {
    const logs: FilteredLog[] = [
      {
        id: '1',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'success',
        payload: {},
        responseTime: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        webhookId: 'webhook-1',
        eventType: 'user.updated',
        status: 'success',
        payload: {},
        responseTime: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'success',
        payload: {},
        responseTime: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    logs.forEach(log => filterService.addLog(log));
    const stats = filterService.getEventTypeStats();
    expect(stats['user.created']).toBe(2);
    expect(stats['user.updated']).toBe(1);
  });

  it('should calculate success rate', () => {
    const logs: FilteredLog[] = [
      {
        id: '1',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'success',
        payload: {},
        responseTime: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        webhookId: 'webhook-1',
        eventType: 'user.created',
        status: 'failed',
        payload: {},
        responseTime: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    logs.forEach(log => filterService.addLog(log));
    const rate = filterService.getSuccessRate();
    expect(rate).toBe(50);
  });

  it('should search logs by query', () => {
    const log: FilteredLog = {
      id: '1',
      webhookId: 'webhook-1',
      eventType: 'user.created',
      status: 'success',
      payload: { userId: '123', email: 'test@example.com' },
      responseTime: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    filterService.addLog(log);
    const results = filterService.searchLogs('test@example.com');
    expect(results).toHaveLength(1);
  });

  it('should export logs as JSON', () => {
    const log: FilteredLog = {
      id: '1',
      webhookId: 'webhook-1',
      eventType: 'user.created',
      status: 'success',
      payload: {},
      responseTime: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    filterService.addLog(log);
    const json = filterService.exportLogs({});
    expect(json).toContain('user.created');
    expect(json).toContain('webhook-1');
  });
});

describe('Alert Templates Service', () => {
  let templateService: AlertTemplatesService;

  beforeEach(() => {
    templateService = new AlertTemplatesService();
  });

  it('should have default templates', () => {
    const templates = templateService.getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get template by ID', () => {
    const template = templateService.getTemplate('high-error-rate');
    expect(template).toBeDefined();
    expect(template?.name).toBe('High Error Rate');
  });

  it('should get templates by trigger type', () => {
    const templates = templateService.getTemplatesByTriggerType('error_rate');
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every(t => t.triggerType === 'error_rate')).toBe(true);
  });

  it('should get templates by severity', () => {
    const templates = templateService.getTemplatesBySeverity('critical');
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every(t => t.severity === 'critical')).toBe(true);
  });

  it('should create custom template from existing template', () => {
    const custom = templateService.createFromTemplate('high-error-rate', {
      threshold: 10,
    });
    expect(custom.threshold).toBe(10);
    expect(custom.name).toBe('High Error Rate');
  });

  it('should get recommended templates for startup', () => {
    const templates = templateService.getRecommendedTemplates('startup');
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get recommended templates for enterprise', () => {
    const templates = templateService.getRecommendedTemplates('enterprise');
    expect(templates.length).toBeGreaterThanOrEqual(
      templateService.getRecommendedTemplates('startup').length
    );
  });

  it('should search templates by name', () => {
    const results = templateService.searchTemplates('error');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(t => t.name.toLowerCase().includes('error'))).toBe(true);
  });

  it('should export and import templates', () => {
    const exported = templateService.exportTemplates();
    expect(exported).toContain('high-error-rate');
    expect(JSON.parse(exported)).toBeInstanceOf(Array);
  });
});

describe('Alert Aggregation Service', () => {
  let aggregationService: AlertAggregationService;

  beforeEach(() => {
    aggregationService = new AlertAggregationService();
  });

  it('should create digest for organization', () => {
    const digest = aggregationService.createDigest('org-1', 'daily');
    expect(digest.organizationId).toBe('org-1');
    expect(digest.frequency).toBe('daily');
    expect(digest.enabled).toBe(true);
  });

  it('should add alerts to pending queue', () => {
    aggregationService.createDigest('org-1', 'daily');
    const alert: AlertEvent = {
      id: 'alert-1',
      alertId: 'config-1',
      severity: 'high',
      message: 'Error rate exceeded',
      timestamp: new Date(),
    };

    aggregationService.addAlertToPending('org-1', alert);
    const pending = aggregationService.getPendingAlerts('org-1');
    expect(pending).toHaveLength(1);
  });

  it('should send digest email', () => {
    aggregationService.createDigest('org-1', 'daily');
    const alert: AlertEvent = {
      id: 'alert-1',
      alertId: 'config-1',
      severity: 'critical',
      message: 'Critical error',
      timestamp: new Date(),
    };

    aggregationService.addAlertToPending('org-1', alert);
    const email = aggregationService.sendDigest('org-1', 'admin@example.com');
    expect(email).toBeDefined();
    expect(email?.to).toBe('admin@example.com');
    expect(email?.alerts).toHaveLength(1);
  });

  it('should clear pending alerts after sending digest', () => {
    aggregationService.createDigest('org-1', 'daily');
    const alert: AlertEvent = {
      id: 'alert-1',
      alertId: 'config-1',
      severity: 'high',
      message: 'Error',
      timestamp: new Date(),
    };

    aggregationService.addAlertToPending('org-1', alert);
    aggregationService.sendDigest('org-1', 'admin@example.com');
    const pending = aggregationService.getPendingAlerts('org-1');
    expect(pending).toHaveLength(0);
  });

  it('should update digest frequency', () => {
    aggregationService.createDigest('org-1', 'daily');
    const updated = aggregationService.updateDigestFrequency('org-1', 'hourly');
    expect(updated?.frequency).toBe('hourly');
  });

  it('should enable/disable digest', () => {
    aggregationService.createDigest('org-1', 'daily');
    const disabled = aggregationService.setDigestEnabled('org-1', false);
    expect(disabled?.enabled).toBe(false);
  });

  it('should get digests due for sending', () => {
    const digest = aggregationService.createDigest('org-1', 'hourly');
    // Set next send time to past
    digest.nextSendAt = new Date(Date.now() - 1000);
    
    const due = aggregationService.getDigestsDue();
    expect(due.length).toBeGreaterThan(0);
  });

  it('should get digest statistics', () => {
    aggregationService.createDigest('org-1', 'daily');
    const stats = aggregationService.getDigestStats();
    expect(stats.totalDigests).toBe(1);
    expect(stats.enabledDigests).toBe(1);
  });

  it('should test digest email generation', () => {
    aggregationService.createDigest('org-1', 'daily');
    const testEmail = aggregationService.testDigestEmail('org-1', 'admin@example.com');
    expect(testEmail).toBeDefined();
    expect(testEmail?.alerts).toHaveLength(3);
    expect(testEmail?.subject).toContain('Alert Digest');
  });

  it('should generate digest subject with alert counts', () => {
    aggregationService.createDigest('org-1', 'daily');
    const alerts: AlertEvent[] = [
      {
        id: '1',
        alertId: 'a1',
        severity: 'critical',
        message: 'Critical',
        timestamp: new Date(),
      },
      {
        id: '2',
        alertId: 'a2',
        severity: 'high',
        message: 'High',
        timestamp: new Date(),
      },
    ];

    alerts.forEach(a => aggregationService.addAlertToPending('org-1', a));
    const email = aggregationService.sendDigest('org-1', 'admin@example.com');
    expect(email?.subject).toContain('Critical');
    expect(email?.subject).toContain('High');
  });
});
