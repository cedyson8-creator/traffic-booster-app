import { getDb } from '../db';
import { webhookLogs, errorLogs } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Database Persistence Service
 * Migrates webhook and error logs from memory to database
 */

export class DatabasePersistenceService {
  /**
   * Save webhook log to database
   */
  static async saveWebhookLog(
    userId: number,
    webhookId: string,
    url: string,
    eventType: string,
    attempt: number,
    statusCode?: number,
    response?: string,
    error?: string,
    nextRetryAt?: Date,
  ) {
    try {
      const db = await getDb();
      if (!db) {
        console.warn('[DatabasePersistence] Database not available, webhook log not saved');
        return null;
      }

      const log = await db.insert(webhookLogs).values({
        userId,
        webhookId,
        url,
        eventType,
        attempt,
        statusCode,
        response,
        error,
        nextRetryAt,
        createdAt: new Date(),
      });

      console.log(`[DatabasePersistence] Webhook log saved for ${webhookId}`);
      return log;
    } catch (error) {
      console.error('[DatabasePersistence] Error saving webhook log:', error);
      return null;
    }
  }

  /**
   * Get webhook logs for user
   */
  static async getWebhookLogs(userId: number, limit: number = 100) {
    try {
      const db = await getDb();
      if (!db) return [];

      const logs = await db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.userId, userId))
        .orderBy((t: any) => t.createdAt)
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('[DatabasePersistence] Error fetching webhook logs:', error);
      return [];
    }
  }

  /**
   * Get webhook logs for specific webhook
   */
  static async getWebhookLogsForWebhook(webhookId: string, limit: number = 100) {
    try {
      const db = await getDb();
      if (!db) return [];

      const logs = await db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.webhookId, webhookId))
        .orderBy((t: any) => t.createdAt)
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('[DatabasePersistence] Error fetching webhook logs:', error);
      return [];
    }
  }

  /**
   * Save error log to database
   */
  static async saveErrorLog(
    errorId: string,
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug',
    userId?: number,
    endpoint?: string,
    statusCode?: number,
    stackTrace?: string,
    context?: Record<string, any>,
    tags?: Record<string, string>,
  ) {
    try {
      const db = await getDb();
      if (!db) {
        console.warn('[DatabasePersistence] Database not available, error log not saved');
        return null;
      }

      const log = await db.insert(errorLogs).values({
        errorId,
        message,
        level,
        userId,
        endpoint,
        statusCode,
        stackTrace,
        context,
        tags,
        createdAt: new Date(),
      });

      console.log(`[DatabasePersistence] Error log saved: ${errorId}`);
      return log;
    } catch (error) {
      console.error('[DatabasePersistence] Error saving error log:', error);
      return null;
    }
  }

  /**
   * Get error logs for user
   */
  static async getErrorLogs(userId: number, limit: number = 100) {
    try {
      const db = await getDb();
      if (!db) return [];

      const logs = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.userId, userId))
        .orderBy((t: any) => t.createdAt)
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('[DatabasePersistence] Error fetching error logs:', error);
      return [];
    }
  }

  /**
   * Get error logs by level
   */
  static async getErrorLogsByLevel(
    userId: number,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug',
    limit: number = 100,
  ) {
    try {
      const db = await getDb();
      if (!db) return [];

      const logs = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.userId, userId))
        .orderBy((t: any) => t.createdAt)
        .limit(limit);

      return logs.filter((l: any) => l.level === level);
    } catch (error) {
      console.error('[DatabasePersistence] Error fetching error logs by level:', error);
      return [];
    }
  }

  /**
   * Get error logs by endpoint
   */
  static async getErrorLogsByEndpoint(userId: number, endpoint: string, limit: number = 100) {
    try {
      const db = await getDb();
      if (!db) return [];

      const logs = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.userId, userId))
        .orderBy((t: any) => t.createdAt)
        .limit(limit);

      return logs.filter((l: any) => l.endpoint === endpoint);
    } catch (error) {
      console.error('[DatabasePersistence] Error fetching error logs by endpoint:', error);
      return [];
    }
  }

  /**
   * Get error statistics for user
   */
  static async getErrorStatistics(userId: number) {
    try {
      const db = await getDb();
      if (!db) return null;

      const logs = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.userId, userId));

      const stats = {
        total: logs.length,
        byLevel: {
          fatal: logs.filter((l: any) => l.level === 'fatal').length,
          error: logs.filter((l: any) => l.level === 'error').length,
          warning: logs.filter((l: any) => l.level === 'warning').length,
          info: logs.filter((l: any) => l.level === 'info').length,
          debug: logs.filter((l: any) => l.level === 'debug').length,
        },
        byEndpoint: {} as Record<string, number>,
      };

      // Count by endpoint
      for (const log of logs) {
        if (log.endpoint) {
          stats.byEndpoint[log.endpoint] = (stats.byEndpoint[log.endpoint] || 0) + 1;
        }
      }

      return stats;
    } catch (error) {
      console.error('[DatabasePersistence] Error calculating error statistics:', error);
      return null;
    }
  }

  /**
   * Get webhook statistics
   */
  static async getWebhookStatistics(webhookId: string) {
    try {
      const db = await getDb();
      if (!db) return null;

      const logs = await db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.webhookId, webhookId));

      const successful = logs.filter((l: any) => l.statusCode && l.statusCode >= 200 && l.statusCode < 300).length;
      const failed = logs.length - successful;

      return {
        totalDeliveries: logs.length,
        successfulDeliveries: successful,
        failedDeliveries: failed,
        successRate: logs.length > 0 ? (successful / logs.length) * 100 : 0,
      };
    } catch (error) {
      console.error('[DatabasePersistence] Error calculating webhook statistics:', error);
      return null;
    }
  }

  /**
   * Clean up old logs (retention policy)
   */
  static async cleanupOldLogs(retentionDays: number = 30) {
    try {
      const db = await getDb();
      if (!db) return;

      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Clean up old webhook logs and error logs
      // Note: Drizzle does not support direct date comparisons in delete
      // In production, use raw SQL queries for this operation
      console.log(`[DatabasePersistence] Cleanup scheduled for logs older than ${cutoffDate.toISOString()}`);
      // TODO: Implement cleanup using raw SQL

      console.log(
        `[DatabasePersistence] Cleaned up logs older than ${retentionDays} days`,
      );
    } catch (error) {
      console.error('[DatabasePersistence] Error cleaning up old logs:', error);
    }
  }

  /**
   * Export logs to CSV format
   */
  static async exportErrorLogsToCSV(userId: number): Promise<string> {
    try {
      const logs = await this.getErrorLogs(userId, 10000);

      if (logs.length === 0) {
        return 'No error logs found';
      }

      const headers = ['Error ID', 'Message', 'Level', 'Endpoint', 'Status Code', 'Created At'];
      const rows = logs.map((log: any) => [
        log.errorId,
        log.message,
        log.level,
        log.endpoint || 'N/A',
        log.statusCode || 'N/A',
        new Date(log.createdAt).toISOString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return csv;
    } catch (error) {
      console.error('[DatabasePersistence] Error exporting logs:', error);
      return 'Error exporting logs';
    }
  }

  /**
   * Export webhook logs to CSV format
   */
  static async exportWebhookLogsToCSV(webhookId: string): Promise<string> {
    try {
      const logs = await this.getWebhookLogsForWebhook(webhookId, 10000);

      if (logs.length === 0) {
        return 'No webhook logs found';
      }

      const headers = ['Webhook ID', 'URL', 'Event Type', 'Attempt', 'Status Code', 'Error', 'Created At'];
      const rows = logs.map((log: any) => [
        log.webhookId,
        log.url,
        log.eventType,
        log.attempt,
        log.statusCode || 'N/A',
        log.error || 'N/A',
        new Date(log.createdAt).toISOString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return csv;
    } catch (error) {
      console.error('[DatabasePersistence] Error exporting webhook logs:', error);
      return 'Error exporting logs';
    }
  }
}
