import { PDFDocument, rgb } from 'pdf-lib';
import { createWriteStream } from 'fs';
import { join } from 'path';

export interface TrafficReport {
  websiteId: string;
  websiteName: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalVisits: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
  dailyData: Array<{
    date: string;
    visits: number;
    uniqueVisitors: number;
  }>;
  campaigns: Array<{
    name: string;
    visits: number;
    conversions: number;
    roi: number;
  }>;
}

/**
 * Service for generating PDF and CSV reports from traffic data
 */
export class ExportService {
  /**
   * Generate a PDF report from traffic data
   */
  static async generatePDFReport(report: TrafficReport): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { height } = page.getSize();
    let yPosition = height - 50;

    // Title
    page.drawText('Traffic Report', {
      x: 50,
      y: yPosition,
      size: 24,
      color: rgb(0.2, 0.4, 0.8),
    });
    yPosition -= 30;

    // Website name and date range
    page.drawText(`Website: ${report.websiteName}`, {
      x: 50,
      y: yPosition,
      size: 12,
    });
    yPosition -= 20;

    const dateRange = `${report.dateRange.start.toLocaleDateString()} - ${report.dateRange.end.toLocaleDateString()}`;
    page.drawText(`Period: ${dateRange}`, {
      x: 50,
      y: yPosition,
      size: 12,
    });
    yPosition -= 30;

    // Key metrics
    page.drawText('Key Metrics', {
      x: 50,
      y: yPosition,
      size: 14,
      color: rgb(0.2, 0.4, 0.8),
    });
    yPosition -= 20;

    const metrics = [
      `Total Visits: ${report.metrics.totalVisits.toLocaleString()}`,
      `Unique Visitors: ${report.metrics.uniqueVisitors.toLocaleString()}`,
      `Avg Session Duration: ${report.metrics.avgSessionDuration.toFixed(1)}s`,
      `Bounce Rate: ${report.metrics.bounceRate.toFixed(1)}%`,
      `Conversion Rate: ${report.metrics.conversionRate.toFixed(2)}%`,
    ];

    for (const metric of metrics) {
      page.drawText(metric, {
        x: 50,
        y: yPosition,
        size: 11,
      });
      yPosition -= 18;
    }

    yPosition -= 10;

    // Traffic sources
    page.drawText('Top Traffic Sources', {
      x: 50,
      y: yPosition,
      size: 14,
      color: rgb(0.2, 0.4, 0.8),
    });
    yPosition -= 20;

    for (const source of report.trafficSources.slice(0, 5)) {
      page.drawText(`${source.source}: ${source.visits} visits (${source.percentage.toFixed(1)}%)`, {
        x: 50,
        y: yPosition,
        size: 11,
      });
      yPosition -= 18;
    }

    // Convert to bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate a CSV report from traffic data
   */
  static generateCSVReport(report: TrafficReport): string {
    const lines: string[] = [];

    // Header
    lines.push('Traffic Report');
    lines.push(`Website,${report.websiteName}`);
    lines.push(`Date Range,"${report.dateRange.start.toLocaleDateString()} - ${report.dateRange.end.toLocaleDateString()}"`);
    lines.push('');

    // Summary metrics
    lines.push('Summary Metrics');
    lines.push('Metric,Value');
    lines.push(`Total Visits,${report.metrics.totalVisits}`);
    lines.push(`Unique Visitors,${report.metrics.uniqueVisitors}`);
    lines.push(`Avg Session Duration,${report.metrics.avgSessionDuration.toFixed(1)}`);
    lines.push(`Bounce Rate,${report.metrics.bounceRate.toFixed(1)}%`);
    lines.push(`Conversion Rate,${report.metrics.conversionRate.toFixed(2)}%`);
    lines.push('');

    // Daily data
    lines.push('Daily Traffic');
    lines.push('Date,Visits,Unique Visitors');
    for (const day of report.dailyData) {
      lines.push(`${day.date},${day.visits},${day.uniqueVisitors}`);
    }
    lines.push('');

    // Traffic sources
    lines.push('Traffic Sources');
    lines.push('Source,Visits,Percentage');
    for (const source of report.trafficSources) {
      lines.push(`${source.source},${source.visits},${source.percentage.toFixed(1)}%`);
    }
    lines.push('');

    // Campaigns
    lines.push('Campaign Performance');
    lines.push('Campaign,Visits,Conversions,ROI');
    for (const campaign of report.campaigns) {
      lines.push(`${campaign.name},${campaign.visits},${campaign.conversions},${campaign.roi.toFixed(2)}%`);
    }

    return lines.join('\n');
  }

  /**
   * Generate a JSON report (for API responses)
   */
  static generateJSONReport(report: TrafficReport): string {
    return JSON.stringify(report, null, 2);
  }
}
