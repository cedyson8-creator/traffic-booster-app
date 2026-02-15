/**
 * Custom Report Builder Service
 * Allows users to create, schedule, and export custom reports
 */

export type ReportMetric = 'api_calls' | 'error_rate' | 'webhook_success' | 'response_time' | 'quota_usage' | 'revenue';
export type ReportFormat = 'pdf' | 'csv' | 'json' | 'html';
export type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface ReportConfig {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  metrics: ReportMetric[];
  dateRange: { start: Date; end: Date };
  format: ReportFormat;
  frequency: ReportFrequency;
  nextRun?: Date;
  emailRecipients: string[];
  includeCharts: boolean;
  includeSummary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedReport {
  id: string;
  configId: string;
  organizationId: string;
  generatedAt: Date;
  format: ReportFormat;
  fileSize: number;
  content: string;
  url?: string;
  emailSent: boolean;
}

export class ReportBuilderService {
  private static instance: ReportBuilderService;
  private configs: Map<string, ReportConfig> = new Map();
  private reports: Map<string, GeneratedReport> = new Map();
  private reportCounter = 0;

  private constructor() {}

  static getInstance(): ReportBuilderService {
    if (!ReportBuilderService.instance) {
      ReportBuilderService.instance = new ReportBuilderService();
    }
    return ReportBuilderService.instance;
  }

  static resetInstance(): void {
    ReportBuilderService.instance = new ReportBuilderService();
  }

  /**
   * Create new report configuration
   */
  createReportConfig(organizationId: string, config: Omit<ReportConfig, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): ReportConfig {
    const id = `report-${organizationId}-${Date.now()}`;
    const newConfig: ReportConfig = {
      ...config,
      id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.configs.set(id, newConfig);
    return newConfig;
  }

  /**
   * Get report configuration by ID
   */
  getReportConfig(configId: string): ReportConfig | undefined {
    return this.configs.get(configId);
  }

  /**
   * List all report configurations for organization
   */
  listReportConfigs(organizationId: string): ReportConfig[] {
    const configs = Array.from(this.configs.values()).filter(c => c.organizationId === organizationId);
    return configs;
  }

  /**
   * Update report configuration
   */
  updateReportConfig(configId: string, updates: Partial<Omit<ReportConfig, 'id' | 'organizationId' | 'createdAt'>>): ReportConfig | undefined {
    const config = this.configs.get(configId);
    if (!config) {
      return undefined;
    }

    const updated = { ...config, ...updates, updatedAt: new Date() };
    this.configs.set(configId, updated);
    return updated;
  }

  /**
   * Delete report configuration
   */
  deleteReportConfig(configId: string): boolean {
    return this.configs.delete(configId);
  }

  /**
   * Generate report from configuration
   */
  generateReport(configId: string, organizationId: string): GeneratedReport {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error('Report configuration not found');
    }

    const reportId = `report-gen-${organizationId}-${++this.reportCounter}`;

    // Generate mock report content based on format
    let content = '';
    switch (config.format) {
      case 'csv':
        content = this.generateCSVReport(config);
        break;
      case 'json':
        content = this.generateJSONReport(config);
        break;
      case 'html':
        content = this.generateHTMLReport(config);
        break;
      case 'pdf':
        content = this.generatePDFReport(config);
        break;
    }

    const report: GeneratedReport = {
      id: reportId,
      configId,
      organizationId,
      generatedAt: new Date(),
      format: config.format,
      fileSize: Buffer.byteLength(content),
      content,
      emailSent: false,
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Get generated report
   */
  getReport(reportId: string): GeneratedReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * List generated reports for configuration
   */
  listReports(configId: string, limit: number = 50): GeneratedReport[] {
    return Array.from(this.reports.values())
      .filter(r => r.configId === configId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Mark report as emailed
   */
  markReportEmailed(reportId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }
    report.emailSent = true;
    return true;
  }

  /**
   * Delete generated report
   */
  deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  /**
   * Get next scheduled reports
   */
  getNextScheduledReports(limit: number = 10): ReportConfig[] {
    return Array.from(this.configs.values())
      .filter(c => c.frequency !== 'once' && c.nextRun && c.nextRun <= new Date())
      .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * Update next run time for scheduled report
   */
  updateNextRun(configId: string, nextRun: Date): ReportConfig | undefined {
    return this.updateReportConfig(configId, { nextRun });
  }

  /**
   * Generate CSV report content
   */
  private generateCSVReport(config: ReportConfig): string {
    const headers = ['Metric', 'Value', 'Change', 'Date'];
    const rows = config.metrics.map(m => [m, '1234', '+5%', new Date().toISOString()]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Generate JSON report content
   */
  private generateJSONReport(config: ReportConfig): string {
    return JSON.stringify(
      {
        report: config.name,
        organization: config.organizationId,
        metrics: config.metrics,
        dateRange: config.dateRange,
        generatedAt: new Date().toISOString(),
        data: config.metrics.map(m => ({ metric: m, value: Math.floor(Math.random() * 10000) })),
      },
      null,
      2
    );
  }

  /**
   * Generate HTML report content
   */
  private generateHTMLReport(config: ReportConfig): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${config.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${config.name}</h1>
          <p>Generated: ${new Date().toISOString()}</p>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            ${config.metrics.map(m => `<tr><td>${m}</td><td>${Math.floor(Math.random() * 10000)}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Generate PDF report content (mock)
   */
  private generatePDFReport(config: ReportConfig): string {
    return `PDF Report: ${config.name}\nGenerated: ${new Date().toISOString()}\nMetrics: ${config.metrics.join(', ')}`;
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.configs.clear();
    this.reports.clear();
    this.reportCounter = 0;
  }

  /**
   * Get total configs count
   */
  getConfigCount(): number {
    return this.configs.size;
  }

  /**
   * Get total reports count
   */
  getReportCount(): number {
    return this.reports.size;
  }
}

export const reportBuilderService = ReportBuilderService.getInstance();
