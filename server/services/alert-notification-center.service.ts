/**
 * Alert Notification Center Service
 * Manages alert notifications with acknowledgment, snooze, and resolution tracking
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type NotificationStatus = 'new' | 'acknowledged' | 'snoozed' | 'resolved';

export interface AlertNotification {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: NotificationStatus;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  snoozedUntil?: Date;
  source: string; // e.g., 'error_rate', 'webhook_failure', 'quota_exceeded'
  metadata?: Record<string, unknown>;
  actionUrl?: string;
}

export interface NotificationCenter {
  userId: string;
  organizationId: string;
  notifications: AlertNotification[];
  unreadCount: number;
  lastReadAt?: Date;
}

export class AlertNotificationCenterService {
  private centers: Map<string, NotificationCenter> = new Map();
  private notifications: Map<string, AlertNotification> = new Map();

  /**
   * Create notification center for user
   */
  createCenter(userId: string, organizationId: string): NotificationCenter {
    const centerId = `${organizationId}-${userId}`;
    const center: NotificationCenter = {
      userId,
      organizationId,
      notifications: [],
      unreadCount: 0,
    };
    this.centers.set(centerId, center);
    return center;
  }

  /**
   * Add notification to center
   */
  addNotification(notification: AlertNotification): AlertNotification {
    const centerId = `${notification.organizationId}-${notification.userId}`;
    let center = this.centers.get(centerId);

    if (!center) {
      center = this.createCenter(notification.userId, notification.organizationId);
    }

    this.notifications.set(notification.id, notification);
    center.notifications.push(notification);
    center.unreadCount++;

    return notification;
  }

  /**
   * Get notifications for user
   */
  getNotifications(userId: string, organizationId: string, status?: NotificationStatus): AlertNotification[] {
    const centerId = `${organizationId}-${userId}`;
    const center = this.centers.get(centerId);

    if (!center) {
      return [];
    }

    let notifications = center.notifications;

    if (status) {
      notifications = notifications.filter(n => n.status === status);
    }

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledge notification
   */
  acknowledgeNotification(notificationId: string): AlertNotification | undefined {
    const notification = this.notifications.get(notificationId);

    if (!notification) {
      return undefined;
    }

    const wasNew = notification.status === 'new';
    notification.status = 'acknowledged';
    notification.acknowledgedAt = new Date();

    const centerId = `${notification.organizationId}-${notification.userId}`;
    const center = this.centers.get(centerId);
    if (center && wasNew) {
      center.unreadCount = Math.max(0, center.unreadCount - 1);
    }

    return notification;
  }

  /**
   * Snooze notification
   */
  snoozeNotification(notificationId: string, minutes: number): AlertNotification | undefined {
    const notification = this.notifications.get(notificationId);

    if (!notification) {
      return undefined;
    }

    const wasNew = notification.status === 'new';
    notification.status = 'snoozed';
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);
    notification.snoozedUntil = snoozeUntil;

    const centerId = `${notification.organizationId}-${notification.userId}`;
    const center = this.centers.get(centerId);
    if (center && wasNew) {
      center.unreadCount = Math.max(0, center.unreadCount - 1);
    }

    return notification;
  }

  /**
   * Resolve notification
   */
  resolveNotification(notificationId: string): AlertNotification | undefined {
    const notification = this.notifications.get(notificationId);

    if (!notification) {
      return undefined;
    }

    const wasNew = notification.status === 'new';
    notification.status = 'resolved';
    notification.resolvedAt = new Date();

    const centerId = `${notification.organizationId}-${notification.userId}`;
    const center = this.centers.get(centerId);
    if (center && wasNew) {
      center.unreadCount = Math.max(0, center.unreadCount - 1);
    }

    return notification;
  }

  /**
   * Get unread count for user
   */
  getUnreadCount(userId: string, organizationId: string): number {
    const centerId = `${organizationId}-${userId}`;
    const center = this.centers.get(centerId);
    return center ? center.unreadCount : 0;
  }

  /**
   * Mark all as read
   */
  markAllAsRead(userId: string, organizationId: string): number {
    const centerId = `${organizationId}-${userId}`;
    const center = this.centers.get(centerId);

    if (!center) {
      return 0;
    }

    const unreadNotifications = center.notifications.filter(n => n.status === 'new');
    unreadNotifications.forEach(n => {
      n.status = 'acknowledged';
      n.acknowledgedAt = new Date();
    });

    const count = unreadNotifications.length;
    center.unreadCount = 0;
    center.lastReadAt = new Date();

    return count;
  }

  /**
   * Get notification by ID
   */
  getNotificationById(id: string): AlertNotification | undefined {
    return this.notifications.get(id);
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);

    if (!notification) {
      return false;
    }

    const centerId = `${notification.organizationId}-${notification.userId}`;
    const center = this.centers.get(centerId);

    if (center) {
      center.notifications = center.notifications.filter(n => n.id !== notificationId);
      if (notification.status === 'new') {
        center.unreadCount = Math.max(0, center.unreadCount - 1);
      }
    }

    this.notifications.delete(notificationId);
    return true;
  }

  /**
   * Get notifications by severity
   */
  getNotificationsBySeverity(userId: string, organizationId: string, severity: AlertSeverity): AlertNotification[] {
    return this.getNotifications(userId, organizationId).filter(n => n.severity === severity);
  }

  /**
   * Get notifications by source
   */
  getNotificationsBySource(userId: string, organizationId: string, source: string): AlertNotification[] {
    return this.getNotifications(userId, organizationId).filter(n => n.source === source);
  }

  /**
   * Get critical notifications
   */
  getCriticalNotifications(userId: string, organizationId: string): AlertNotification[] {
    return this.getNotificationsBySeverity(userId, organizationId, 'critical');
  }

  /**
   * Get snoozed notifications that should be unsnoozed
   */
  getExpiredSnoozes(userId: string, organizationId: string): AlertNotification[] {
    const now = new Date();
    return this.getNotifications(userId, organizationId, 'snoozed').filter(
      n => n.snoozedUntil && n.snoozedUntil <= now
    );
  }

  /**
   * Unsnooze expired notifications
   */
  unsnoozeExpiredNotifications(userId: string, organizationId: string): number {
    const expired = this.getExpiredSnoozes(userId, organizationId);
    expired.forEach(n => {
      n.status = 'new';
      n.snoozedUntil = undefined;
      const centerId = `${organizationId}-${userId}`;
      const center = this.centers.get(centerId);
      if (center) {
        center.unreadCount++;
      }
    });
    return expired.length;
  }

  /**
   * Get notification statistics
   */
  getStatistics(userId: string, organizationId: string): Record<string, unknown> {
    const notifications = this.getNotifications(userId, organizationId);

    return {
      total: notifications.length,
      unread: this.getUnreadCount(userId, organizationId),
      acknowledged: notifications.filter(n => n.status === 'acknowledged').length,
      snoozed: notifications.filter(n => n.status === 'snoozed').length,
      resolved: notifications.filter(n => n.status === 'resolved').length,
      critical: notifications.filter(n => n.severity === 'critical').length,
      warning: notifications.filter(n => n.severity === 'warning').length,
      info: notifications.filter(n => n.severity === 'info').length,
    };
  }

  /**
   * Clear resolved notifications older than days
   */
  clearResolvedNotifications(userId: string, organizationId: string, days: number): number {
    const centerId = `${organizationId}-${userId}`;
    const center = this.centers.get(centerId);

    if (!center) {
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const initialLength = center.notifications.length;
    center.notifications = center.notifications.filter(n =>
      n.status !== 'resolved' || (n.resolvedAt && n.resolvedAt > cutoffDate)
    );

    const removed = initialLength - center.notifications.length;
    center.notifications.forEach(n => {
      if (removed > 0 && this.notifications.get(n.id)) {
        this.notifications.delete(n.id);
      }
    });

    return removed;
  }

  /**
   * Get total notifications count
   */
  getTotalCount(): number {
    return this.notifications.size;
  }
}

export const alertNotificationCenterService = new AlertNotificationCenterService();
