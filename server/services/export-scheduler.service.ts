import { EventEmitter } from 'events';

export interface ExportSchedule {
  id: string;
  userId: number;
  websiteId: number;
  format: 'csv' | 'json' | 'html' | 'pdf';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  email: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
}

export interface ExportJob {
  id: string;
  scheduleId: string;
  userId: number;
  websiteId: number;
  format: 'csv' | 'json' | 'html' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  email: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * ExportSchedulerService
 * Manages scheduled exports of dashboard reports
 */
export class ExportSchedulerService extends EventEmitter {
  private static instance: ExportSchedulerService;
  private schedules: Map<string, ExportSchedule> = new Map();
  private jobs: Map<string, ExportJob> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    super();
  }

  static getInstance(): ExportSchedulerService {
    if (!ExportSchedulerService.instance) {
      ExportSchedulerService.instance = new ExportSchedulerService();
    }
    return ExportSchedulerService.instance;
  }

  /**
   * Create a new export schedule
   */
  createSchedule(schedule: Omit<ExportSchedule, 'id' | 'createdAt' | 'lastRun'>): ExportSchedule {
    const id = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSchedule: ExportSchedule = {
      ...schedule,
      id,
      createdAt: new Date(),
    };

    this.schedules.set(id, newSchedule);
    this.emit('schedule:created', newSchedule);
    console.log(`[ExportScheduler] Schedule created: ${id}`);

    return newSchedule;
  }

  /**
   * Update an existing schedule
   */
  updateSchedule(id: string, updates: Partial<ExportSchedule>): ExportSchedule | null {
    const schedule = this.schedules.get(id);
    if (!schedule) return null;

    const updated = { ...schedule, ...updates, id, createdAt: schedule.createdAt };
    this.schedules.set(id, updated);
    this.emit('schedule:updated', updated);
    console.log(`[ExportScheduler] Schedule updated: ${id}`);

    return updated;
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(id: string): boolean {
    const deleted = this.schedules.delete(id);
    if (deleted) {
      this.emit('schedule:deleted', id);
      console.log(`[ExportScheduler] Schedule deleted: ${id}`);
    }
    return deleted;
  }

  /**
   * Get all schedules for a user
   */
  getSchedulesByUser(userId: number): ExportSchedule[] {
    return Array.from(this.schedules.values()).filter(s => s.userId === userId);
  }

  /**
   * Get a specific schedule
   */
  getSchedule(id: string): ExportSchedule | null {
    return this.schedules.get(id) || null;
  }

  /**
   * Start the scheduler
   */
  start(checkIntervalMs: number = 60000): void {
    if (this.checkInterval) {
      console.log('[ExportScheduler] Already running');
      return;
    }

    this.checkInterval = setInterval(() => {
      this.checkAndExecuteSchedules();
    }, checkIntervalMs);

    console.log('[ExportScheduler] Started with ' + checkIntervalMs + 'ms interval');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[ExportScheduler] Stopped');
    }
  }

  /**
   * Check and execute due schedules
   */
  private checkAndExecuteSchedules(): void {
    const now = new Date();

    for (const schedule of this.schedules.values()) {
      if (!schedule.isActive) continue;

      if (this.isScheduleDue(schedule, now)) {
        this.executeSchedule(schedule);
      }
    }
  }

  /**
   * Check if a schedule is due
   */
  private isScheduleDue(schedule: ExportSchedule, now: Date): boolean {
    const nextRun = new Date(schedule.nextRun);
    return now >= nextRun;
  }

  /**
   * Execute a schedule
   */
  private executeSchedule(schedule: ExportSchedule): void {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job: ExportJob = {
      id: jobId,
      scheduleId: schedule.id,
      userId: schedule.userId,
      websiteId: schedule.websiteId,
      format: schedule.format,
      status: 'pending',
      email: schedule.email,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.emit('job:created', job);
    console.log(`[ExportScheduler] Job created: ${jobId} for schedule ${schedule.id}`);

    // Simulate job processing
    setTimeout(() => {
      this.processJob(jobId);
    }, 1000);

    // Update schedule's next run time
    const nextRun = this.calculateNextRun(schedule);
    this.updateSchedule(schedule.id, { nextRun, lastRun: new Date() });
  }

  /**
   * Process an export job
   */
  private processJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Update job status to processing
    job.status = 'processing';
    this.jobs.set(jobId, job);
    this.emit('job:processing', job);

    // Simulate export generation
    setTimeout(() => {
      try {
        // Generate export data
        const exportData = this.generateExportData(job);

        // Update job status to completed
        job.status = 'completed';
        job.completedAt = new Date();
        this.jobs.set(jobId, job);
        this.emit('job:completed', job);
        this.emit('export:ready', { jobId, data: exportData, format: job.format, email: job.email });

        console.log(`[ExportScheduler] Job completed: ${jobId}`);
      } catch (error) {
        job.status = 'failed';
        job.error = (error as Error).message;
        job.completedAt = new Date();
        this.jobs.set(jobId, job);
        this.emit('job:failed', job);

        console.error(`[ExportScheduler] Job failed: ${jobId}`, error);
      }
    }, 2000);
  }

  /**
   * Generate export data
   */
  private generateExportData(job: ExportJob): string {
    const data = {
      title: 'Dashboard Export',
      format: job.format,
      generatedAt: new Date().toISOString(),
      metrics: [
        { endpoint: '/api/users', avgResponseTime: 150, errorRate: 0.01 },
        { endpoint: '/api/posts', avgResponseTime: 200, errorRate: 0.02 },
      ],
    };

    if (job.format === 'csv') {
      return 'Endpoint,Avg Response Time,Error Rate\n' +
        data.metrics.map(m => `${m.endpoint},${m.avgResponseTime},${m.errorRate}`).join('\n');
    } else if (job.format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (job.format === 'html') {
      return `<!DOCTYPE html>
<html>
<head><title>Dashboard Export</title></head>
<body>
  <h1>Dashboard Export</h1>
  <p>Generated: ${data.generatedAt}</p>
  <table border="1">
    <tr><th>Endpoint</th><th>Avg Response Time</th><th>Error Rate</th></tr>
    ${data.metrics.map(m => `<tr><td>${m.endpoint}</td><td>${m.avgResponseTime}ms</td><td>${(m.errorRate * 100).toFixed(2)}%</td></tr>`).join('')}
  </table>
</body>
</html>`;
    }

    return JSON.stringify(data);
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(schedule: ExportSchedule): Date {
    const next = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    next.setHours(hours, minutes, 0, 0);

    if (schedule.frequency === 'daily') {
      if (next <= new Date()) {
        next.setDate(next.getDate() + 1);
      }
    } else if (schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined) {
      const currentDay = next.getDay();
      let daysToAdd = (schedule.dayOfWeek - currentDay + 7) % 7;
      if (daysToAdd === 0 && next <= new Date()) {
        daysToAdd = 7;
      }
      next.setDate(next.getDate() + daysToAdd);
    } else if (schedule.frequency === 'monthly' && schedule.dayOfMonth !== undefined) {
      next.setDate(schedule.dayOfMonth);
      if (next <= new Date()) {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): ExportJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs for a user
   */
  getJobsByUser(userId: number): ExportJob[] {
    return Array.from(this.jobs.values()).filter(j => j.userId === userId);
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): ExportSchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ExportJob[] {
    return Array.from(this.jobs.values());
  }
}
