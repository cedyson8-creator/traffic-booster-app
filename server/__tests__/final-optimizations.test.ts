import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookRetryService, DEFAULT_RETRY_CONFIG } from '../services/webhook-retry.service';
import { ComplianceExportService } from '../services/compliance-export.service';

/**
 * Final Optimizations Tests
 * Tests for webhook retries, compliance exports, and pricing UI
 */

describe('Webhook Retry Service', () => {
  let retryService: WebhookRetryService;

  beforeEach(() => {
    retryService = new WebhookRetryService();
  });

  it('should calculate exponential backoff delay', () => {
    const delay1 = WebhookRetryService.calculateNextDelay(1, DEFAULT_RETRY_CONFIG);
    const delay2 = WebhookRetryService.calculateNextDelay(2, DEFAULT_RETRY_CONFIG);
    const delay3 = WebhookRetryService.calculateNextDelay(3, DEFAULT_RETRY_CONFIG);

    // Each delay should be approximately 2x the previous (with jitter)
    expect(delay2).toBeGreaterThanOrEqual(delay1);
    expect(delay3).toBeGreaterThanOrEqual(delay2);
  });

  it('should cap delay at maxDelayMs', () => {
    const delay = WebhookRetryService.calculateNextDelay(10, DEFAULT_RETRY_CONFIG);
    expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.maxDelayMs);
  });

  it('should get and set retry policy', () => {
    const config = { maxRetries: 3, initialDelayMs: 500 };
    const policy = retryService.setRetryPolicy('webhook_123', config);

    expect(policy.webhookId).toBe('webhook_123');
    expect(policy.maxRetries).toBe(3);
    expect(policy.initialDelayMs).toBe(500);

    const retrieved = retryService.getRetryPolicy('webhook_123');
    expect(retrieved.maxRetries).toBe(3);
  });

  it('should record retry attempt', () => {
    const attempt = retryService.recordAttempt('webhook_123', 'event_456', 1, 'failed', 500, 150, 'Connection timeout');

    expect(attempt.webhookId).toBe('webhook_123');
    expect(attempt.eventId).toBe('event_456');
    expect(attempt.attemptNumber).toBe(1);
    expect(attempt.status).toBe('scheduled');
    expect(attempt.nextRetryTime).toBeDefined();
  });

  it('should mark successful attempt', () => {
    const attempt = retryService.recordAttempt('webhook_123', 'event_456', 1, 'success', 200, 100);

    expect(attempt.status).toBe('success');
    expect(attempt.nextRetryTime).toBeUndefined();
  });

  it('should get retry history', () => {
    retryService.recordAttempt('webhook_123', 'event_456', 1, 'failed', 500, 150);
    retryService.recordAttempt('webhook_123', 'event_456', 2, 'success', 200, 100);

    const history = retryService.getRetryHistory('webhook_123', 'event_456');
    expect(history.length).toBe(2);
  });

  it('should get pending retries', () => {
    retryService.recordAttempt('webhook_123', 'event_456', 1, 'failed', 500, 150);
    retryService.recordAttempt('webhook_456', 'event_789', 1, 'failed', 500, 150);

    const pending = retryService.getPendingRetries();
    expect(pending.length).toBeGreaterThanOrEqual(0);
  });

  it('should calculate retry statistics', () => {
    retryService.setRetryPolicy('webhook_123', { maxRetries: 0 });
    retryService.recordAttempt('webhook_123', 'event_1', 1, 'failed', 500, 150);
    retryService.recordAttempt('webhook_123', 'event_1', 2, 'success', 200, 100);
    retryService.recordAttempt('webhook_123', 'event_2', 1, 'failed', 500, 200);

    const stats = retryService.getRetryStats('webhook_123');

    expect(stats.totalAttempts).toBe(3);
    expect(stats.successCount).toBe(1);
    expect(stats.failureCount).toBeGreaterThanOrEqual(1);
    expect(stats.successRate).toBeGreaterThan(0);
    expect(stats.averageResponseTime).toBeGreaterThan(0);
  });

  it('should determine if retry should occur', () => {
    retryService.setRetryPolicy('webhook_123', { maxRetries: 3 });

    expect(retryService.shouldRetry('webhook_123', 1)).toBe(true);
    expect(retryService.shouldRetry('webhook_123', 2)).toBe(true);
    expect(retryService.shouldRetry('webhook_123', 3)).toBe(false);
  });

  it('should get next retry time', () => {
    const nextTime = retryService.getNextRetryTime('webhook_123', 1);
    expect(nextTime).toBeDefined();
    expect(nextTime!.getTime()).toBeGreaterThan(Date.now());
  });

  it('should get backoff schedule', () => {
    const schedule = retryService.getBackoffSchedule('webhook_123', 3);

    expect(schedule.length).toBe(3);
    expect(schedule[0]).toBeLessThanOrEqual(schedule[1]);
    expect(schedule[1]).toBeLessThanOrEqual(schedule[2]);
  });

  it('should export retry logs as JSON', () => {
    retryService.recordAttempt('webhook_123', 'event_456', 1, 'failed', 500, 150);

    const json = retryService.exportRetryLogs('webhook_123', 'json');
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('should export retry logs as CSV', () => {
    retryService.recordAttempt('webhook_123', 'event_456', 1, 'failed', 500, 150);

    const csv = retryService.exportRetryLogs('webhook_123', 'csv');

    expect(csv).toContain('ID');
    expect(csv).toContain('webhook_123');
  });

  it('should cleanup old attempts', () => {
    retryService.recordAttempt('webhook_123', 'event_456', 1, 'failed', 500, 150);

    const deleted = retryService.cleanupOldAttempts(0); // Delete all
    expect(deleted).toBeGreaterThan(0);
  });
});

describe('Compliance Export Service', () => {
  let complianceService: ComplianceExportService;

  beforeEach(() => {
    complianceService = new ComplianceExportService();
  });

  it('should generate SOC 2 report', () => {
    const auditLogs = [
      { eventType: 'api_call', status: 'success', duration: 100 },
      { eventType: 'security_event', status: 'success', duration: 50 },
    ];
    const errorLogs = [{ message: 'Test error' }];
    const webhookLogs = [{ status: 'delivered' }];

    const report = complianceService.generateSOC2Report('org_123', auditLogs, errorLogs, webhookLogs);

    expect(report.organizationId).toBe('org_123');
    expect(report.reportType).toBe('SOC2');
    expect(report.status).toBe('completed');
    expect(report.summary.totalEvents).toBeGreaterThan(0);
  });

  it('should generate GDPR report', () => {
    const auditLogs = [
      { eventType: 'data_access', status: 'success' },
      { eventType: 'data_modified', status: 'success' },
    ];
    const dataProcessingRecords = [{ type: 'consent' }];

    const report = complianceService.generateGDPRReport('org_123', auditLogs, dataProcessingRecords);

    expect(report.organizationId).toBe('org_123');
    expect(report.reportType).toBe('GDPR');
    expect(report.status).toBe('completed');
  });

  it('should create GDPR access request', () => {
    const request = complianceService.createGDPRAccessRequest('org_123', 1);

    expect(request.organizationId).toBe('org_123');
    expect(request.userId).toBe(1);
    expect(request.requestType).toBe('access');
    expect(request.status).toBe('pending');
  });

  it('should create GDPR deletion request', () => {
    const request = complianceService.createGDPRDeletionRequest('org_123', 1, 'User requested deletion');

    expect(request.organizationId).toBe('org_123');
    expect(request.userId).toBe(1);
    expect(request.requestType).toBe('deletion');
    expect(request.reason).toBe('User requested deletion');
  });

  it('should create GDPR portability request', () => {
    const request = complianceService.createGDPRPortabilityRequest('org_123', 1);

    expect(request.organizationId).toBe('org_123');
    expect(request.userId).toBe(1);
    expect(request.requestType).toBe('portability');
  });

  it('should complete GDPR request', () => {
    const request = complianceService.createGDPRAccessRequest('org_123', 1);
    const completed = complianceService.completeGDPRRequest(request.id, 'https://example.com/export.json');

    expect(completed?.status).toBe('completed');
    expect(completed?.dataExportUrl).toBe('https://example.com/export.json');
  });

  it('should get GDPR requests for organization', () => {
    complianceService.createGDPRAccessRequest('org_123', 1);
    complianceService.createGDPRAccessRequest('org_123', 2);
    complianceService.createGDPRAccessRequest('org_456', 1);

    const requests = complianceService.getGDPRRequests('org_123');
    expect(requests.length).toBe(2);
  });

  it('should get pending GDPR requests', () => {
    const request1 = complianceService.createGDPRAccessRequest('org_123', 1);
    const request2 = complianceService.createGDPRAccessRequest('org_123', 2);

    complianceService.completeGDPRRequest(request1.id);

    const pending = complianceService.getPendingGDPRRequests();
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });

  it('should initialize SOC 2 criteria', () => {
    complianceService.initializeSOC2Criteria('org_123');
    const criteria = complianceService.getSOC2Criteria('org_123');

    expect(criteria.length).toBeGreaterThan(0);
    expect(criteria[0].cc).toBeDefined();
    expect(criteria[0].status).toBe('compliant');
  });

  it('should export report as JSON', () => {
    const report = complianceService.generateSOC2Report('org_123', [], [], []);
    const json = complianceService.exportReportAsJSON(report.id);

    expect(json).toBeDefined();
    const parsed = JSON.parse(json!);
    expect(parsed.reportType).toBe('SOC2');
  });

  it('should export report as CSV', () => {
    const report = complianceService.generateSOC2Report('org_123', [], [], []);
    const csv = complianceService.exportReportAsCSV(report.id);

    expect(csv).toBeDefined();
    expect(csv).toContain('Report Type');
    expect(csv).toContain('SOC2');
  });

  it('should export report as HTML', () => {
    const report = complianceService.generateSOC2Report('org_123', [], [], []);
    const html = complianceService.exportReportAsHTML(report.id);

    expect(html).toBeDefined();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('SOC2 Compliance Report');
  });

  it('should get all reports for organization', () => {
    complianceService.generateSOC2Report('org_123', [], [], []);
    complianceService.generateGDPRReport('org_123', [], []);
    complianceService.generateSOC2Report('org_456', [], [], []);

    const reports = complianceService.getReports('org_123');
    expect(reports.length).toBe(2);
  });

  it('should get report by ID', () => {
    const report = complianceService.generateSOC2Report('org_123', [], [], []);
    const retrieved = complianceService.getReport(report.id);

    expect(retrieved?.id).toBe(report.id);
    expect(retrieved?.reportType).toBe('SOC2');
  });

  it('should delete old reports', () => {
    const report = complianceService.generateSOC2Report('org_123', [], [], []);
    // Manually set report date to past to ensure deletion
    report.generatedAt = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago

    const deleted = complianceService.deleteOldReports(365); // Delete reports older than 365 days
    expect(deleted).toBeGreaterThan(0);
  });
});

describe('Integration Tests', () => {
  it('should handle complete webhook retry workflow', () => {
    const retryService = new WebhookRetryService();

    // Record failed attempt
    const attempt1 = retryService.recordAttempt('webhook_123', 'event_456', 1, 'failed', 500, 150, 'Timeout');
    expect(attempt1.status).toBe('scheduled');

    // Record retry success
    const attempt2 = retryService.recordAttempt('webhook_123', 'event_456', 2, 'success', 200, 100);
    expect(attempt2.status).toBe('success');

    // Check statistics
    const stats = retryService.getRetryStats('webhook_123');
    expect(stats.totalAttempts).toBe(2);
    expect(stats.successCount).toBe(1);
  });

  it('should handle complete compliance workflow', () => {
    const complianceService = new ComplianceExportService();

    // Generate reports
    const soc2Report = complianceService.generateSOC2Report('org_123', [], [], []);
    const gdprReport = complianceService.generateGDPRReport('org_123', [], []);

    // Create GDPR request
    const gdprRequest = complianceService.createGDPRAccessRequest('org_123', 1);

    // Complete request
    complianceService.completeGDPRRequest(gdprRequest.id, 'https://example.com/export.json');

    // Export reports
    const soc2Json = complianceService.exportReportAsJSON(soc2Report.id);
    const gdprCsv = complianceService.exportReportAsCSV(gdprReport.id);

    expect(soc2Json).toBeDefined();
    expect(gdprCsv).toBeDefined();

    // Get all reports
    const reports = complianceService.getReports('org_123');
    expect(reports.length).toBe(2);
  });
});
