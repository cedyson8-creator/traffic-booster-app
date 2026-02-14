import { getDb, getUserWebsites } from '@/server/db';
import { scheduledReports } from '@/drizzle/schema';
import { eq, and, lte } from 'drizzle-orm';
import { TrafficDataService } from './traffic-data.service';

/**
 * Email Sender Service
 * Handles sending scheduled reports via email
 */
export class EmailSenderService {
  /**
   * Send all due scheduled reports
   * Called by cron job to check and send reports that are due
   */
  static async sendDueReports(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn('[EmailSender] Database not available');
        return;
      }

      // Get all active scheduled reports that are due
      const now = new Date();
      const dueReports = await db
        .select()
        .from(scheduledReports)
        .where(
          and(
            eq(scheduledReports.isActive, true),
            lte(scheduledReports.nextSendAt, now)
          )
        );

      console.log(`[EmailSender] Found ${dueReports.length} reports to send`);

      for (const report of dueReports) {
        try {
          await this.sendReport(report);
        } catch (error) {
          console.error(
            `[EmailSender] Failed to send report ${report.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('[EmailSender] Error in sendDueReports:', error);
    }
  }

  /**
   * Send a single scheduled report
   */
  static async sendReport(report: any): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Get website info
      const websiteList = await getUserWebsites(report.userId);
      const website = websiteList.find((w: any) => w.id === report.websiteId);

      if (!website) {
        throw new Error(`Website ${report.websiteId} not found`);
      }

      const metrics = JSON.parse(report.metrics || '[]');

      // Fetch real data for the report
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date(),
      };
      const trafficData = await TrafficDataService.fetchRealTrafficData(
        report.userId,
        report.websiteId,
        dateRange
      );

      // Generate email content
      const emailContent = this.generateEmailContent(
        website.name,
        metrics,
        trafficData || { visits: 0, uniqueVisitors: 0, bounceRate: 0, avgSessionDuration: 0, conversionRate: 0 }
      );

      // Send email (mock implementation - replace with actual email service)
      await this.sendEmail(
        report.email,
        `Traffic Report: ${website.name}`,
        emailContent
      );

      // Update last sent timestamp and calculate next send date
      const nextSendAt = this.calculateNextSendDate(
        report.frequency,
        report.dayOfWeek,
        report.dayOfMonth
      );

      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance
          .update(scheduledReports)
          .set({
            lastSentAt: new Date(),
            nextSendAt,
          } as any)
          .where(eq(scheduledReports.id, report.id));
      }

      console.log(
        `[EmailSender] Successfully sent report ${report.id} to ${report.email}`
      );
    } catch (error) {
      console.error(`[EmailSender] Error sending report:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML email content for the report
   */
  static generateEmailContent(
    websiteName: string,
    metrics: string[],
    data: any
  ): string {
    const metricLabels: Record<string, string> = {
      visits: 'Total Visits',
      uniqueVisitors: 'Unique Visitors',
      bounceRate: 'Bounce Rate',
      avgSessionDuration: 'Avg Session Duration',
      conversionRate: 'Conversion Rate',
      topPages: 'Top Pages',
      trafficSources: 'Traffic Sources',
      campaigns: 'Campaigns',
      dailyTrend: 'Daily Trend',
      deviceBreakdown: 'Device Breakdown',
    };

    let content = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0a7ea4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0 0 0; opacity: 0.9; }
            .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 6px; }
            .metric-label { font-weight: bold; color: #0a7ea4; }
            .metric-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Traffic Report</h1>
              <p>${websiteName}</p>
            </div>
    `;

    // Add selected metrics
    if (metrics.includes('visits') && data.visits) {
      content += `
        <div class="metric">
          <div class="metric-label">${metricLabels.visits}</div>
          <div class="metric-value">${data.visits.toLocaleString()}</div>
        </div>
      `;
    }

    if (metrics.includes('uniqueVisitors') && data.uniqueVisitors) {
      content += `
        <div class="metric">
          <div class="metric-label">${metricLabels.uniqueVisitors}</div>
          <div class="metric-value">${data.uniqueVisitors.toLocaleString()}</div>
        </div>
      `;
    }

    if (metrics.includes('bounceRate') && data.bounceRate) {
      content += `
        <div class="metric">
          <div class="metric-label">${metricLabels.bounceRate}</div>
          <div class="metric-value">${data.bounceRate}%</div>
        </div>
      `;
    }

    if (metrics.includes('avgSessionDuration') && data.avgSessionDuration) {
      content += `
        <div class="metric">
          <div class="metric-label">${metricLabels.avgSessionDuration}</div>
          <div class="metric-value">${data.avgSessionDuration}s</div>
        </div>
      `;
    }

    if (metrics.includes('conversionRate') && data.conversionRate) {
      content += `
        <div class="metric">
          <div class="metric-label">${metricLabels.conversionRate}</div>
          <div class="metric-value">${data.conversionRate}%</div>
        </div>
      `;
    }

    content += `
            <div class="footer">
              <p>This is an automated report from Traffic Booster Pro.</p>
              <p>Report generated on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return content;
  }

  /**
   * Send email (mock implementation)
   * Replace with actual email service (SendGrid, Nodemailer, etc.)
   */
  static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    // Mock implementation - logs email instead of sending
    console.log(`[EmailSender] Mock email sent to ${to}`);
    console.log(`[EmailSender] Subject: ${subject}`);
    console.log(`[EmailSender] Content length: ${htmlContent.length} chars`);

    // TODO: Replace with actual email service
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({ to, subject, html: htmlContent });

    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, subject, html: htmlContent });
  }

  /**
   * Calculate next send date based on frequency
   */
  static calculateNextSendDate(
    frequency: string,
    dayOfWeek?: string,
    dayOfMonth?: number
  ): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'weekly':
        const targetDay = this.dayOfWeekToNumber(dayOfWeek || 'monday');
        const currentDay = next.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntilTarget);
        next.setHours(9, 0, 0, 0);
        break;

      case 'biweekly':
        const biweeklyDay = this.dayOfWeekToNumber(dayOfWeek || 'monday');
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
  static dayOfWeekToNumber(day: string): number {
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
}
