import { EventEmitter } from 'events';

export interface Notification {
  id: string;
  userId: number;
  type: 'performance_alert' | 'forecast_warning' | 'optimization_recommendation' | 'export_ready';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: number;
  performanceAlerts: boolean;
  forecastWarnings: boolean;
  optimizationTips: boolean;
  exportNotifications: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * NotificationsService
 * Manages real-time notifications for performance alerts, forecasts, and recommendations
 */
export class NotificationsService extends EventEmitter {
  private static instance: NotificationsService;
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<number, NotificationPreferences> = new Map();
  private userSubscriptions: Map<number, Set<string>> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  /**
   * Create a new notification
   */
  createNotification(
    userId: number,
    type: Notification['type'],
    title: string,
    message: string,
    severity: Notification['severity'],
    data?: Record<string, any>
  ): Notification {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = {
      id,
      userId,
      type,
      title,
      message,
      severity,
      data,
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire after 7 days
    };

    // Check preferences before creating
    const prefs = this.getPreferences(userId);
    if (!this.shouldNotify(type, severity, prefs)) {
      console.log(`[Notifications] Notification filtered: ${type} (severity: ${severity})`);
      return notification;
    }

    this.notifications.set(id, notification);
    this.emit('notification:created', notification);
    this.broadcastToUser(userId, 'notification', notification);

    console.log(`[Notifications] Notification created: ${id} for user ${userId}`);

    return notification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Notification | null {
    const notification = this.notifications.get(notificationId);
    if (!notification) return null;

    notification.read = true;
    this.notifications.set(notificationId, notification);
    this.emit('notification:read', notification);

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: number): void {
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        this.notifications.set(notification.id, notification);
      }
    }
    this.emit('notifications:all-read', userId);
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): boolean {
    const deleted = this.notifications.delete(notificationId);
    if (deleted) {
      this.emit('notification:deleted', notificationId);
    }
    return deleted;
  }

  /**
   * Get notifications for a user
   */
  getNotifications(userId: number, limit: number = 50): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && (!n.expiresAt || n.expiresAt > new Date()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userId: number): number {
    return Array.from(this.notifications.values()).filter(
      n => n.userId === userId && !n.read && (!n.expiresAt || n.expiresAt > new Date())
    ).length;
  }

  /**
   * Set notification preferences
   */
  setPreferences(userId: number, preferences: Partial<NotificationPreferences>): NotificationPreferences {
    const existing = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...existing, ...preferences, userId };
    this.preferences.set(userId, updated);
    this.emit('preferences:updated', updated);

    console.log(`[Notifications] Preferences updated for user ${userId}`);

    return updated;
  }

  /**
   * Get notification preferences
   */
  getPreferences(userId: number): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(userId: number): NotificationPreferences {
    return {
      userId,
      performanceAlerts: true,
      forecastWarnings: true,
      optimizationTips: true,
      exportNotifications: true,
      pushEnabled: true,
      emailEnabled: false,
      minSeverity: 'low',
    };
  }

  /**
   * Check if notification should be sent
   */
  private shouldNotify(
    type: Notification['type'],
    severity: Notification['severity'],
    prefs: NotificationPreferences
  ): boolean {
    // Check severity threshold
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    if (severityLevels[severity] < severityLevels[prefs.minSeverity]) {
      return false;
    }

    // Check type preferences
    switch (type) {
      case 'performance_alert':
        return prefs.performanceAlerts;
      case 'forecast_warning':
        return prefs.forecastWarnings;
      case 'optimization_recommendation':
        return prefs.optimizationTips;
      case 'export_ready':
        return prefs.exportNotifications;
      default:
        return true;
    }
  }

  /**
   * Subscribe user to notifications
   */
  subscribeUser(userId: number, connectionId: string): void {
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId)!.add(connectionId);
    console.log(`[Notifications] User ${userId} subscribed (connection: ${connectionId})`);
  }

  /**
   * Unsubscribe user from notifications
   */
  unsubscribeUser(userId: number, connectionId: string): void {
    const subscriptions = this.userSubscriptions.get(userId);
    if (subscriptions) {
      subscriptions.delete(connectionId);
      if (subscriptions.size === 0) {
        this.userSubscriptions.delete(userId);
      }
    }
    console.log(`[Notifications] User ${userId} unsubscribed (connection: ${connectionId})`);
  }

  /**
   * Broadcast notification to user
   */
  private broadcastToUser(userId: number, event: string, data: any): void {
    const subscriptions = this.userSubscriptions.get(userId);
    if (subscriptions && subscriptions.size > 0) {
      this.emit(`user:${userId}:${event}`, data);
    }
  }

  /**
   * Send performance alert
   */
  sendPerformanceAlert(userId: number, endpoint: string, metric: string, degradationPercent: number): void {
    const severity = degradationPercent > 50 ? 'critical' : degradationPercent > 30 ? 'high' : 'medium';
    this.createNotification(
      userId,
      'performance_alert',
      `Performance Degradation: ${endpoint}`,
      `${metric} has degraded by ${degradationPercent}% on ${endpoint}`,
      severity,
      { endpoint, metric, degradationPercent }
    );
  }

  /**
   * Send forecast warning
   */
  sendForecastWarning(userId: number, predicted: number, threshold: number): void {
    const severity = predicted > threshold * 1.5 ? 'critical' : predicted > threshold ? 'high' : 'medium';
    this.createNotification(
      userId,
      'forecast_warning',
      'Forecast Threshold Exceeded',
      `Predicted usage (${predicted}) exceeds threshold (${threshold})`,
      severity,
      { predicted, threshold }
    );
  }

  /**
   * Send optimization recommendation
   */
  sendOptimizationRecommendation(userId: number, type: string, savings: number): void {
    this.createNotification(
      userId,
      'optimization_recommendation',
      `New Optimization: ${type}`,
      `Implement ${type} to save approximately $${savings}`,
      'medium',
      { type, savings }
    );
  }

  /**
   * Send export ready notification
   */
  sendExportReady(userId: number, format: string, email: string): void {
    this.createNotification(
      userId,
      'export_ready',
      'Export Ready',
      `Your ${format.toUpperCase()} export is ready and has been sent to ${email}`,
      'low',
      { format, email }
    );
  }

  /**
   * Clean up expired notifications
   */
  cleanupExpired(): void {
    const now = new Date();
    let count = 0;

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt <= now) {
        this.notifications.delete(id);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[Notifications] Cleaned up ${count} expired notifications`);
    }
  }

  /**
   * Get all notifications (for admin/debugging)
   */
  getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Get all preferences (for admin/debugging)
   */
  getAllPreferences(): NotificationPreferences[] {
    return Array.from(this.preferences.values());
  }
}
