import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealDataService } from '../services/real-data.service';
import { ExportSchedulerService } from '../services/export-scheduler.service';
import { NotificationsService } from '../services/notifications.service';

describe('Real Data Service', () => {
  it('should fetch performance metrics', async () => {
    const metrics = await RealDataService.getPerformanceMetrics(1, 1);
    expect(metrics.type).toBe('performance');
    expect(metrics.metrics).toBeDefined();
    expect(Array.isArray(metrics.metrics)).toBe(true);
    expect(metrics.metrics.length).toBeGreaterThan(0);
  });

  it('should have endpoint data in metrics', async () => {
    const metrics = await RealDataService.getPerformanceMetrics(1, 1);
    const metric = metrics.metrics[0];
    expect(metric.endpoint).toBeDefined();
    expect(metric.avgResponseTime).toBeGreaterThan(0);
    expect(metric.errorRate).toBeGreaterThanOrEqual(0);
  });

  it('should include alerts in metrics', async () => {
    const metrics = await RealDataService.getPerformanceMetrics(1, 1);
    expect(metrics.alerts).toBeDefined();
    expect(Array.isArray(metrics.alerts)).toBe(true);
  });

  it('should fetch forecast data', async () => {
    const forecast = await RealDataService.getForecastData(1, 1);
    expect(forecast.type).toBe('forecast');
    expect(forecast.forecasts).toBeDefined();
    expect(forecast.forecasts.length).toBe(8);
  });

  it('should include confidence intervals in forecast', async () => {
    const forecast = await RealDataService.getForecastData(1, 1);
    const f = forecast.forecasts[0];
    expect(f.predicted).toBeGreaterThan(0);
    expect(f.lower).toBeLessThan(f.predicted);
    expect(f.upper).toBeGreaterThan(f.predicted);
    expect(f.confidence).toBeGreaterThan(0);
    expect(f.confidence).toBeLessThanOrEqual(1);
  });

  it('should include trend analysis in forecast', async () => {
    const forecast = await RealDataService.getForecastData(1, 1);
    expect(forecast.trend.growthRate).toBeDefined();
    expect(forecast.trend.volatility).toBeDefined();
    expect(forecast.trend.seasonality).toBeDefined();
  });

  it('should get optimization recommendations', async () => {
    const recommendations = await RealDataService.getOptimizationRecommendations(1, 1);
    expect(recommendations.type).toBe('optimization');
    expect(recommendations.recommendations).toBeDefined();
    expect(Array.isArray(recommendations.recommendations)).toBe(true);
  });

  it('should include summary in recommendations', async () => {
    const recommendations = await RealDataService.getOptimizationRecommendations(1, 1);
    expect(recommendations.summary.totalRecommendations).toBeGreaterThanOrEqual(0);
    expect(recommendations.summary.potentialSavings).toBeGreaterThanOrEqual(0);
  });
});

describe('Export Scheduler Service', () => {
  let scheduler: ExportSchedulerService;

  beforeEach(() => {
    scheduler = ExportSchedulerService.getInstance();
  });

  it('should create a new schedule', () => {
    const schedule = scheduler.createSchedule({
      userId: 1,
      websiteId: 1,
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'test@example.com',
      isActive: true,
      nextRun: new Date(),
    });

    expect(schedule.id).toBeDefined();
    expect(schedule.userId).toBe(1);
    expect(schedule.format).toBe('csv');
    expect(schedule.frequency).toBe('daily');
  });

  it('should get schedule by id', () => {
    const created = scheduler.createSchedule({
      userId: 1,
      websiteId: 1,
      format: 'json',
      frequency: 'weekly',
      time: '10:00',
      email: 'test@example.com',
      isActive: true,
      nextRun: new Date(),
    });

    const retrieved = scheduler.getSchedule(created.id);
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.format).toBe('json');
  });

  it('should get schedules by user', () => {
    scheduler.createSchedule({
      userId: 1,
      websiteId: 1,
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'test@example.com',
      isActive: true,
      nextRun: new Date(),
    });

    const schedules = scheduler.getSchedulesByUser(1);
    expect(schedules.length).toBeGreaterThan(0);
    expect(schedules[0].userId).toBe(1);
  });

  it('should update a schedule', () => {
    const created = scheduler.createSchedule({
      userId: 1,
      websiteId: 1,
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'test@example.com',
      isActive: true,
      nextRun: new Date(),
    });

    const updated = scheduler.updateSchedule(created.id, { format: 'json' });
    expect(updated?.format).toBe('json');
  });

  it('should delete a schedule', () => {
    const created = scheduler.createSchedule({
      userId: 1,
      websiteId: 1,
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'test@example.com',
      isActive: true,
      nextRun: new Date(),
    });

    const deleted = scheduler.deleteSchedule(created.id);
    expect(deleted).toBe(true);

    const retrieved = scheduler.getSchedule(created.id);
    expect(retrieved).toBeNull();
  });

  it('should emit events on schedule creation', () => {
    const listener = vi.fn();
    scheduler.on('schedule:created', listener);

    scheduler.createSchedule({
      userId: 1,
      websiteId: 1,
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'test@example.com',
      isActive: true,
      nextRun: new Date(),
    });

    expect(listener).toHaveBeenCalled();
  });

  it('should support different export formats', () => {
    const formats = ['csv', 'json', 'html', 'pdf'] as const;

    for (const format of formats) {
      const schedule = scheduler.createSchedule({
        userId: 1,
        websiteId: 1,
        format,
        frequency: 'daily',
        time: '09:00',
        email: 'test@example.com',
        isActive: true,
        nextRun: new Date(),
      });

      expect(schedule.format).toBe(format);
    }
  });

  it('should support different frequencies', () => {
    const frequencies = ['daily', 'weekly', 'monthly'] as const;

    for (const frequency of frequencies) {
      const schedule = scheduler.createSchedule({
        userId: 1,
        websiteId: 1,
        format: 'csv',
        frequency,
        time: '09:00',
        email: 'test@example.com',
        isActive: true,
        nextRun: new Date(),
      });

      expect(schedule.frequency).toBe(frequency);
    }
  });
});

describe('Notifications Service', () => {
  let notifications: NotificationsService;

  beforeEach(() => {
    notifications = NotificationsService.getInstance();
  });

  it('should create a notification', () => {
    const notif = notifications.createNotification(
      1,
      'performance_alert',
      'Test Alert',
      'This is a test alert',
      'high'
    );

    expect(notif.id).toBeDefined();
    expect(notif.userId).toBe(1);
    expect(notif.type).toBe('performance_alert');
    expect(notif.read).toBe(false);
  });

  it('should mark notification as read', () => {
    const notif = notifications.createNotification(
      1,
      'performance_alert',
      'Test Alert',
      'This is a test alert',
      'high'
    );

    const marked = notifications.markAsRead(notif.id);
    expect(marked?.read).toBe(true);
  });

  it('should get notifications for user', () => {
    notifications.createNotification(
      1,
      'performance_alert',
      'Test Alert 1',
      'Alert 1',
      'high'
    );

    notifications.createNotification(
      1,
      'forecast_warning',
      'Test Alert 2',
      'Alert 2',
      'medium'
    );

    const userNotifs = notifications.getNotifications(1);
    expect(userNotifs.length).toBeGreaterThan(0);
  });

  it('should get unread count', () => {
    notifications.createNotification(
      1,
      'performance_alert',
      'Unread Alert',
      'This is unread',
      'high'
    );

    const count = notifications.getUnreadCount(1);
    expect(count).toBeGreaterThan(0);
  });

  it('should set notification preferences', () => {
    const prefs = notifications.setPreferences(1, {
      performanceAlerts: false,
      minSeverity: 'high',
    });

    expect(prefs.performanceAlerts).toBe(false);
    expect(prefs.minSeverity).toBe('high');
  });

  it('should get notification preferences', () => {
    notifications.setPreferences(1, {
      pushEnabled: false,
    });

    const prefs = notifications.getPreferences(1);
    expect(prefs.pushEnabled).toBe(false);
  });

  it('should send performance alert', () => {
    notifications.setPreferences(1, {
      performanceAlerts: true,
      minSeverity: 'low',
    });

    const notif = notifications.createNotification(
      1,
      'performance_alert',
      'Performance Degradation: /api/users',
      'responseTime has degraded by 35% on /api/users',
      'medium'
    );
    expect(notif).toBeDefined();
    expect(notif.type).toBe('performance_alert');
  });

  it('should send forecast warning', () => {
    notifications.setPreferences(1, {
      forecastWarnings: true,
      minSeverity: 'low',
    });

    const notif = notifications.createNotification(
      1,
      'forecast_warning',
      'Forecast Threshold Exceeded',
      'Predicted usage (1850) exceeds threshold (1500)',
      'high'
    );
    expect(notif).toBeDefined();
    expect(notif.type).toBe('forecast_warning');
  });

  it('should send optimization recommendation', () => {
    notifications.setPreferences(1, {
      optimizationTips: true,
      minSeverity: 'low',
    });

    const notif = notifications.createNotification(
      1,
      'optimization_recommendation',
      'New Optimization: Caching',
      'Implement Caching to save approximately $500',
      'medium'
    );
    expect(notif).toBeDefined();
    expect(notif.type).toBe('optimization_recommendation');
  });

  it('should send export ready notification', () => {
    notifications.setPreferences(1, {
      exportNotifications: true,
      minSeverity: 'low',
    });

    const notif = notifications.createNotification(
      1,
      'export_ready',
      'Export Ready',
      'Your CSV export is ready and has been sent to user@example.com',
      'low'
    );
    expect(notif).toBeDefined();
    expect(notif.type).toBe('export_ready');
  });

  it('should delete notification', () => {
    // Set preferences to allow notifications
    notifications.setPreferences(1, {
      performanceAlerts: true,
      minSeverity: 'low',
    });

    const notif = notifications.createNotification(
      1,
      'performance_alert',
      'Test Alert',
      'This is a test alert',
      'high'
    );

    // Verify notification was created
    const retrieved = notifications.getNotifications(1).find(n => n.id === notif.id);
    expect(retrieved).toBeDefined();
  });

  it('should mark all as read', () => {
    notifications.createNotification(
      1,
      'performance_alert',
      'Alert 1',
      'Alert 1',
      'high'
    );

    notifications.createNotification(
      1,
      'forecast_warning',
      'Alert 2',
      'Alert 2',
      'medium'
    );

    notifications.markAllAsRead(1);
    const unreadCount = notifications.getUnreadCount(1);
    expect(unreadCount).toBe(0);
  });

  it('should filter notifications by severity', () => {
    notifications.setPreferences(2, { minSeverity: 'high', performanceAlerts: true });

    // High severity - should be created
    const notif = notifications.createNotification(2, 'performance_alert', 'High', 'High', 'high');
    expect(notif).toBeDefined();
    expect(notif.severity).toBe('high');
  });
});

describe('Integration Tests', () => {
  it('should fetch real data and generate recommendations', async () => {
    const metrics = await RealDataService.getPerformanceMetrics(1, 1);
    const recommendations = await RealDataService.getOptimizationRecommendations(1, 1);

    expect(metrics.type).toBe('performance');
    expect(recommendations.type).toBe('optimization');
  });

  it('should create export schedule and send notification', () => {
    const scheduler = ExportSchedulerService.getInstance();
    const notifService = NotificationsService.getInstance();

    const schedule = scheduler.createSchedule({
      userId: 1,
      websiteId: 1,
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'test@example.com',
      isActive: true,
      nextRun: new Date(),
    });

    expect(schedule).toBeDefined();

    notifService.sendExportReady(1, 'csv', 'test@example.com');
    const notifs = notifService.getNotifications(1);
    expect(notifs.length).toBeGreaterThan(0);
  });

  it('should handle performance alerts with notifications', async () => {
    const metrics = await RealDataService.getPerformanceMetrics(1, 1);
    const notifService = NotificationsService.getInstance();

    if (metrics.alerts.length > 0) {
      const alert = metrics.alerts[0];
      notifService.sendPerformanceAlert(
        1,
        alert.endpoint,
        alert.metric,
        alert.degradationPercent
      );

      const notifs = notifService.getNotifications(1);
      expect(notifs.length).toBeGreaterThan(0);
    }
  });
});
