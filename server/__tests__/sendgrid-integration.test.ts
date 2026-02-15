import { describe, it, expect, beforeAll } from 'vitest';
import { EmailService } from '../services/email.service';

describe('SendGrid Integration', { timeout: 30000 }, () => {
  let emailService: EmailService;

  beforeAll(() => {
    emailService = EmailService.getInstance();
  });

  it('should validate SendGrid API key is configured', () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^SG\./);
    console.log('[SendGrid] API key is configured and valid format');
  });

  it('should have email service configured', () => {
    expect(emailService.isEmailConfigured()).toBe(true);
    console.log('[SendGrid] Email service is configured');
  });

  it('should send test email with SendGrid', { timeout: 15000 }, async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'SendGrid Integration Test',
      html: '<p>This is a test email from Traffic Booster Pro</p>',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    console.log('[SendGrid] Test email sent successfully:', result.messageId);
  });

  it('should send performance alert email', { timeout: 15000 }, async () => {
    const result = await emailService.sendPerformanceAlert({
      email: 'user@example.com',
      metric: '/api/users',
      value: 5000,
      threshold: 3000,
      timestamp: new Date().toISOString(),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    console.log('[SendGrid] Performance alert sent:', result.messageId);
  });

  it('should send forecast warning email', { timeout: 15000 }, async () => {
    const result = await emailService.sendForecastWarning({
      email: 'user@example.com',
      metric: 'traffic_volume',
      forecastedValue: 150000,
      threshold: 100000,
      confidence: 0.92,
      timestamp: new Date().toISOString(),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    console.log('[SendGrid] Forecast warning sent:', result.messageId);
  });

  it('should send optimization recommendation email', { timeout: 15000 }, async () => {
    const result = await emailService.sendOptimizationRecommendation({
      email: 'user@example.com',
      recommendation: 'Enable caching',
      potentialSavings: '30%',
      priority: 'high',
      timestamp: new Date().toISOString(),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    console.log('[SendGrid] Optimization recommendation sent:', result.messageId);
  });
});
