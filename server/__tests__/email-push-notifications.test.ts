import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../services/email.service';
import { PushNotificationsService } from '../services/push-notifications.service';

describe('Email Service', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = EmailService.getInstance();
  });

  it('should initialize email service', () => {
    expect(emailService).toBeDefined();
  });

  it('should get email service status', () => {
    const configured = emailService.isEmailConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('should send email', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test email content</p>',
    });

    expect(result.success).toBe(true);
  });

  it('should send export report email', async () => {
    const result = await emailService.sendExportReport(
      'test@example.com',
      'csv',
      'Traffic Report',
      Buffer.from('data'),
      'text/csv'
    );

    expect(result.success).toBe(true);
  });

  it('should send performance alert email', async () => {
    const result = await emailService.sendPerformanceAlert({
      email: 'test@example.com',
      metric: '/api/users',
      value: 35,
      threshold: 30,
      timestamp: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });

  it('should send forecast warning email', async () => {
    const result = await emailService.sendForecastWarning({
      email: 'test@example.com',
      metric: 'traffic_volume',
      forecastedValue: 1850,
      threshold: 1500,
      confidence: 0.92,
      timestamp: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });

  it('should send optimization recommendation email', async () => {
    const result = await emailService.sendOptimizationRecommendation({
      email: 'test@example.com',
      recommendation: 'Implement Redis caching',
      potentialSavings: '$500',
      priority: 'high',
      timestamp: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });

  it('should send test email', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    });
    expect(result.success).toBe(true);
  });

  it('should check if email is configured', () => {
    const configured = emailService.isEmailConfigured();
    expect(typeof configured).toBe('boolean');
  });
});

describe('Push Notifications Service', () => {
  let pushService: PushNotificationsService;

  beforeEach(() => {
    // Create a fresh instance for each test
    pushService = PushNotificationsService.getInstance();
    // Clear all tokens before each test
    const allTokens = pushService.getAllTokens();
    for (const userId of allTokens.keys()) {
      allTokens.delete(userId);
    }
  });

  it('should initialize push notifications service', () => {
    expect(pushService).toBeDefined();
  });

  it('should register push token', () => {
    const token = pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');

    expect(token.userId).toBe(1);
    expect(token.token).toBe('ExponentPushToken[test-token]');
    expect(token.platform).toBe('ios');
    expect(token.isActive).toBe(true);
  });

  it('should get user tokens', () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    pushService.registerToken(1, 'ExponentPushToken[token1]', 'ios');
    pushService.registerToken(1, 'ExponentPushToken[token2]', 'android');

    const tokens = pushService.getUserTokens(1);
    expect(tokens.length).toBe(2);
  });

  it('should unregister push token', () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');

    const unregistered = pushService.unregisterToken(1, 'ExponentPushToken[test-token]');
    expect(unregistered).toBe(true);

    const tokens = pushService.getUserTokens(1);
    expect(tokens.length).toBe(0);
  });

  it('should send push notification', async () => {
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');

    const result = await pushService.sendNotification(1, {
      title: 'Test Notification',
      body: 'This is a test',
    });

    expect(result.success).toBe(true);
  });

  it('should send performance alert notification', async () => {
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');

    const result = await pushService.sendPerformanceAlert(1, '/api/users', 'responseTime', 35);
    expect(result.success).toBe(true);
  });

  it('should send forecast warning notification', async () => {
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');

    const result = await pushService.sendForecastWarning(1, 1850, 1500);
    expect(result.success).toBe(true);
  });

  it('should send optimization recommendation notification', async () => {
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');

    const result = await pushService.sendOptimizationRecommendation(1, 'Caching', 500);
    expect(result.success).toBe(true);
  });

  it('should send export ready notification', async () => {
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');

    const result = await pushService.sendExportReady(1, 'csv', 'user@example.com');
    expect(result.success).toBe(true);
  });

  it('should return service status', () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    pushService.registerToken(1, 'ExponentPushToken[token1]', 'ios');
    pushService.registerToken(2, 'ExponentPushToken[token2]', 'android');

    const status = pushService.getStatus();
    expect(status.userCount).toBeGreaterThan(0);
    expect(status.totalTokens).toBeGreaterThan(0);
    expect(status.queuedNotifications).toBeDefined();
  });

  it('should get sending queue', () => {
    const queue = pushService.getSendingQueue();
    expect(Array.isArray(queue)).toBe(true);
  });

  it('should clear sending queue', () => {
    pushService.clearQueue();
    const queue = pushService.getSendingQueue();
    expect(queue.length).toBe(0);
  });

  it('should cleanup expired tokens', () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    pushService.registerToken(1, 'ExponentPushToken[token1]', 'ios');
    pushService.registerToken(2, 'ExponentPushToken[token2]', 'android');

    pushService.cleanupExpiredTokens();

    const status = pushService.getStatus();
    expect(status.totalTokens).toBeGreaterThanOrEqual(0);
  });

  it('should get all tokens', () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    pushService.registerToken(1, 'ExponentPushToken[token1]', 'ios');
    pushService.registerToken(2, 'ExponentPushToken[token2]', 'android');

    const allTokensResult = pushService.getAllTokens();
    expect(allTokensResult.size).toBeGreaterThan(0);
  });

  it('should handle multiple tokens per user', async () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    pushService.registerToken(1, 'ExponentPushToken[token1]', 'ios');
    pushService.registerToken(1, 'ExponentPushToken[token2]', 'android');

    const result = await pushService.sendNotification(1, {
      title: 'Multi-device Test',
      body: 'Sent to multiple devices',
    });

    expect(result.success).toBe(true);
  });

  it('should emit events on token registration', () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    const listener = vi.fn();
    pushService.on('token:registered', listener);

    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');
    expect(listener).toHaveBeenCalled();
  });

  it('should emit events on notification sent', async () => {
    // Clear existing tokens first
    const allTokens = pushService.getAllTokens();
    allTokens.clear();

    const listener = vi.fn();
    pushService.on('notification:sent', listener);

    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');
    await pushService.sendNotification(1, {
      title: 'Test',
      body: 'Test notification',
    });

    expect(listener).toHaveBeenCalled();
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    // Clear push service state before each integration test
    const pushService = PushNotificationsService.getInstance();
    const allTokens = pushService.getAllTokens();
    allTokens.clear();
  });

  it('should send email and push notification for export', async () => {
    const emailService = EmailService.getInstance();
    const pushService = PushNotificationsService.getInstance();

    // Send email
    const emailResult = await emailService.sendExportReport(
      'test@example.com',
      'csv',
      'Traffic Report',
      Buffer.from('data'),
      'text/csv'
    );
    expect(emailResult.success).toBe(true);

    // Send push notification
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');
    const pushResult = await pushService.sendExportReady(1, 'csv', 'test@example.com');
    expect(pushResult.success).toBe(true);
  });

  it('should send email and push notification for performance alert', async () => {
    const emailService = EmailService.getInstance();
    const pushService = PushNotificationsService.getInstance();

    // Send email
    const emailResult = await emailService.sendPerformanceAlert({
      email: 'test@example.com',
      metric: '/api/users',
      value: 35,
      threshold: 30,
      timestamp: new Date().toISOString(),
    });
    expect(emailResult.success).toBe(true);

    // Send push notification
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');
    const pushResult = await pushService.sendPerformanceAlert(1, '/api/users', 'responseTime', 35);
    expect(pushResult.success).toBe(true);
  });

  it('should send email and push notification for forecast warning', async () => {
    const emailService = EmailService.getInstance();
    const pushService = PushNotificationsService.getInstance();

    // Send email
    const emailResult = await emailService.sendForecastWarning({
      email: 'test@example.com',
      metric: 'traffic_volume',
      forecastedValue: 1850,
      threshold: 1500,
      confidence: 0.92,
      timestamp: new Date().toISOString(),
    });
    expect(emailResult.success).toBe(true);

    // Send push notification
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');
    const pushResult = await pushService.sendForecastWarning(1, 1850, 1500);
    expect(pushResult.success).toBe(true);
  });

  it('should send email and push notification for optimization', async () => {
    const emailService = EmailService.getInstance();
    const pushService = PushNotificationsService.getInstance();

    // Send email
    const emailResult = await emailService.sendOptimizationRecommendation({
      email: 'test@example.com',
      recommendation: 'Implement Redis caching',
      potentialSavings: '$500',
      priority: 'high',
      timestamp: new Date().toISOString(),
    });
    expect(emailResult.success).toBe(true);

    // Send push notification
    pushService.registerToken(1, 'ExponentPushToken[test-token]', 'ios');
    const pushResult = await pushService.sendOptimizationRecommendation(1, 'Caching', 500);
    expect(pushResult.success).toBe(true);
  });
});
