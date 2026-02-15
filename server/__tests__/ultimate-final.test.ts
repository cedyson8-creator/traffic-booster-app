import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookLogSearchService, type SearchFilter } from '../services/webhook-log-search.service';
import { AlertNotificationCenterService } from '../services/alert-notification-center.service';

describe('Webhook Log Search Service', () => {
  let searchService: WebhookLogSearchService;

  beforeEach(() => {
    searchService = new WebhookLogSearchService();
  });

  it('should add webhook log entry', () => {
    const log = {
      id: 'log-1',
      eventType: 'email.sent',
      status: 'success' as const,
      statusCode: 200,
      responseTime: 150,
      timestamp: new Date(),
      payload: { email: 'test@example.com' },
      retryCount: 0,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    searchService.addLog(log);
    expect(searchService.getTotalCount()).toBe(1);
  });

  it('should search logs by event type', () => {
    const log1 = {
      id: 'log-1',
      eventType: 'email.sent',
      status: 'success' as const,
      statusCode: 200,
      responseTime: 150,
      timestamp: new Date(),
      payload: {},
      retryCount: 0,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    const log2 = {
      id: 'log-2',
      eventType: 'email.failed',
      status: 'failed' as const,
      statusCode: 500,
      responseTime: 200,
      timestamp: new Date(),
      payload: {},
      retryCount: 1,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    searchService.addLog(log1);
    searchService.addLog(log2);

    const result = searchService.search({ eventType: 'email.sent' });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].eventType).toBe('email.sent');
  });

  it('should search logs by status', () => {
    const log1 = {
      id: 'log-1',
      eventType: 'email.sent',
      status: 'success' as const,
      statusCode: 200,
      responseTime: 150,
      timestamp: new Date(),
      payload: {},
      retryCount: 0,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    const log2 = {
      id: 'log-2',
      eventType: 'email.failed',
      status: 'failed' as const,
      statusCode: 500,
      responseTime: 200,
      timestamp: new Date(),
      payload: {},
      retryCount: 1,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    searchService.addLog(log1);
    searchService.addLog(log2);

    const result = searchService.search({ status: 'failed' });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].status).toBe('failed');
  });

  it('should search logs by response time range', () => {
    const log1 = {
      id: 'log-1',
      eventType: 'email.sent',
      status: 'success' as const,
      statusCode: 200,
      responseTime: 100,
      timestamp: new Date(),
      payload: {},
      retryCount: 0,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    const log2 = {
      id: 'log-2',
      eventType: 'email.sent',
      status: 'success' as const,
      statusCode: 200,
      responseTime: 5000,
      timestamp: new Date(),
      payload: {},
      retryCount: 0,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    searchService.addLog(log1);
    searchService.addLog(log2);

    const result = searchService.search({ minResponseTime: 1000, maxResponseTime: 6000 });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].responseTime).toBe(5000);
  });

  it('should get statistics', () => {
    const log1 = {
      id: 'log-1',
      eventType: 'email.sent',
      status: 'success' as const,
      statusCode: 200,
      responseTime: 150,
      timestamp: new Date(),
      payload: {},
      retryCount: 0,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    const log2 = {
      id: 'log-2',
      eventType: 'email.sent',
      status: 'failed' as const,
      statusCode: 500,
      responseTime: 200,
      timestamp: new Date(),
      payload: {},
      retryCount: 1,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    searchService.addLog(log1);
    searchService.addLog(log2);

    const stats = searchService.getStatistics();
    expect(stats.total).toBe(2);
    expect(stats.successful).toBe(1);
    expect(stats.failed).toBe(1);
  });

  it('should export logs as CSV', () => {
    const log = {
      id: 'log-1',
      eventType: 'email.sent',
      status: 'success' as const,
      statusCode: 200,
      responseTime: 150,
      timestamp: new Date('2026-02-15'),
      payload: {},
      retryCount: 0,
      webhookUrl: 'https://example.com/webhook',
      organizationId: 'org-1',
    };

    searchService.addLog(log);
    const csv = searchService.exportAsCSV();
    expect(csv).toContain('log-1');
    expect(csv).toContain('email.sent');
  });
});

describe('Alert Notification Center Service', () => {
  let centerService: AlertNotificationCenterService;

  beforeEach(() => {
    centerService = new AlertNotificationCenterService();
  });

  it('should create notification center for user', () => {
    const center = centerService.createCenter('user-1', 'org-1');
    expect(center.userId).toBe('user-1');
    expect(center.organizationId).toBe('org-1');
    expect(center.unreadCount).toBe(0);
  });

  it('should add notification to center', () => {
    const notification = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'High Error Rate',
      description: 'Error rate exceeded 5%',
      severity: 'critical' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'error_rate',
    };

    centerService.addNotification(notification);
    const notifications = centerService.getNotifications('user-1', 'org-1');
    expect(notifications).toHaveLength(1);
    expect(centerService.getUnreadCount('user-1', 'org-1')).toBe(1);
  });

  it('should acknowledge notification', () => {
    const notification = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'High Error Rate',
      description: 'Error rate exceeded 5%',
      severity: 'critical' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'error_rate',
    };

    centerService.addNotification(notification);
    const updated = centerService.acknowledgeNotification('notif-1');
    expect(updated?.status).toBe('acknowledged');
    expect(centerService.getUnreadCount('user-1', 'org-1')).toBe(0);
  });

  it('should snooze notification', () => {
    const notification = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'High Error Rate',
      description: 'Error rate exceeded 5%',
      severity: 'critical' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'error_rate',
    };

    centerService.addNotification(notification);
    const snoozed = centerService.snoozeNotification('notif-1', 30);
    expect(snoozed?.status).toBe('snoozed');
    expect(snoozed?.snoozedUntil).toBeDefined();
  });

  it('should resolve notification', () => {
    const notification = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'High Error Rate',
      description: 'Error rate exceeded 5%',
      severity: 'critical' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'error_rate',
    };

    centerService.addNotification(notification);
    const resolved = centerService.resolveNotification('notif-1');
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolvedAt).toBeDefined();
  });

  it('should get critical notifications', () => {
    const critical = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Critical Error',
      description: 'System down',
      severity: 'critical' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'system',
    };

    const warning = {
      id: 'notif-2',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Warning',
      description: 'High memory usage',
      severity: 'warning' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'system',
    };

    centerService.addNotification(critical);
    centerService.addNotification(warning);

    const criticals = centerService.getCriticalNotifications('user-1', 'org-1');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].severity).toBe('critical');
  });

  it('should get notification statistics', () => {
    const notification = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Alert',
      description: 'Test alert',
      severity: 'critical' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'test',
    };

    centerService.addNotification(notification);
    const stats = centerService.getStatistics('user-1', 'org-1');
    expect(stats.total).toBe(1);
    expect(stats.unread).toBe(1);
    expect(stats.critical).toBe(1);
  });

  it('should mark all as read', () => {
    const notif1 = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Alert 1',
      description: 'Test',
      severity: 'info' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'test',
    };

    const notif2 = {
      id: 'notif-2',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Alert 2',
      description: 'Test',
      severity: 'info' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'test',
    };

    centerService.addNotification(notif1);
    centerService.addNotification(notif2);
    expect(centerService.getUnreadCount('user-1', 'org-1')).toBe(2);

    const marked = centerService.markAllAsRead('user-1', 'org-1');
    expect(marked).toBe(2);
    expect(centerService.getUnreadCount('user-1', 'org-1')).toBe(0);
  });

  it('should delete notification', () => {
    const notification = {
      id: 'notif-1',
      userId: 'user-1',
      organizationId: 'org-1',
      title: 'Alert',
      description: 'Test',
      severity: 'info' as const,
      status: 'new' as const,
      createdAt: new Date(),
      source: 'test',
    };

    centerService.addNotification(notification);
    expect(centerService.getTotalCount()).toBe(1);

    const deleted = centerService.deleteNotification('notif-1');
    expect(deleted).toBe(true);
    expect(centerService.getTotalCount()).toBe(0);
  });
});
