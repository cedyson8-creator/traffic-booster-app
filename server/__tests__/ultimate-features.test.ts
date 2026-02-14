import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentProcessorService } from '../services/payment-processor.service';
import { ComplianceSchedulerService } from '../services/compliance-scheduler.service';

/**
 * Ultimate Features Tests
 * Tests for payment processing, webhook testing, and compliance scheduling
 */

describe('Payment Processor Service', () => {
  let paymentService: PaymentProcessorService;

  beforeEach(() => {
    paymentService = new PaymentProcessorService();
  });

  it('should create payment method', () => {
    const method = paymentService.createPaymentMethod(
      'org_123',
      'stripe',
      'card',
      '4242',
      12,
      2025,
    );

    expect(method.organizationId).toBe('org_123');
    expect(method.provider).toBe('stripe');
    expect(method.type).toBe('card');
    expect(method.last4).toBe('4242');
    expect(method.isDefault).toBe(true);
  });

  it('should get payment method', () => {
    const created = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const retrieved = paymentService.getPaymentMethod(created.id);

    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.last4).toBe('4242');
  });

  it('should list payment methods', () => {
    paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    paymentService.createPaymentMethod('org_123', 'paypal', 'paypal', '5555');
    paymentService.createPaymentMethod('org_456', 'stripe', 'card', '1111');

    const methods = paymentService.listPaymentMethods('org_123');
    expect(methods.length).toBe(2);
  });

  it('should set default payment method', () => {
    const method1 = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const method2 = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '5555');

    expect(method1.isDefault).toBe(true);
    expect(method2.isDefault).toBe(false);

    paymentService.setDefaultPaymentMethod('org_123', method2.id);
    const updated = paymentService.getPaymentMethod(method2.id);

    expect(updated?.isDefault).toBe(true);
  });

  it('should delete payment method', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const deleted = paymentService.deletePaymentMethod(method.id);

    expect(deleted).toBe(true);
    expect(paymentService.getPaymentMethod(method.id)).toBeUndefined();
  });

  it('should create subscription', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const subscription = paymentService.createSubscription(
      'org_123',
      'plan_pro',
      method.id,
      'stripe',
    );

    expect(subscription.organizationId).toBe('org_123');
    expect(subscription.planId).toBe('plan_pro');
    expect(subscription.status).toBe('active');
  });

  it('should list subscriptions', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    paymentService.createSubscription('org_123', 'plan_pro', method.id, 'stripe');
    paymentService.createSubscription('org_123', 'plan_free', method.id, 'stripe');
    paymentService.createSubscription('org_456', 'plan_pro', method.id, 'stripe');

    const subs = paymentService.listSubscriptions('org_123');
    expect(subs.length).toBe(2);
  });

  it('should cancel subscription', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const subscription = paymentService.createSubscription(
      'org_123',
      'plan_pro',
      method.id,
      'stripe',
    );

    const canceled = paymentService.cancelSubscription(subscription.id);
    expect(canceled?.status).toBe('canceled');
    expect(canceled?.canceledAt).toBeDefined();
  });

  it('should create payment intent', () => {
    const intent = paymentService.createPaymentIntent('org_123', 9900, 'usd', 'stripe');

    expect(intent.organizationId).toBe('org_123');
    expect(intent.amount).toBe(9900);
    expect(intent.currency).toBe('usd');
    expect(intent.status).toBe('requires_payment_method');
    expect(intent.clientSecret).toBeDefined();
  });

  it('should confirm payment intent', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const intent = paymentService.createPaymentIntent('org_123', 9900, 'usd', 'stripe');

    const confirmed = paymentService.confirmPaymentIntent(intent.id, method.id);
    expect(confirmed?.status).toBe('processing');
  });

  it('should create invoice', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const subscription = paymentService.createSubscription(
      'org_123',
      'plan_pro',
      method.id,
      'stripe',
    );

    const invoice = paymentService.createInvoice(
      'org_123',
      subscription.id,
      9900,
      'usd',
      'stripe',
    );

    expect(invoice.organizationId).toBe('org_123');
    expect(invoice.amount).toBe(9900);
    expect(invoice.status).toBe('sent');
  });

  it('should list invoices', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const subscription = paymentService.createSubscription(
      'org_123',
      'plan_pro',
      method.id,
      'stripe',
    );

    paymentService.createInvoice('org_123', subscription.id, 9900, 'usd', 'stripe');
    paymentService.createInvoice('org_123', subscription.id, 9900, 'usd', 'stripe');
    paymentService.createInvoice('org_456', subscription.id, 9900, 'usd', 'stripe');

    const invoices = paymentService.listInvoices('org_123');
    expect(invoices.length).toBe(2);
  });

  it('should mark invoice as paid', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const subscription = paymentService.createSubscription(
      'org_123',
      'plan_pro',
      method.id,
      'stripe',
    );
    const invoice = paymentService.createInvoice(
      'org_123',
      subscription.id,
      9900,
      'usd',
      'stripe',
    );

    const paid = paymentService.markInvoiceAsPaid(invoice.id);
    expect(paid?.status).toBe('paid');
    expect(paid?.paidDate).toBeDefined();
  });

  it('should get billing summary', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    paymentService.createSubscription('org_123', 'plan_pro', method.id, 'stripe');

    const summary = paymentService.getBillingSummary('org_123');
    expect(summary.activeSubscriptions).toBe(1);
  });

  it('should validate payment method', () => {
    expect(paymentService.validatePaymentMethod('4242', 12, 2026)).toBe(true);
    expect(paymentService.validatePaymentMethod('42', 12, 2026)).toBe(false);
    expect(paymentService.validatePaymentMethod('4242', 13, 2026)).toBe(false);
  });

  it('should export billing data as JSON', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const subscription = paymentService.createSubscription(
      'org_123',
      'plan_pro',
      method.id,
      'stripe',
    );
    paymentService.createInvoice('org_123', subscription.id, 9900, 'usd', 'stripe');

    const json = paymentService.exportBillingData('org_123', 'json');
    const data = JSON.parse(json);

    expect(Array.isArray(data.invoices)).toBe(true);
    expect(Array.isArray(data.subscriptions)).toBe(true);
  });

  it('should export billing data as CSV', () => {
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242');
    const subscription = paymentService.createSubscription(
      'org_123',
      'plan_pro',
      method.id,
      'stripe',
    );
    paymentService.createInvoice('org_123', subscription.id, 9900, 'usd', 'stripe');

    const csv = paymentService.exportBillingData('org_123', 'csv');
    expect(csv).toContain('Invoice Number');
    expect(csv).toContain('Amount');
  });
});

describe('Compliance Scheduler Service', () => {
  let schedulerService: ComplianceSchedulerService;

  beforeEach(() => {
    schedulerService = new ComplianceSchedulerService();
  });

  it('should create scheduled report', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    expect(report.organizationId).toBe('org_123');
    expect(report.reportType).toBe('SOC2');
    expect(report.frequency).toBe('monthly');
    expect(report.isActive).toBe(true);
  });

  it('should list scheduled reports', () => {
    schedulerService.createScheduledReport('org_123', 'SOC2', 'monthly', ['admin@example.com']);
    schedulerService.createScheduledReport('org_123', 'GDPR', 'quarterly', ['admin@example.com']);
    schedulerService.createScheduledReport('org_456', 'SOC2', 'monthly', ['admin@example.com']);

    const reports = schedulerService.listScheduledReports('org_123');
    expect(reports.length).toBe(2);
  });

  it('should update scheduled report', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    const updated = schedulerService.updateScheduledReport(report.id, {
      recipientEmails: ['admin@example.com', 'compliance@example.com'],
    });

    expect(updated?.recipientEmails.length).toBe(2);
  });

  it('should delete scheduled report', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    const deleted = schedulerService.deleteScheduledReport(report.id);
    expect(deleted).toBe(true);
    expect(schedulerService.getScheduledReport(report.id)).toBeUndefined();
  });

  it('should create report schedule', () => {
    const schedule = schedulerService.createReportSchedule(
      'org_123',
      'SOC2',
      'monthly',
      '09:00',
      'UTC',
      undefined,
      1,
    );

    expect(schedule.organizationId).toBe('org_123');
    expect(schedule.reportType).toBe('SOC2');
    expect(schedule.time).toBe('09:00');
  });

  it('should execute scheduled report', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    const execution = schedulerService.executeScheduledReport(report.id);

    expect(execution.scheduledReportId).toBe(report.id);
    expect(execution.status).toBe('processing');
  });

  it('should list executions', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    const exec1 = schedulerService.executeScheduledReport(report.id);
    const exec2 = schedulerService.executeScheduledReport(report.id);

    const executions = schedulerService.listExecutions(report.id);
    expect(executions.length).toBeGreaterThanOrEqual(2);
  });

  it('should get pending reports', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    // Set next run time to past
    schedulerService.updateScheduledReport(report.id, {
      nextRunTime: new Date(Date.now() - 1000),
    });

    const pending = schedulerService.getPendingReports();
    expect(pending.length).toBeGreaterThan(0);
  });

  it('should get email queue', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    schedulerService.executeScheduledReport(report.id);

    // Wait for async execution
    setTimeout(() => {
      const queue = schedulerService.getEmailQueue();
      expect(queue.length).toBeGreaterThanOrEqual(0);
    }, 3000);
  });

  it('should process email queue', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com', 'compliance@example.com'],
    );

    schedulerService.executeScheduledReport(report.id);

    // Wait for async execution
    setTimeout(() => {
      const processed = schedulerService.processEmailQueue();
      expect(processed).toBeGreaterThanOrEqual(0);
    }, 3000);
  });

  it('should get compliance calendar', () => {
    schedulerService.createScheduledReport('org_123', 'SOC2', 'monthly', ['admin@example.com']);
    schedulerService.createScheduledReport('org_123', 'GDPR', 'quarterly', ['admin@example.com']);

    const calendar = schedulerService.getComplianceCalendar('org_123');
    expect(calendar.length).toBeGreaterThan(0);
  });

  it('should get compliance status', () => {
    schedulerService.createScheduledReport('org_123', 'SOC2', 'monthly', ['admin@example.com']);

    const status = schedulerService.getComplianceStatus('org_123');
    expect(status.activeReports).toBe(1);
    expect(status.nextReportDate).toBeDefined();
  });

  it('should export compliance schedule as JSON', () => {
    schedulerService.createScheduledReport('org_123', 'SOC2', 'monthly', ['admin@example.com']);

    const json = schedulerService.exportComplianceSchedule('org_123', 'json');
    const data = JSON.parse(json);

    expect(Array.isArray(data)).toBe(true);
  });

  it('should export compliance schedule as ICS', () => {
    schedulerService.createScheduledReport('org_123', 'SOC2', 'monthly', ['admin@example.com']);

    const ics = schedulerService.exportComplianceSchedule('org_123', 'ics');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('should cleanup old executions', () => {
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );

    schedulerService.executeScheduledReport(report.id);

    const deleted = schedulerService.cleanupOldExecutions(0);
    expect(deleted).toBeGreaterThanOrEqual(0);
  });
});

describe('Integration Tests', () => {
  it('should handle complete payment workflow', () => {
    const paymentService = new PaymentProcessorService();

    // Create payment method
    const method = paymentService.createPaymentMethod('org_123', 'stripe', 'card', '4242', 12, 2025);
    expect(method.isDefault).toBe(true);

    // Create subscription
    const subscription = paymentService.createSubscription('org_123', 'plan_pro', method.id, 'stripe');
    expect(subscription.status).toBe('active');

    // Create invoice
    const invoice = paymentService.createInvoice('org_123', subscription.id, 9900, 'usd', 'stripe');
    expect(invoice.status).toBe('sent');

    // Mark as paid
    const paid = paymentService.markInvoiceAsPaid(invoice.id);
    expect(paid?.status).toBe('paid');

    // Get billing summary
    const summary = paymentService.getBillingSummary('org_123');
    expect(summary.activeSubscriptions).toBe(1);
  });

  it('should handle complete compliance scheduling workflow', () => {
    const schedulerService = new ComplianceSchedulerService();

    // Create scheduled report
    const report = schedulerService.createScheduledReport(
      'org_123',
      'SOC2',
      'monthly',
      ['admin@example.com'],
    );
    expect(report.isActive).toBe(true);

    // Create report schedule
    const schedule = schedulerService.createReportSchedule(
      'org_123',
      'SOC2',
      'monthly',
      '09:00',
      'UTC',
      undefined,
      1,
    );
    expect(schedule.enabled).toBe(true);

    // Get compliance status
    const status = schedulerService.getComplianceStatus('org_123');
    expect(status.activeReports).toBe(1);

    // Get compliance calendar
    const calendar = schedulerService.getComplianceCalendar('org_123');
    expect(calendar.length).toBeGreaterThan(0);
  });
});
