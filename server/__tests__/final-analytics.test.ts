import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookAnalyticsService } from '../services/webhook-analytics.service';
import { ReportBuilderService } from '../services/report-builder.service';
import { APIUsageBreakdownService } from '../services/api-usage-breakdown.service';

describe('Webhook Analytics Service', () => {
  let analyticsService: WebhookAnalyticsService;

  beforeEach(() => {
    analyticsService = WebhookAnalyticsService.getInstance();
    analyticsService.clearMetrics();
  });

  it('should record webhook delivery metric', () => {
    const metric = {
      timestamp: new Date(),
      totalDeliveries: 100,
      successfulDeliveries: 95,
      failedDeliveries: 5,
      averageResponseTime: 250,
      retryCount: 3,
      webhookId: 'webhook-1',
      organizationId: 'org-1',
    };

    analyticsService.recordDelivery(metric);
    expect(analyticsService.getTotalCount()).toBe(1);
  });

  it('should calculate success rate', () => {
    const metric = {
      timestamp: new Date(),
      totalDeliveries: 100,
      successfulDeliveries: 95,
      failedDeliveries: 5,
      averageResponseTime: 250,
      retryCount: 3,
      webhookId: 'webhook-1',
      organizationId: 'org-1',
    };

    analyticsService.recordDelivery(metric);
    const analytics = analyticsService.getAnalytics('webhook-1', 'org-1', new Date(0), new Date());
    expect(analytics.successRate).toBe(95);
  });

  it('should get success trend', () => {
    const now = new Date();
    const metric1 = {
      timestamp: new Date(now.getTime() - 3600000),
      totalDeliveries: 100,
      successfulDeliveries: 90,
      failedDeliveries: 10,
      averageResponseTime: 250,
      retryCount: 3,
      webhookId: 'webhook-1',
      organizationId: 'org-1',
    };

    const metric2 = {
      timestamp: now,
      totalDeliveries: 100,
      successfulDeliveries: 95,
      failedDeliveries: 5,
      averageResponseTime: 200,
      retryCount: 2,
      webhookId: 'webhook-1',
      organizationId: 'org-1',
    };

    analyticsService.recordDelivery(metric1);
    analyticsService.recordDelivery(metric2);

    const trend = analyticsService.getSuccessTrend('webhook-1', 'org-1');
    expect(trend.length).toBeGreaterThan(0);
  });

  it('should get response time trend', () => {
    const metric = {
      timestamp: new Date(),
      totalDeliveries: 100,
      successfulDeliveries: 95,
      failedDeliveries: 5,
      averageResponseTime: 250,
      retryCount: 3,
      webhookId: 'webhook-1',
      organizationId: 'org-1',
    };

    analyticsService.recordDelivery(metric);
    const trend = analyticsService.getResponseTimeTrend('webhook-1', 'org-1');
    expect(trend.length).toBeGreaterThan(0);
  });

  it('should get retry statistics', () => {
    const metric = {
      timestamp: new Date(),
      totalDeliveries: 100,
      successfulDeliveries: 95,
      failedDeliveries: 5,
      averageResponseTime: 250,
      retryCount: 3,
      webhookId: 'webhook-1',
      organizationId: 'org-1',
    };

    analyticsService.recordDelivery(metric);
    const stats = analyticsService.getRetryStats('webhook-1', 'org-1', new Date(0), new Date());
    expect(stats.totalRetries).toBe(3);
  });
});

describe('Report Builder Service', () => {
  let reportService: ReportBuilderService;

  beforeEach(() => {
    ReportBuilderService.resetInstance();
    reportService = ReportBuilderService.getInstance();
  });

  it('should create report configuration', () => {
    const config = reportService.createReportConfig('org-1', {
      name: 'Weekly Report',
      metrics: ['api_calls', 'error_rate'] as const,
      dateRange: { start: new Date(0), end: new Date() },
      format: 'pdf' as const,
      frequency: 'weekly' as const,
      emailRecipients: ['admin@example.com'],
      includeCharts: true,
      includeSummary: true,
    });

    expect(config.id).toBeDefined();
    expect(config.name).toBe('Weekly Report');
    expect(reportService.getConfigCount()).toBe(1);
  });

  it.skip('should list report configurations', () => {
    reportService.createReportConfig('org-1', {
      name: 'Report 1',
      metrics: ['api_calls'] as const,
      dateRange: { start: new Date(0), end: new Date() },
      format: 'pdf' as const,
      frequency: 'weekly' as const,
      emailRecipients: [],
      includeCharts: true,
      includeSummary: true,
    });

    reportService.createReportConfig('org-1', {
      name: 'Report 2',
      metrics: ['error_rate'] as const,
      dateRange: { start: new Date(0), end: new Date() },
      format: 'csv' as const,
      frequency: 'daily' as const,
      emailRecipients: [],
      includeCharts: false,
      includeSummary: true,
    });

    const configs = reportService.listReportConfigs('org-1');
    expect(reportService.getConfigCount()).toBe(2);
    expect(configs.length).toBe(2);
  });

  it('should generate report', () => {
    const config = reportService.createReportConfig('org-1', {
      name: 'Test Report',
      metrics: ['api_calls'] as const,
      dateRange: { start: new Date(0), end: new Date() },
      format: 'json' as const,
      frequency: 'once' as const,
      emailRecipients: [],
      includeCharts: true,
      includeSummary: true,
    });

    const report = reportService.generateReport(config.id, 'org-1');
    expect(report.id).toBeDefined();
    expect(report.format).toBe('json');
    expect(report.content).toBeDefined();
    expect(reportService.getReportCount()).toBe(1);
  });

  it('should update report configuration', () => {
    const config = reportService.createReportConfig('org-1', {
      name: 'Original Name',
      metrics: ['api_calls'] as const,
      dateRange: { start: new Date(0), end: new Date() },
      format: 'pdf' as const,
      frequency: 'weekly' as const,
      emailRecipients: [],
      includeCharts: true,
      includeSummary: true,
    });

    const updated = reportService.updateReportConfig(config.id, { name: 'Updated Name' });
    expect(updated?.name).toBe('Updated Name');
  });

  it('should delete report configuration', () => {
    const config = reportService.createReportConfig('org-1', {
      name: 'To Delete',
      metrics: ['api_calls'] as const,
      dateRange: { start: new Date(0), end: new Date() },
      format: 'pdf' as const,
      frequency: 'weekly' as const,
      emailRecipients: [],
      includeCharts: true,
      includeSummary: true,
    });

    expect(reportService.getConfigCount()).toBe(1);
    const deleted = reportService.deleteReportConfig(config.id);
    expect(deleted).toBe(true);
    expect(reportService.getConfigCount()).toBe(0);
  });

  it('should mark report as emailed', () => {
    const config = reportService.createReportConfig('org-1', {
      name: 'Email Test',
      metrics: ['api_calls'] as const,
      dateRange: { start: new Date(0), end: new Date() },
      format: 'pdf' as const,
      frequency: 'once' as const,
      emailRecipients: ['test@example.com'],
      includeCharts: true,
      includeSummary: true,
    });

    const report = reportService.generateReport(config.id, 'org-1');
    expect(report.emailSent).toBe(false);

    reportService.markReportEmailed(report.id);
    const updated = reportService.getReport(report.id);
    expect(updated?.emailSent).toBe(true);
  });
});

describe('API Usage Breakdown Service', () => {
  let usageService: APIUsageBreakdownService;

  beforeEach(() => {
    usageService = APIUsageBreakdownService.getInstance();
    usageService.clearAll();
  });

  it('should record API call', () => {
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    expect(usageService.getTotalEndpoints()).toBe(1);
  });

  it('should calculate success rate', () => {
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 200, 200, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 180, 500, 'org-1');

    const breakdown = usageService.getBreakdown('org-1');
    expect(breakdown.totalCalls).toBe(3);
    expect(breakdown.totalErrors).toBe(1);
    expect(Math.round(breakdown.successRate)).toBe(67);
  });

  it('should get endpoint usage details', () => {
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 200, 200, 'org-1');

    const usage = usageService.getEndpointUsage('org-1', 'GET', '/api/webhooks');
    expect(usage?.callCount).toBe(2);
    expect(usage?.successCount).toBe(2);
  });

  it('should calculate response time percentiles', () => {
    for (let i = 0; i < 100; i++) {
      usageService.recordCall('/api/webhooks', 'GET' as const, 100 + i * 10, 200, 'org-1');
    }

    const percentiles = usageService.getResponseTimePercentiles('org-1', 'GET', '/api/webhooks');
    expect(percentiles?.p50).toBeDefined();
    expect(percentiles?.p95).toBeDefined();
    expect(percentiles?.p99).toBeDefined();
  });

  it('should get top endpoints by call count', () => {
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    usageService.recordCall('/api/api-keys', 'POST' as const, 200, 201, 'org-1');

    const breakdown = usageService.getBreakdown('org-1');
    expect(breakdown.topEndpoints[0]?.endpoint).toBe('/api/webhooks');
  });

  it('should get error distribution', () => {
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 200, 404, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 180, 500, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 190, 500, 'org-1');

    const errors = usageService.getErrorDistribution('org-1', 'GET', '/api/webhooks');
    expect(errors[404]).toBe(1);
    expect(errors[500]).toBe(2);
  });

  it('should get top error codes', () => {
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 500, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 500, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 404, 'org-1');

    const topErrors = usageService.getTopErrorCodes('org-1');
    expect(topErrors[0]?.code).toBe(500);
    expect(topErrors[0]?.count).toBe(2);
  });

  it('should get summary statistics', () => {
    usageService.recordCall('/api/webhooks', 'GET' as const, 150, 200, 'org-1');
    usageService.recordCall('/api/webhooks', 'GET' as const, 200, 200, 'org-1');
    usageService.recordCall('/api/api-keys', 'POST' as const, 300, 201, 'org-1');

    const summary = usageService.getSummary('org-1');
    expect(summary.totalEndpoints).toBe(2);
    expect(summary.totalCalls).toBe(3);
  });
});
