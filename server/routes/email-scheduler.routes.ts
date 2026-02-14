import { Router, Request, Response } from 'express';
import { getDb } from '@/server/db';
import { scheduledReports } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * Create a new scheduled report
 * POST /api/email-scheduler/schedule
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { userId, websiteId, email, metrics, frequency, dayOfWeek, dayOfMonth } = req.body;

    // Validate required fields
    if (!userId || !websiteId || !email || !metrics || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Calculate next send date
    const nextSendAt = calculateNextSendDate(frequency, dayOfWeek, dayOfMonth);

    // Create scheduled report
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const result = await db
      .insert(scheduledReports)
      .values({
        userId,
        websiteId,
        email,
        metrics: JSON.stringify(metrics),
        frequency,
        dayOfWeek,
        dayOfMonth,
        isActive: true,
        nextSendAt,
      });

    return res.status(201).json({
      success: true,
      data: formatScheduledReport(result[0]),
    });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return res.status(500).json({ error: 'Failed to create scheduled report' });
  }
});

/**
 * Get all scheduled reports for a user
 * GET /api/email-scheduler/schedules
 */
router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const reports = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.userId, parseInt(userId)));

    return res.json({
      success: true,
      data: reports.map(formatScheduledReport),
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled reports' });
  }
});

/**
 * Get a specific scheduled report
 * GET /api/email-scheduler/schedules/:id
 */
router.get('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const report = await db
      .select()
      .from(scheduledReports)
      .where(
        and(
          eq(scheduledReports.id, parseInt(id)),
          eq(scheduledReports.userId, parseInt(userId))
        )
      )
      .limit(1);

    if (report.length === 0) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    return res.json({
      success: true,
      data: formatScheduledReport(report[0]),
    });
  } catch (error) {
    console.error('Error fetching scheduled report:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled report' });
  }
});

/**
 * Update a scheduled report
 * PUT /api/email-scheduler/schedules/:id
 */
router.put('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;
    const { email, metrics, frequency, dayOfWeek, dayOfMonth, isActive } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const updateData: any = {};

    if (email) updateData.email = email;
    if (metrics) updateData.metrics = JSON.stringify(metrics);
    if (frequency) updateData.frequency = frequency;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (dayOfMonth !== undefined) updateData.dayOfMonth = dayOfMonth;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Recalculate next send date if schedule changed
    if (frequency || dayOfWeek || dayOfMonth) {
      updateData.nextSendAt = calculateNextSendDate(frequency, dayOfWeek, dayOfMonth);
    }

    await db
      .update(scheduledReports)
      .set(updateData)
      .where(
        and(
          eq(scheduledReports.id, parseInt(id)),
          eq(scheduledReports.userId, parseInt(userId))
        )
      );

    // Fetch the updated record
    const report = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.id, parseInt(id)))
      .limit(1);

    const result = report;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    return res.json({
      success: true,
      data: formatScheduledReport(result[0]),
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return res.status(500).json({ error: 'Failed to update scheduled report' });
  }
});

/**
 * Delete a scheduled report
 * DELETE /api/email-scheduler/schedules/:id
 */
router.delete('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    await db
      .delete(scheduledReports)
      .where(
        and(
          eq(scheduledReports.id, parseInt(id)),
          eq(scheduledReports.userId, parseInt(userId))
        )
      );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return res.status(500).json({ error: 'Failed to delete scheduled report' });
  }
});

/**
 * Toggle a scheduled report active/inactive
 * PATCH /api/email-scheduler/schedules/:id/toggle
 */
router.patch('/schedules/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;
    const { isActive } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    await db
      .update(scheduledReports)
      .set({ isActive })
      .where(
        and(
          eq(scheduledReports.id, parseInt(id)),
          eq(scheduledReports.userId, parseInt(userId))
        )
      );

    // Fetch the updated record
    const report = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.id, parseInt(id)))
      .limit(1);

    const result = report;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    return res.json({
      success: true,
      data: formatScheduledReport(result[0]),
    });
  } catch (error) {
    console.error('Error toggling scheduled report:', error);
    return res.status(500).json({ error: 'Failed to toggle scheduled report' });
  }
});

/**
 * Calculate next send date based on frequency
 */
function calculateNextSendDate(
  frequency: string,
  dayOfWeek?: string,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'weekly':
      const targetDay = dayOfWeekToNumber(dayOfWeek || 'monday');
      const currentDay = next.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget);
      next.setHours(9, 0, 0, 0);
      break;

    case 'biweekly':
      const biweeklyDay = dayOfWeekToNumber(dayOfWeek || 'monday');
      const biweeklyCurrent = next.getDay();
      const biweeklyDays = (biweeklyDay - biweeklyCurrent + 14) % 14 || 14;
      next.setDate(next.getDate() + biweeklyDays);
      next.setHours(9, 0, 0, 0);
      break;

    case 'monthly':
      const targetDate = dayOfMonth || 1;
      next.setMonth(next.getMonth() + 1);
      next.setDate(targetDate);
      next.setHours(9, 0, 0, 0);

      if (next < now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }

  return next;
}

/**
 * Convert day of week string to number (0-6)
 */
function dayOfWeekToNumber(day: string): number {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[day] || 1;
}

/**
 * Format a scheduled report for response
 */
function formatScheduledReport(report: any) {
  return {
    id: report.id,
    userId: report.userId,
    websiteId: report.websiteId,
    email: report.email,
    metrics: JSON.parse(report.metrics || '[]'),
    frequency: report.frequency,
    dayOfWeek: report.dayOfWeek,
    dayOfMonth: report.dayOfMonth,
    isActive: report.isActive,
    nextSendAt: report.nextSendAt,
    lastSentAt: report.lastSentAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

export default router;
