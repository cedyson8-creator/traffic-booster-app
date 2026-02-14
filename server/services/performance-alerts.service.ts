import { getDb } from '@/server/db';
import { performanceAlerts, emailDeliveryLogs, scheduledReports } from '@/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

interface AlertConfig {
  successRateThreshold: number; // 95%
  bounceRateThreshold: number; // 5%
  failureCountThreshold: number; // 5 failed emails
}

/**
 * Performance Alerts Service
 * Monitors delivery performance and creates alerts when thresholds are exceeded
 */
export class PerformanceAlertsService {
  private static readonly DEFAULT_CONFIG: AlertConfig = {
    successRateThreshold: 95,
    bounceRateThreshold: 5,
    failureCountThreshold: 5,
  };

  /**
   * Check performance metrics and create alerts if needed
   */
  static async checkPerformance(userId: number, config: Partial<AlertConfig> = {}): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.error('[PerformanceAlerts] Database connection failed');
        return;
      }

      const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

      // Get delivery stats for user
      const stats = await db
        .select({
          status: emailDeliveryLogs.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(emailDeliveryLogs)
        .where(eq(emailDeliveryLogs.userId, userId))
        .groupBy(emailDeliveryLogs.status);

      const total = stats.reduce((sum, s: any) => sum + s.count, 0);
      const sent = stats.find((s: any) => s.status === 'sent')?.count || 0;
      const failed = stats.find((s: any) => s.status === 'failed')?.count || 0;
      const bounced = stats.find((s: any) => s.status === 'bounced')?.count || 0;

      const successRate = total > 0 ? Math.round((sent / total) * 100) : 100;
      const bounceRate = total > 0 ? Math.round((bounced / total) * 100) : 0;

      console.log(
        `[PerformanceAlerts] User ${userId}: Success=${successRate}%, Bounce=${bounceRate}%, Failed=${failed}`
      );

      // Check for low success rate
      if (successRate < finalConfig.successRateThreshold) {
        await this.createAlert(db, userId, {
          alertType: 'low_success_rate',
          threshold: finalConfig.successRateThreshold,
          currentValue: successRate,
          severity: successRate < 80 ? 'critical' : 'warning',
          message: `Email delivery success rate dropped to ${successRate}% (threshold: ${finalConfig.successRateThreshold}%)`,
        });
      }

      // Check for high bounce rate
      if (bounceRate > finalConfig.bounceRateThreshold) {
        await this.createAlert(db, userId, {
          alertType: 'high_bounce_rate',
          threshold: finalConfig.bounceRateThreshold,
          currentValue: bounceRate,
          severity: bounceRate > 10 ? 'critical' : 'warning',
          message: `Email bounce rate increased to ${bounceRate}% (threshold: ${finalConfig.bounceRateThreshold}%)`,
        });
      }

      // Check for delivery failures
      if (failed >= finalConfig.failureCountThreshold) {
        await this.createAlert(db, userId, {
          alertType: 'delivery_failure',
          threshold: finalConfig.failureCountThreshold,
          currentValue: failed,
          severity: failed > 10 ? 'critical' : 'warning',
          message: `${failed} emails failed to deliver (threshold: ${finalConfig.failureCountThreshold})`,
        });
      }
    } catch (error) {
      console.error('[PerformanceAlerts] Error checking performance:', error);
    }
  }

  /**
   * Create an alert if one doesn't already exist for this condition
   */
  private static async createAlert(
    db: any,
    userId: number,
    alertData: {
      alertType: 'low_success_rate' | 'high_bounce_rate' | 'delivery_failure';
      threshold: number;
      currentValue: number;
      severity: 'info' | 'warning' | 'critical';
      message: string;
    }
  ): Promise<void> {
    try {
      // Check if unresolved alert already exists for this type
      const existingAlert = await db
        .select()
        .from(performanceAlerts)
        .where(
          and(
            eq(performanceAlerts.userId, userId),
            eq(performanceAlerts.alertType, alertData.alertType),
            eq(performanceAlerts.isResolved, false)
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        // Create new alert
        await db.insert(performanceAlerts).values({
          userId,
          alertType: alertData.alertType,
          threshold: alertData.threshold,
          currentValue: alertData.currentValue,
          severity: alertData.severity,
          message: alertData.message,
          isResolved: false,
        });

        console.log(`[PerformanceAlerts] Created ${alertData.alertType} alert for user ${userId}`);
      }
    } catch (error) {
      console.error('[PerformanceAlerts] Error creating alert:', error);
    }
  }

  /**
   * Get active alerts for a user
   */
  static async getActiveAlerts(userId: number): Promise<any[]> {
    try {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const alerts = await db
        .select()
        .from(performanceAlerts)
        .where(
          and(
            eq(performanceAlerts.userId, userId),
            eq(performanceAlerts.isResolved, false)
          )
        )
        .orderBy(sql`${performanceAlerts.createdAt} DESC`);

      return alerts;
    } catch (error) {
      console.error('[PerformanceAlerts] Error fetching active alerts:', error);
      return [];
    }
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(alertId: number): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        return;
      }

      await db
        .update(performanceAlerts)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
        })
        .where(eq(performanceAlerts.id, alertId));

      console.log(`[PerformanceAlerts] Resolved alert ${alertId}`);
    } catch (error) {
      console.error('[PerformanceAlerts] Error resolving alert:', error);
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(userId: number): Promise<{
    activeAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    resolvedToday: number;
  }> {
    try {
      const db = await getDb();
      if (!db) {
        return { activeAlerts: 0, criticalAlerts: 0, warningAlerts: 0, resolvedToday: 0 };
      }

      const active = await db
        .select()
        .from(performanceAlerts)
        .where(
          and(
            eq(performanceAlerts.userId, userId),
            eq(performanceAlerts.isResolved, false)
          )
        );

      const critical = active.filter((a: any) => a.severity === 'critical').length;
      const warning = active.filter((a: any) => a.severity === 'warning').length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const resolvedToday = await db
        .select()
        .from(performanceAlerts)
        .where(
          and(
            eq(performanceAlerts.userId, userId),
            eq(performanceAlerts.isResolved, true),
            sql`DATE(${performanceAlerts.resolvedAt}) = DATE(NOW())`
          )
        );

      return {
        activeAlerts: active.length,
        criticalAlerts: critical,
        warningAlerts: warning,
        resolvedToday: resolvedToday.length,
      };
    } catch (error) {
      console.error('[PerformanceAlerts] Error getting alert stats:', error);
      return { activeAlerts: 0, criticalAlerts: 0, warningAlerts: 0, resolvedToday: 0 };
    }
  }
}
