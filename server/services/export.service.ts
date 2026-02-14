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

export interface ExportOptions {
  metrics?: string[];
  dateRange?: { start: string; end: string };
  websiteName?: string;
  includeCharts?: boolean;
}

/**
 * Service for generating PDF and CSV reports from traffic data
 */
export class ExportService {
  /**
   * Filter report data based on selected metrics
   */
  private static filterReportByMetrics(report: TrafficReport, selectedMetrics?: string[]): TrafficReport {
    if (!selectedMetrics || selectedMetrics.length === 0) {
      return report;
    }

    const filtered = { ...report };

    // Map metric IDs to report properties
    const metricMap: Record<string, boolean> = {};
    selectedMetrics.forEach((metric) => {
      metricMap[metric] = true;
    });

    // Filter metrics object based on selection
    const filteredMetrics = { ...report.metrics };
    if (!metricMap['total_visits']) delete (filteredMetrics as any).totalVisits;
    if (!metricMap['unique_visitors']) delete (filteredMetrics as any).uniqueVisitors;
    if (!metricMap['avg_session_duration']) delete (filteredMetrics as any).avgSessionDuration;
    if (!metricMap['bounce_rate']) delete (filteredMetrics as any).bounceRate;
    if (!metricMap['conversion_rate']) delete (filteredMetrics as any).conversionRate;

    filtered.metrics = filteredMetrics as any;

    // Filter traffic sources if not selected
    if (!metricMap['organic_traffic'] && !metricMap['direct_traffic'] && !metricMap['referral_traffic'] && !metricMap['social_traffic']) {
      filtered.trafficSources = [];
    }

    // Filter campaigns if not selected
    if (!metricMap['active_campaigns'] && !metricMap['campaign_roi'] && !metricMap['campaign_performance']) {
      filtered.campaigns = [];
    }

    // Filter daily data if not selected
    if (!metricMap['total_visits'] && !metricMap['unique_visitors']) {
      filtered.dailyData = [];
    }

    return filtered;
  }
  /**
   * Generate a PDF report from traffic data
   */
  static async generatePDFReport(report: TrafficReport, options?: ExportOptions): Promise<Buffer> {
    const filteredReport = this.filterReportByMetrics(report, options?.metrics);
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
    page.drawText(`Website: ${filteredReport.websiteName}`, {
      x: 50,
      y: yPosition,
      size: 12,
    });
    yPosition -= 20;

    const dateRange = `${filteredReport.dateRange.start.toLocaleDateString()} - ${filteredReport.dateRange.end.toLocaleDateString()}`;
    page.drawText(`Period: ${dateRange}`, {
      x: 50,
      y: yPosition,
      size: 12,
    });
    yPosition -= 30;

    // Key metrics
    if (Object.keys(filteredReport.metrics).length > 0) {
      page.drawText('Key Metrics', {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0.2, 0.4, 0.8),
      });
      yPosition -= 20;

      const metrics: string[] = [];
      if ((filteredReport.metrics as any).totalVisits) {
        metrics.push(`Total Visits: ${(filteredReport.metrics as any).totalVisits.toLocaleString()}`);
      }
      if ((filteredReport.metrics as any).uniqueVisitors) {
        metrics.push(`Unique Visitors: ${(filteredReport.metrics as any).uniqueVisitors.toLocaleString()}`);
      }
      if ((filteredReport.metrics as any).avgSessionDuration) {
        metrics.push(`Avg Session Duration: ${(filteredReport.metrics as any).avgSessionDuration.toFixed(1)}s`);
      }
      if ((filteredReport.metrics as any).bounceRate) {
        metrics.push(`Bounce Rate: ${(filteredReport.metrics as any).bounceRate.toFixed(1)}%`);
      }
      if ((filteredReport.metrics as any).conversionRate) {
        metrics.push(`Conversion Rate: ${(filteredReport.metrics as any).conversionRate.toFixed(2)}%`);
      }

      for (const metric of metrics) {
        page.drawText(metric, {
          x: 50,
          y: yPosition,
          size: 11,
        });
        yPosition -= 18;
      }

      yPosition -= 10;
    }

    // Traffic sources
    if (filteredReport.trafficSources.length > 0) {
      page.drawText('Top Traffic Sources', {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0.2, 0.4, 0.8),
      });
      yPosition -= 20;

      for (const source of filteredReport.trafficSources.slice(0, 5)) {
        page.drawText(`${source.source}: ${source.visits} visits (${source.percentage.toFixed(1)}%)`, {
          x: 50,
          y: yPosition,
          size: 11,
        });
        yPosition -= 18;
      }

      yPosition -= 10;
    }

    // Campaigns
    if (filteredReport.campaigns.length > 0) {
      page.drawText('Campaign Performance', {
        x: 50,
        y: yPosition,
        size: 14,
        color: rgb(0.2, 0.4, 0.8),
      });
      yPosition -= 20;

      for (const campaign of filteredReport.campaigns.slice(0, 5)) {
        page.drawText(`${campaign.name}: ${campaign.visits} visits, ${campaign.conversions} conversions (ROI: ${campaign.roi.toFixed(2)}%)`, {
          x: 50,
          y: yPosition,
          size: 11,
        });
        yPosition -= 18;
      }
    }

    // Convert to bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate a CSV report from traffic data
   */
  static generateCSVReport(report: TrafficReport, options?: ExportOptions): string {
    const filteredReport = this.filterReportByMetrics(report, options?.metrics);
    const lines: string[] = [];

    // Header
    lines.push('Traffic Report');
    lines.push(`Website,${filteredReport.websiteName}`);
    lines.push(`Date Range,"${filteredReport.dateRange.start.toLocaleDateString()} - ${filteredReport.dateRange.end.toLocaleDateString()}"`);
    lines.push('');

    // Summary metrics
    if (Object.keys(filteredReport.metrics).length > 0) {
      lines.push('Summary Metrics');
      lines.push('Metric,Value');
      if ((filteredReport.metrics as any).totalVisits) {
        lines.push(`Total Visits,${(filteredReport.metrics as any).totalVisits}`);
      }
      if ((filteredReport.metrics as any).uniqueVisitors) {
        lines.push(`Unique Visitors,${(filteredReport.metrics as any).uniqueVisitors}`);
      }
      if ((filteredReport.metrics as any).avgSessionDuration) {
        lines.push(`Avg Session Duration,${(filteredReport.metrics as any).avgSessionDuration.toFixed(1)}`);
      }
      if ((filteredReport.metrics as any).bounceRate) {
        lines.push(`Bounce Rate,${(filteredReport.metrics as any).bounceRate.toFixed(1)}%`);
      }
      if ((filteredReport.metrics as any).conversionRate) {
        lines.push(`Conversion Rate,${(filteredReport.metrics as any).conversionRate.toFixed(2)}%`);
      }
      lines.push('');
    }

    // Daily data
    if (filteredReport.dailyData.length > 0) {
      lines.push('Daily Traffic');
      lines.push('Date,Visits,Unique Visitors');
      for (const day of filteredReport.dailyData) {
        lines.push(`${day.date},${day.visits},${day.uniqueVisitors}`);
      }
      lines.push('');
    }

    // Traffic sources
    if (filteredReport.trafficSources.length > 0) {
      lines.push('Traffic Sources');
      lines.push('Source,Visits,Percentage');
      for (const source of filteredReport.trafficSources) {
        lines.push(`${source.source},${source.visits},${source.percentage.toFixed(1)}%`);
      }
      lines.push('');
    }

    // Campaigns
    if (filteredReport.campaigns.length > 0) {
      lines.push('Campaign Performance');
      lines.push('Campaign,Visits,Conversions,ROI');
      for (const campaign of filteredReport.campaigns) {
        lines.push(`${campaign.name},${campaign.visits},${campaign.conversions},${campaign.roi.toFixed(2)}%`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate a JSON report (for API responses)
   */
  static generateJSONReport(report: TrafficReport, options?: ExportOptions): string {
    const filteredReport = this.filterReportByMetrics(report, options?.metrics);
    return JSON.stringify(filteredReport, null, 2);
  }
}
