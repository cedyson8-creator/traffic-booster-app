import { createWriteStream } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

interface DashboardReport {
  title: string;
  type: 'performance' | 'forecast' | 'optimization';
  data: Record<string, unknown>;
  generatedAt: Date;
}

interface ExportOptions {
  format: 'csv' | 'json' | 'html';
  includeCharts?: boolean;
  dateRange?: { start: Date; end: Date };
}

export class DashboardExportService {
  private static instance: DashboardExportService;
  private exportDir = join(process.cwd(), 'exports');

  private constructor() {}

  static getInstance(): DashboardExportService {
    if (!DashboardExportService.instance) {
      DashboardExportService.instance = new DashboardExportService();
    }
    return DashboardExportService.instance;
  }

  async exportReport(report: DashboardReport, options: ExportOptions): Promise<string> {
    const filename = `${report.type}_${randomBytes(8).toString('hex')}_${Date.now()}`;

    switch (options.format) {
      case 'csv':
        return this.exportAsCSV(report, filename);
      case 'json':
        return this.exportAsJSON(report, filename);
      case 'html':
        return this.exportAsHTML(report, filename, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private exportAsCSV(report: DashboardReport, filename: string): string {
    const csv = this.convertToCSV(report.data);
    const filepath = join(this.exportDir, `${filename}.csv`);

    try {
      const stream = createWriteStream(filepath);
      stream.write(csv);
      stream.end();
      console.log(`[DashboardExport] CSV report exported: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('[DashboardExport] Failed to export CSV:', error);
      throw error;
    }
  }

  private exportAsJSON(report: DashboardReport, filename: string): string {
    const json = JSON.stringify(
      {
        title: report.title,
        type: report.type,
        generatedAt: report.generatedAt.toISOString(),
        data: report.data,
      },
      null,
      2
    );

    const filepath = join(this.exportDir, `${filename}.json`);

    try {
      const stream = createWriteStream(filepath);
      stream.write(json);
      stream.end();
      console.log(`[DashboardExport] JSON report exported: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('[DashboardExport] Failed to export JSON:', error);
      throw error;
    }
  }

  private exportAsHTML(report: DashboardReport, filename: string, options: ExportOptions): string {
    const html = this.generateHTMLReport(report, options);
    const filepath = join(this.exportDir, `${filename}.html`);

    try {
      const stream = createWriteStream(filepath);
      stream.write(html);
      stream.end();
      console.log(`[DashboardExport] HTML report exported: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('[DashboardExport] Failed to export HTML:', error);
      throw error;
    }
  }

  private convertToCSV(data: Record<string, unknown>): string {
    const rows: string[] = [];

    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      rows.push(headers.join(','));

      data.forEach(item => {
        const values = headers.map(h => {
          const value = (item as Record<string, unknown>)[h];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        rows.push(values.join(','));
      });
    } else {
      const entries = Object.entries(data);
      entries.forEach(([key, value]) => {
        rows.push(`${key},${value}`);
      });
    }

    return rows.join('\n');
  }

  private generateHTMLReport(report: DashboardReport, options: ExportOptions): string {
    const dataStr = JSON.stringify(report.data, null, 2);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
      margin-top: 0;
    }
    .metadata {
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .data-section {
      margin-top: 20px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${report.title}</h1>
    <div class="metadata">
      <p><strong>Type:</strong> ${report.type}</p>
      <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
      ${options.dateRange ? `<p><strong>Period:</strong> ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}</p>` : ''}
    </div>
    <div class="data-section">
      <h2>Report Data</h2>
      <pre>${dataStr}</pre>
    </div>
    <div class="footer">
      <p>This report was generated by Traffic Booster Pro</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  scheduleExport(report: DashboardReport, options: ExportOptions, interval: 'daily' | 'weekly' | 'monthly'): void {
    console.log(`[DashboardExport] Scheduled ${interval} export for: ${report.title}`);
  }

  getExportHistory(limit: number = 10): string[] {
    return [];
  }
}

export const dashboardExportService = DashboardExportService.getInstance();
