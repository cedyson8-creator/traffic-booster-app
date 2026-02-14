import { Router } from 'express';
import { getDb, getUserWebsites } from '@/server/db';
import { emailDeliveryLogs, scheduledReports } from '@/drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/delivery-analytics/summary
 * Get delivery summary stats for a user
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    const logs = await db
      .select({
        status: emailDeliveryLogs.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(emailDeliveryLogs)
      .where(eq(emailDeliveryLogs.userId, parseInt(userId)))
      .groupBy(emailDeliveryLogs.status);

    const total = logs.reduce((sum, log) => sum + log.count, 0);
    const sent = logs.find(l => l.status === 'sent')?.count || 0;
    const failed = logs.find(l => l.status === 'failed')?.count || 0;
    const bounced = logs.find(l => l.status === 'bounced')?.count || 0;

    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
    const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0;
    const bounceRate = total > 0 ? Math.round((bounced / total) * 100) : 0;

    res.json({
      total,
      sent,
      failed,
      bounced,
      successRate,
      failureRate,
      bounceRate,
    });
  } catch (error) {
    console.error('[DeliveryAnalytics] Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch delivery summary' });
  }
});

/**
 * GET /api/delivery-analytics/by-schedule
 * Get delivery stats grouped by schedule
 */
router.get('/by-schedule', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    const stats = await db
      .select({
        scheduleId: emailDeliveryLogs.scheduleId,
        scheduleName: scheduledReports.email,
        status: emailDeliveryLogs.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(emailDeliveryLogs)
      .leftJoin(
        scheduledReports,
        eq(emailDeliveryLogs.scheduleId, scheduledReports.id)
      )
      .where(
        and(
          eq(emailDeliveryLogs.userId, parseInt(userId)),
          eq(scheduledReports.userId, parseInt(userId))
        )
      )
      .groupBy(emailDeliveryLogs.scheduleId, scheduledReports.email, emailDeliveryLogs.status);

    // Aggregate by schedule
    const bySchedule = new Map<number, any>();
    stats.forEach((stat: any) => {
      if (!bySchedule.has(stat.scheduleId)) {
        bySchedule.set(stat.scheduleId, {
          scheduleId: stat.scheduleId,
          email: stat.scheduleName,
          total: 0,
          sent: 0,
          failed: 0,
          bounced: 0,
        });
      }
      const schedule = bySchedule.get(stat.scheduleId);
      schedule.total += stat.count;
      if (stat.status === 'sent') schedule.sent += stat.count;
      if (stat.status === 'failed') schedule.failed += stat.count;
      if (stat.status === 'bounced') schedule.bounced += stat.count;
    });

    const result = Array.from(bySchedule.values()).map((s) => ({
      ...s,
      successRate: s.total > 0 ? Math.round((s.sent / s.total) * 100) : 0,
    }));

    res.json(result);
  } catch (error) {
    console.error('[DeliveryAnalytics] Error fetching by-schedule stats:', error);
    res.status(500).json({ error: 'Failed to fetch schedule stats' });
  }
});

/**
 * GET /api/delivery-analytics/timeline
 * Get delivery timeline for the last 30 days
 */
router.get('/timeline', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const timeline = await db
      .select({
        date: sql<string>`DATE(${emailDeliveryLogs.sentAt})`,
        status: emailDeliveryLogs.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(emailDeliveryLogs)
      .where(
        and(
          eq(emailDeliveryLogs.userId, parseInt(userId)),
          gte(emailDeliveryLogs.sentAt, thirtyDaysAgo)
        )
      )
      .groupBy(
        sql<string>`DATE(${emailDeliveryLogs.sentAt})`,
        emailDeliveryLogs.status
      )
      .orderBy(sql<string>`DATE(${emailDeliveryLogs.sentAt})`);

    // Aggregate by date
    const byDate = new Map<string, any>();
    timeline.forEach((entry: any) => {
      if (!byDate.has(entry.date)) {
        byDate.set(entry.date, {
          date: entry.date,
          sent: 0,
          failed: 0,
          bounced: 0,
          total: 0,
        });
      }
      const day = byDate.get(entry.date);
      day.total += entry.count;
      if (entry.status === 'sent') day.sent += entry.count;
      if (entry.status === 'failed') day.failed += entry.count;
      if (entry.status === 'bounced') day.bounced += entry.count;
    });

    const result = Array.from(byDate.values());
    res.json(result);
  } catch (error) {
    console.error('[DeliveryAnalytics] Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch delivery timeline' });
  }
});

/**
 * GET /api/delivery-analytics/recent-failures
 * Get recent failed deliveries
 */
router.get('/recent-failures', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    const failures = await db
      .select({
        id: emailDeliveryLogs.id,
        email: emailDeliveryLogs.email,
        scheduleId: emailDeliveryLogs.scheduleId,
        errorMessage: emailDeliveryLogs.errorMessage,
        sentAt: emailDeliveryLogs.sentAt,
      })
      .from(emailDeliveryLogs)
      .where(
        and(
          eq(emailDeliveryLogs.userId, parseInt(userId)),
          eq(emailDeliveryLogs.status, 'failed')
        )
      )
      .orderBy(sql`${emailDeliveryLogs.sentAt} DESC`)
      .limit(limit);

    res.json(failures);
  } catch (error) {
    console.error('[DeliveryAnalytics] Error fetching recent failures:', error);
    res.status(500).json({ error: 'Failed to fetch recent failures' });
  }
});

/**
 * POST /api/delivery-analytics/resend/:logId
 * Manually resend a failed email
 */
router.post('/resend/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    const userId = req.query.userId as string;
    if (!userId || !logId) {
      return res.status(400).json({ error: 'userId and logId required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Get the failed email log
    const log = await db
      .select()
      .from(emailDeliveryLogs)
      .where(
        and(
          eq(emailDeliveryLogs.id, parseInt(logId)),
          eq(emailDeliveryLogs.userId, parseInt(userId))
        )
      )
      .limit(1);

    if (log.length === 0) {
      return res.status(404).json({ error: 'Email log not found' });
    }

    // Reset the email for retry
    await db
      .update(emailDeliveryLogs)
      .set({
        status: 'failed',
        retryCount: 0,
        nextRetryAt: new Date(),
        errorMessage: null,
      })
      .where(eq(emailDeliveryLogs.id, parseInt(logId)));

    res.json({ success: true, message: 'Email queued for resend' });
  } catch (error) {
    console.error('[DeliveryAnalytics] Error resending email:', error);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

export default router;
