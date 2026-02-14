/**
 * Compliance Scheduler Service
 * Handles automated compliance report generation and email delivery
 */

export interface ScheduledReport {
  id: string;
  organizationId: string;
  reportType: 'SOC2' | 'GDPR' | 'HIPAA';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRunTime: Date;
  lastRunTime?: Date;
  isActive: boolean;
  recipientEmails: string[];
  includeMetrics: boolean;
  includeAuditLogs: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSchedule {
  id: string;
  organizationId: string;
  reportType: 'SOC2' | 'GDPR' | 'HIPAA';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  timezone: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReportExecution {
  id: string;
  scheduledReportId: string;
  executedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reportUrl?: string;
  errorMessage?: string;
  emailsSent: number;
  duration: number; // in milliseconds
}

export class ComplianceSchedulerService {
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private reportSchedules: Map<string, ReportSchedule> = new Map();
  private executions: Map<string, ScheduledReportExecution> = new Map();
  private emailQueue: Array<{ to: string; subject: string; body: string; attachmentUrl?: string }> = [];

  /**
   * Create scheduled report
   */
  createScheduledReport(
    organizationId: string,
    reportType: 'SOC2' | 'GDPR' | 'HIPAA',
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipientEmails: string[],
    includeMetrics: boolean = true,
    includeAuditLogs: boolean = true,
  ): ScheduledReport {
    const report: ScheduledReport = {
      id: `sr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      reportType,
      frequency,
      nextRunTime: this.calculateNextRunTime(frequency),
      isActive: true,
      recipientEmails,
      includeMetrics,
      includeAuditLogs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledReports.set(report.id, report);
    return report;
  }

  /**
   * Get scheduled report
   */
  getScheduledReport(id: string): ScheduledReport | undefined {
    return this.scheduledReports.get(id);
  }

  /**
   * List scheduled reports for organization
   */
  listScheduledReports(organizationId: string): ScheduledReport[] {
    return Array.from(this.scheduledReports.values()).filter(
      (r) => r.organizationId === organizationId,
    );
  }

  /**
   * Update scheduled report
   */
  updateScheduledReport(id: string, updates: Partial<ScheduledReport>): ScheduledReport | undefined {
    const report = this.scheduledReports.get(id);
    if (!report) return undefined;

    Object.assign(report, updates, { updatedAt: new Date() });
    return report;
  }

  /**
   * Delete scheduled report
   */
  deleteScheduledReport(id: string): boolean {
    return this.scheduledReports.delete(id);
  }

  /**
   * Create report schedule
   */
  createReportSchedule(
    organizationId: string,
    reportType: 'SOC2' | 'GDPR' | 'HIPAA',
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    time: string,
    timezone: string = 'UTC',
    dayOfWeek?: number,
    dayOfMonth?: number,
  ): ReportSchedule {
    const schedule: ReportSchedule = {
      id: `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      reportType,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      timezone,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reportSchedules.set(schedule.id, schedule);
    return schedule;
  }

  /**
   * Get report schedule
   */
  getReportSchedule(id: string): ReportSchedule | undefined {
    return this.reportSchedules.get(id);
  }

  /**
   * List report schedules for organization
   */
  listReportSchedules(organizationId: string): ReportSchedule[] {
    return Array.from(this.reportSchedules.values()).filter(
      (s) => s.organizationId === organizationId,
    );
  }

  /**
   * Update report schedule
   */
  updateReportSchedule(id: string, updates: Partial<ReportSchedule>): ReportSchedule | undefined {
    const schedule = this.reportSchedules.get(id);
    if (!schedule) return undefined;

    Object.assign(schedule, updates, { updatedAt: new Date() });
    return schedule;
  }

  /**
   * Delete report schedule
   */
  deleteReportSchedule(id: string): boolean {
    return this.reportSchedules.delete(id);
  }

  /**
   * Execute scheduled report
   */
  executeScheduledReport(scheduledReportId: string): ScheduledReportExecution {
    const report = this.scheduledReports.get(scheduledReportId);
    if (!report) {
      throw new Error(`Scheduled report ${scheduledReportId} not found`);
    }

    const execution: ScheduledReportExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scheduledReportId,
      executedAt: new Date(),
      status: 'processing',
      emailsSent: 0,
      duration: 0,
    };

    this.executions.set(execution.id, execution);

    // Simulate report generation and email sending
    setTimeout(() => {
      const exec = this.executions.get(execution.id);
      if (exec) {
        exec.status = 'completed';
        exec.reportUrl = `https://example.com/reports/${execution.id}.pdf`;
        exec.emailsSent = report.recipientEmails.length;
        exec.duration = Math.random() * 5000 + 1000;

        // Queue emails
        report.recipientEmails.forEach((email) => {
          this.emailQueue.push({
            to: email,
            subject: `${report.reportType} Compliance Report - ${new Date().toLocaleDateString()}`,
            body: `Your ${report.reportType} compliance report is ready. Please find it attached.`,
            attachmentUrl: exec.reportUrl,
          });
        });

        // Update next run time
        report.lastRunTime = new Date();
        report.nextRunTime = this.calculateNextRunTime(report.frequency);
      }
    }, 2000);

    return execution;
  }

  /**
   * Get execution
   */
  getExecution(id: string): ScheduledReportExecution | undefined {
    return this.executions.get(id);
  }

  /**
   * List executions for scheduled report
   */
  listExecutions(scheduledReportId: string, limit: number = 10): ScheduledReportExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.scheduledReportId === scheduledReportId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get pending reports to execute
   */
  getPendingReports(): ScheduledReport[] {
    const now = new Date();
    return Array.from(this.scheduledReports.values()).filter(
      (r) => r.isActive && r.nextRunTime <= now,
    );
  }

  /**
   * Get email queue
   */
  getEmailQueue(): Array<{ to: string; subject: string; body: string; attachmentUrl?: string }> {
    return [...this.emailQueue];
  }

  /**
   * Process email queue
   */
  processEmailQueue(): number {
    const count = this.emailQueue.length;
    console.log(`[ComplianceScheduler] Processing ${count} emails from queue`);
    this.emailQueue = [];
    return count;
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRunTime(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get compliance calendar
   */
  getComplianceCalendar(organizationId: string): Array<{
    date: Date;
    reportType: string;
    frequency: string;
  }> {
    const reports = this.listScheduledReports(organizationId);
    const calendar: Array<{ date: Date; reportType: string; frequency: string }> = [];

    reports.forEach((report) => {
      for (let i = 0; i < 12; i++) {
        const nextDate = new Date(report.nextRunTime);
        nextDate.setMonth(nextDate.getMonth() + i);
        calendar.push({
          date: nextDate,
          reportType: report.reportType,
          frequency: report.frequency,
        });
      }
    });

    return calendar.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(organizationId: string): {
    activeReports: number;
    nextReportDate?: Date;
    lastReportDate?: Date;
    emailsSentThisMonth: number;
  } {
    const reports = this.listScheduledReports(organizationId);
    const activeReports = reports.filter((r) => r.isActive).length;

    const nextReport = reports
      .filter((r) => r.isActive)
      .sort((a, b) => a.nextRunTime.getTime() - b.nextRunTime.getTime())[0];

    const lastReport = reports
      .filter((r) => r.lastRunTime)
      .sort((a, b) => (b.lastRunTime?.getTime() || 0) - (a.lastRunTime?.getTime() || 0))[0];

    const emailsSentThisMonth = Array.from(this.executions.values()).filter(
      (e) => {
        const report = this.scheduledReports.get(e.scheduledReportId);
        return (
          report?.organizationId === organizationId &&
          e.executedAt.getMonth() === new Date().getMonth() &&
          e.status === 'completed'
        );
      },
    ).length;

    return {
      activeReports,
      nextReportDate: nextReport?.nextRunTime,
      lastReportDate: lastReport?.lastRunTime,
      emailsSentThisMonth,
    };
  }

  /**
   * Export compliance schedule
   */
  exportComplianceSchedule(organizationId: string, format: 'json' | 'ics'): string {
    const reports = this.listScheduledReports(organizationId);

    if (format === 'json') {
      return JSON.stringify(reports, null, 2);
    }

    // ICS format (iCalendar)
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Traffic Booster//Compliance Scheduler//EN\n';

    reports.forEach((report) => {
      ics += 'BEGIN:VEVENT\n';
      ics += `DTSTART:${report.nextRunTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ics += `SUMMARY:${report.reportType} Compliance Report\n`;
      ics += `DESCRIPTION:Automated ${report.reportType} report generation\n`;
      ics += `RRULE:FREQ=${report.frequency.toUpperCase()}\n`;
      ics += 'END:VEVENT\n';
    });

    ics += 'END:VCALENDAR';
    return ics;
  }

  /**
   * Cleanup old executions
   */
  cleanupOldExecutions(daysToKeep: number = 90): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    let deleted = 0;

    for (const [id, execution] of this.executions.entries()) {
      if (execution.executedAt < cutoffDate) {
        this.executions.delete(id);
        deleted++;
      }
    }

    return deleted;
  }
}
