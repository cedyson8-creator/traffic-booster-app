import nodemailer from 'nodemailer';
import * as cron from 'node-cron';
import { ExportService, TrafficReport } from './export.service';

export interface EmailSchedule {
  id: string;
  userId: string;
  websiteId: string;
  email: string;
  frequency: 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  enabled: boolean;
  createdAt: Date;
}

/**
 * Service for scheduling and sending automated email reports
 */
export class EmailSchedulerService {
  private static transporter: nodemailer.Transporter;
  private static scheduledJobs: Map<string, ReturnType<typeof cron.schedule>> = new Map();

  /**
   * Initialize the email transporter
   */
  static initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Schedule an email report
   */
  static scheduleReport(schedule: EmailSchedule, reportGenerator: () => Promise<TrafficReport>) {
    const jobId = schedule.id;

    // Parse time
    const [hours, minutes] = schedule.time.split(':').map(Number);

    // Create cron expression
    let cronExpression: string;

    if (schedule.frequency === 'weekly') {
      const dayOfWeek = schedule.dayOfWeek || 0;
      cronExpression = `${minutes} ${hours} * * ${dayOfWeek}`;
    } else {
      // monthly
      const dayOfMonth = schedule.dayOfMonth || 1;
      cronExpression = `${minutes} ${hours} ${dayOfMonth} * *`;
    }

    // Schedule the job
    const task = cron.schedule(cronExpression, async () => {
      try {
        if (!schedule.enabled) return;

        // Generate report
        const report = await reportGenerator();

        // Generate PDF
        const pdfBuffer = await ExportService.generatePDFReport(report);

        // Send email
        await this.sendReportEmail(schedule.email, report, pdfBuffer);

        console.log(`Report sent successfully to ${schedule.email}`);
      } catch (error) {
        console.error(`Failed to send scheduled report for ${jobId}:`, error);
      }
    });

    // Store the scheduled job
    this.scheduledJobs.set(jobId, task);
  }

  /**
   * Send a report via email
   */
  static async sendReportEmail(
    toEmail: string,
    report: TrafficReport,
    pdfBuffer: Buffer
  ): Promise<void> {
    if (!this.transporter) {
      this.initializeTransporter();
    }

    const dateRange = `${report.dateRange.start.toLocaleDateString()} - ${report.dateRange.end.toLocaleDateString()}`;

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Traffic Report: ${report.websiteName}</h2>
          <p>Period: ${dateRange}</p>
          
          <h3>Key Metrics</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;">Total Visits</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${report.metrics.totalVisits.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Unique Visitors</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${report.metrics.uniqueVisitors.toLocaleString()}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;">Avg Session Duration</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${report.metrics.avgSessionDuration.toFixed(1)}s</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Bounce Rate</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${report.metrics.bounceRate.toFixed(1)}%</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;">Conversion Rate</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${report.metrics.conversionRate.toFixed(2)}%</td>
            </tr>
          </table>

          <h3>Top Traffic Sources</h3>
          <ul>
            ${report.trafficSources
              .slice(0, 5)
              .map(
                (source) =>
                  `<li>${source.source}: ${source.visits} visits (${source.percentage.toFixed(1)}%)</li>`
              )
              .join('')}
          </ul>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated report from Traffic Booster Pro. 
            Please see the attached PDF for the complete report.
          </p>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `Traffic Report: ${report.websiteName} - ${dateRange}`,
      html: htmlContent,
      attachments: [
        {
          filename: `traffic-report-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Unschedule a report
   */
  static unscheduleReport(scheduleId: string): void {
    const task = this.scheduledJobs.get(scheduleId);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(scheduleId);
    }
  }

  /**
   * Get all scheduled jobs
   */
  static getScheduledJobs(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }

  /**
   * Update a schedule
   */
  static updateSchedule(scheduleId: string, updates: Partial<EmailSchedule>): void {
    // Unschedule the old job
    this.unscheduleReport(scheduleId);

    // Reschedule with new settings
    // Note: In a real implementation, you'd fetch the updated schedule from the database
    // and reschedule it
  }
}
