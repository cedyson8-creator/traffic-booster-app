import { describe, it, expect, beforeEach } from 'vitest';
import { QuotaBillingService, PLAN_QUOTAS, PLAN_PRICING } from '../services/quota-billing.service';
import { WebhookSignaturesService } from '../services/webhook-signatures.service';
import { AuditLoggingService } from '../services/audit-logging.service';

/**
 * Scaling Features Tests
 * Tests for quotas, billing, webhook signatures, and audit logging
 */

describe('Quota & Billing Service', () => {
  let quotaService: QuotaBillingService;

  beforeEach(() => {
    quotaService = new QuotaBillingService();
  });

  it('should initialize quota for organization', () => {
    const quota = quotaService.initializeQuota('org_123', 'pro');

    expect(quota.organizationId).toBe('org_123');
    expect(quota.plan).toBe('pro');
    expect(quota.quotaLimits.monthlyRequests).toBe(100000);
    expect(quota.requestsUsed).toBe(0);
  });

  it('should record API requests', () => {
    quotaService.initializeQuota('org_123', 'pro');

    const result = quotaService.recordRequest('org_123', 100);
    expect(result).toBe(true);

    const quota = quotaService.getQuota('org_123');
    expect(quota?.requestsUsed).toBe(100);
  });

  it('should prevent requests on free plan when over quota', () => {
    quotaService.initializeQuota('org_123', 'free');

    // Free plan has 10,000 monthly requests
    const result = quotaService.recordRequest('org_123', 10001);
    expect(result).toBe(false);

    const quota = quotaService.getQuota('org_123');
    expect(quota?.isOverQuota).toBe(true);
  });

  it('should allow overage on paid plans', () => {
    quotaService.initializeQuota('org_123', 'pro');

    // Pro plan has 100,000 monthly requests
    const result = quotaService.recordRequest('org_123', 150000);
    expect(result).toBe(true);

    const quota = quotaService.getQuota('org_123');
    expect(quota?.requestsUsed).toBe(150000);
    expect(quota?.overageCharges).toBeGreaterThan(0);
  });

  it('should calculate usage percentage', () => {
    quotaService.initializeQuota('org_123', 'pro');
    quotaService.recordRequest('org_123', 50000);

    const percentage = quotaService.getUsagePercentage('org_123', 'requests');
    expect(percentage).toBe(50);
  });

  it('should generate billing records', () => {
    quotaService.initializeQuota('org_123', 'pro');
    quotaService.recordRequest('org_123', 150000);

    const record = quotaService.generateBillingRecord('org_123');
    expect(record.organizationId).toBe('org_123');
    expect(record.baseCost).toBe(9900); // $99/month
    expect(record.overageCharges).toBeGreaterThan(0);
    expect(record.status).toBe('pending');
  });

  it('should mark billing as paid', () => {
    quotaService.initializeQuota('org_123', 'pro');
    const record = quotaService.generateBillingRecord('org_123');

    const updated = quotaService.markBillingAsPaid(record.id);
    expect(updated?.status).toBe('paid');
    expect(updated?.paidDate).toBeDefined();
  });

  it('should upgrade organization plan', () => {
    quotaService.initializeQuota('org_123', 'free');

    const upgraded = quotaService.upgradePlan('org_123', 'pro');
    expect(upgraded?.plan).toBe('pro');
    expect(upgraded?.quotaLimits.monthlyRequests).toBe(100000);
  });

  it('should create quota alerts', () => {
    quotaService.initializeQuota('org_123', 'pro');

    // Record 95% of quota
    quotaService.recordRequest('org_123', 95000);

    const alerts = quotaService.getQuotaAlerts('org_123');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].type).toBe('warning');
  });

  it('should record webhook usage', () => {
    quotaService.initializeQuota('org_123', 'pro');

    const result = quotaService.recordWebhook('org_123', 500);
    expect(result).toBe(true);

    const quota = quotaService.getQuota('org_123');
    expect(quota?.webhooksUsed).toBe(500);
  });

  it('should record export usage', () => {
    quotaService.initializeQuota('org_123', 'pro');

    const result = quotaService.recordExport('org_123', 5);
    expect(result).toBe(true);

    const quota = quotaService.getQuota('org_123');
    expect(quota?.exportsUsed).toBe(5);
  });

  it('should record alert usage', () => {
    quotaService.initializeQuota('org_123', 'pro');

    const result = quotaService.recordAlert('org_123', 50);
    expect(result).toBe(true);

    const quota = quotaService.getQuota('org_123');
    expect(quota?.alertsUsed).toBe(50);
  });

  it('should get billing history', () => {
    quotaService.initializeQuota('org_123', 'pro');
    quotaService.generateBillingRecord('org_123');
    quotaService.generateBillingRecord('org_123');

    const history = quotaService.getBillingHistory('org_123');
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Webhook Signatures Service', () => {
  it('should generate webhook secret', () => {
    const secret = WebhookSignaturesService.generateSecret();
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThanOrEqual(64);
  });

  it('should generate signature for payload', () => {
    const payload = { event: 'test', data: { id: 123 } };
    const secret = WebhookSignaturesService.generateSecret();

    const { signature, timestamp, nonce } = WebhookSignaturesService.generateSignature(payload, secret);

    expect(signature).toBeDefined();
    expect(timestamp).toBeGreaterThan(0);
    expect(nonce).toBeDefined();
  });

  it('should verify valid signature', () => {
    const payload = { event: 'test', data: { id: 123 } };
    const secret = WebhookSignaturesService.generateSecret();

    const { signature, timestamp, nonce } = WebhookSignaturesService.generateSignature(payload, secret);

    const result = WebhookSignaturesService.verifySignature(
      payload,
      signature,
      secret,
      timestamp,
      nonce,
      'sha256',
      300,
    );

    expect(result.valid).toBe(true);
  });

  it('should reject invalid signature', () => {
    const payload = { event: 'test', data: { id: 123 } };
    const secret = WebhookSignaturesService.generateSecret();

    const { signature, timestamp, nonce } = WebhookSignaturesService.generateSignature(payload, secret);

    const result = WebhookSignaturesService.verifySignature(
      payload,
      'invalid_signature',
      secret,
      timestamp,
      nonce,
      'sha256',
      300,
    );

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject expired timestamp', () => {
    const payload = { event: 'test', data: { id: 123 } };
    const secret = WebhookSignaturesService.generateSecret();

    const { signature, nonce } = WebhookSignaturesService.generateSignature(payload, secret);
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago

    const result = WebhookSignaturesService.verifySignature(
      payload,
      signature,
      secret,
      oldTimestamp,
      nonce,
      'sha256',
      300,
    );

    expect(result.valid).toBe(false);
  });

  it('should create signed payload', () => {
    const payload = { event: 'test', data: { id: 123 } };
    const secret = WebhookSignaturesService.generateSecret();

    const signed = WebhookSignaturesService.createSignedPayload(payload, secret);

    expect(signed.payload).toEqual(payload);
    expect(signed.signature).toBeDefined();
    expect(signed.timestamp).toBeGreaterThan(0);
    expect(signed.nonce).toBeDefined();
  });

  it('should get signature headers', () => {
    const payload = { event: 'test', data: { id: 123 } };
    const secret = WebhookSignaturesService.generateSecret();

    const headers = WebhookSignaturesService.getSignatureHeaders(payload, secret);

    expect(headers['x-webhook-signature']).toBeDefined();
    expect(headers['x-webhook-timestamp']).toBeDefined();
    expect(headers['x-webhook-nonce']).toBeDefined();
  });

  it('should validate secret format', () => {
    const validSecret = WebhookSignaturesService.generateSecret();
    expect(WebhookSignaturesService.isValidSecret(validSecret)).toBe(true);

    expect(WebhookSignaturesService.isValidSecret('short')).toBe(false);
  });
});

describe('Audit Logging Service', () => {
  let auditService: AuditLoggingService;

  beforeEach(() => {
    auditService = new AuditLoggingService();
  });

  it('should log audit event', () => {
    const entry = auditService.logEvent('api_key_created', 'API key created', { keyName: 'test' }, {
      organizationId: 'org_123',
      userId: 1,
    });

    expect(entry.id).toBeDefined();
    expect(entry.eventType).toBe('api_key_created');
    expect(entry.action).toBe('API key created');
  });

  it('should log API call', () => {
    const entry = auditService.logApiCall('/api/users', 'GET', 200, 150, 'org_123', 1, '192.168.1.1');

    expect(entry.eventType).toBe('api_call');
    expect(entry.details.endpoint).toBe('/api/users');
    expect(entry.details.statusCode).toBe(200);
  });

  it('should log API key creation', () => {
    const entry = auditService.logApiKeyCreated('key_123', 'Production Key', 'org_123', 1, 'pro');

    expect(entry.eventType).toBe('api_key_created');
    expect(entry.details.keyName).toBe('Production Key');
  });

  it('should log team member addition', () => {
    const entry = auditService.logTeamMemberAdded(2, 'dev@example.com', 'developer', 'org_123', 1);

    expect(entry.eventType).toBe('team_member_added');
    expect(entry.details.memberEmail).toBe('dev@example.com');
  });

  it('should log plan upgrade', () => {
    const entry = auditService.logPlanUpgrade('org_123', 'free', 'pro', 1);

    expect(entry.eventType).toBe('plan_upgraded');
    expect(entry.details.fromPlan).toBe('free');
    expect(entry.details.toPlan).toBe('pro');
  });

  it('should log billing payment', () => {
    const entry = auditService.logBillingPayment('org_123', 9900, '2026-02', 'success', 1);

    expect(entry.eventType).toBe('billing_payment');
    expect(entry.status).toBe('success');
  });

  it('should get audit logs with filtering', () => {
    auditService.logApiKeyCreated('key_1', 'Key 1', 'org_123', 1, 'pro');
    auditService.logApiKeyCreated('key_2', 'Key 2', 'org_123', 1, 'pro');
    auditService.logTeamMemberAdded(2, 'dev@example.com', 'developer', 'org_123', 1);

    const logs = auditService.getAuditLogs({
      organizationId: 'org_123',
      eventType: 'api_key_created',
    });

    expect(logs.length).toBe(2);
  });

  it('should get audit statistics', () => {
    auditService.logApiKeyCreated('key_1', 'Key 1', 'org_123', 1, 'pro');
    auditService.logApiKeyCreated('key_2', 'Key 2', 'org_123', 1, 'pro');
    auditService.logTeamMemberAdded(2, 'dev@example.com', 'developer', 'org_123', 1);

    const stats = auditService.getAuditStats('org_123');

    expect(stats.totalEvents).toBe(3);
    expect(stats.successRate).toBe(100);
  });

  it('should export audit logs as JSON', () => {
    auditService.logApiKeyCreated('key_1', 'Key 1', 'org_123', 1, 'pro');

    const json = auditService.exportAuditLogs({ organizationId: 'org_123' }, 'json');
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('should export audit logs as CSV', () => {
    auditService.logApiKeyCreated('key_1', 'Key 1', 'org_123', 1, 'pro');

    const csv = auditService.exportAuditLogs({ organizationId: 'org_123' }, 'csv');

    expect(csv).toContain('ID');
    expect(csv).toContain('api_key_created');
  });

  it('should get recent activity', () => {
    auditService.logApiKeyCreated('key_1', 'Key 1', 'org_123', 1, 'pro');
    auditService.logTeamMemberAdded(2, 'dev@example.com', 'developer', 'org_123', 1);

    const activity = auditService.getRecentActivity('org_123', 10);

    expect(activity.length).toBe(2);
  });

  it('should get user activity', () => {
    auditService.logApiKeyCreated('key_1', 'Key 1', 'org_123', 1, 'pro');
    auditService.logApiKeyCreated('key_2', 'Key 2', 'org_123', 1, 'pro');
    auditService.logTeamMemberAdded(2, 'dev@example.com', 'developer', 'org_123', 2);

    const activity = auditService.getUserActivity(1, 10);

    expect(activity.length).toBe(2);
  });

  it('should delete old logs', () => {
    auditService.logApiKeyCreated('key_1', 'Key 1', 'org_123', 1, 'pro');

    const deleted = auditService.deleteOldLogs(0); // Delete all
    expect(deleted).toBeGreaterThan(0);
  });

  it('should log error', () => {
    const entry = auditService.logError('org_123', '/api/users', 'Database connection failed', 500, 1, '192.168.1.1');

    expect(entry.eventType).toBe('error_occurred');
    expect(entry.status).toBe('failure');
  });
});

describe('Integration Tests', () => {
  it('should handle complete quota and billing workflow', () => {
    const quotaService = new QuotaBillingService();

    // Initialize quota
    quotaService.initializeQuota('org_123', 'pro');

    // Record usage
    quotaService.recordRequest('org_123', 50000);
    quotaService.recordWebhook('org_123', 5000);
    quotaService.recordExport('org_123', 50);

    // Check usage
    const requestUsage = quotaService.getUsagePercentage('org_123', 'requests');
    expect(requestUsage).toBe(50);

    // Generate billing
    const record = quotaService.generateBillingRecord('org_123');
    expect(record.status).toBe('pending');

    // Mark as paid
    const paid = quotaService.markBillingAsPaid(record.id);
    expect(paid?.status).toBe('paid');
  });

  it('should handle webhook signature verification workflow', () => {
    const payload = { event: 'user.created', userId: 123, email: 'user@example.com' };
    const secret = WebhookSignaturesService.generateSecret();

    // Generate signature
    const { signature, timestamp, nonce } = WebhookSignaturesService.generateSignature(payload, secret);

    // Verify signature
    const result = WebhookSignaturesService.verifySignature(
      payload,
      signature,
      secret,
      timestamp,
      nonce,
      'sha256',
      300,
    );

    expect(result.valid).toBe(true);
  });

  it('should handle complete audit logging workflow', () => {
    const auditService = new AuditLoggingService();

    // Log various events
    auditService.logApiKeyCreated('key_123', 'Production', 'org_123', 1, 'pro');
    auditService.logApiCall('/api/users', 'GET', 200, 150, 'org_123', 1, '192.168.1.1');
    auditService.logTeamMemberAdded(2, 'dev@example.com', 'developer', 'org_123', 1);
    auditService.logPlanUpgrade('org_123', 'free', 'pro', 1);

    // Get statistics
    const stats = auditService.getAuditStats('org_123');
    expect(stats.totalEvents).toBe(4);
    expect(stats.successRate).toBe(100);

    // Export logs
    const json = auditService.exportAuditLogs({ organizationId: 'org_123' }, 'json');
    const parsed = JSON.parse(json);
    expect(parsed.length).toBe(4);
  });
});
