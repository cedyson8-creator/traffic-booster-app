import { describe, it, expect, beforeEach } from 'vitest';
import { ExportService, ExportOptions, TrafficReport } from '../export.service';

describe('Report Builder - Custom Metrics', () => {
  let mockReport: TrafficReport;

  beforeEach(() => {
    mockReport = {
      websiteId: 'test-site-1',
      websiteName: 'Test Website',
      dateRange: {
        start: new Date('2026-02-01'),
        end: new Date('2026-02-14'),
      },
      metrics: {
        totalVisits: 45230,
        uniqueVisitors: 28900,
        avgSessionDuration: 222,
        bounceRate: 42.3,
        conversionRate: 3.8,
      },
      trafficSources: [
        { source: 'Organic', visits: 18450, percentage: 40.8 },
        { source: 'Direct', visits: 12340, percentage: 27.3 },
        { source: 'Referral', visits: 8920, percentage: 19.7 },
        { source: 'Social', visits: 5520, percentage: 12.2 },
      ],
      dailyData: [
        { date: '2026-02-01', visits: 1200, uniqueVisitors: 850 },
        { date: '2026-02-02', visits: 1450, uniqueVisitors: 920 },
        { date: '2026-02-03', visits: 1380, uniqueVisitors: 890 },
      ],
      campaigns: [
        { name: 'Spring Sale', visits: 5200, conversions: 156, roi: 245 },
        { name: 'Email Campaign', visits: 3100, conversions: 93, roi: 180 },
      ],
    };
  });

  describe('PDF Export with Custom Metrics', () => {
    it('should generate PDF with selected metrics only', async () => {
      const options: ExportOptions = {
        metrics: ['total_visits', 'unique_visitors', 'conversion_rate'],
      };

      const pdf = await ExportService.generatePDFReport(mockReport, options);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should generate PDF with all metrics when none specified', async () => {
      const pdf = await ExportService.generatePDFReport(mockReport);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should generate PDF with campaign metrics only', async () => {
      const options: ExportOptions = {
        metrics: ['active_campaigns', 'campaign_roi', 'campaign_performance'],
      };

      const pdf = await ExportService.generatePDFReport(mockReport, options);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should generate PDF with traffic source metrics only', async () => {
      const options: ExportOptions = {
        metrics: ['organic_traffic', 'direct_traffic', 'social_traffic'],
      };

      const pdf = await ExportService.generatePDFReport(mockReport, options);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should handle empty metric selection gracefully', async () => {
      const options: ExportOptions = {
        metrics: [],
      };

      const pdf = await ExportService.generatePDFReport(mockReport, options);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });
  });

  describe('CSV Export with Custom Metrics', () => {
    it('should generate CSV with selected metrics only', () => {
      const options: ExportOptions = {
        metrics: ['total_visits', 'unique_visitors'],
      };

      const csv = ExportService.generateCSVReport(mockReport, options);

      expect(csv).toContain('Traffic Report');
      expect(csv).toContain('Test Website');
      expect(csv).toContain('Total Visits');
      expect(csv).toContain('Unique Visitors');
    });

    it('should not include unselected metrics in CSV', () => {
      const options: ExportOptions = {
        metrics: ['total_visits'],
      };

      const csv = ExportService.generateCSVReport(mockReport, options);

      expect(csv).toContain('Total Visits');
      expect(csv).not.toContain('Campaign Performance');
    });

    it('should generate CSV with campaign metrics', () => {
      const options: ExportOptions = {
        metrics: ['active_campaigns', 'campaign_roi'],
      };

      const csv = ExportService.generateCSVReport(mockReport, options);

      expect(csv).toContain('Campaign Performance');
      expect(csv).toContain('Spring Sale');
    });

    it('should generate CSV with traffic source metrics', () => {
      const options: ExportOptions = {
        metrics: ['organic_traffic', 'direct_traffic'],
      };

      const csv = ExportService.generateCSVReport(mockReport, options);

      expect(csv).toContain('Traffic Sources');
      expect(csv).toContain('Organic');
      expect(csv).toContain('Direct');
    });

    it('should handle empty metric selection', () => {
      const options: ExportOptions = {
        metrics: [],
      };

      const csv = ExportService.generateCSVReport(mockReport, options);

      expect(csv).toContain('Traffic Report');
      expect(csv).toContain('Test Website');
    });
  });

  describe('JSON Export with Custom Metrics', () => {
    it('should generate JSON with selected metrics only', () => {
      const options: ExportOptions = {
        metrics: ['total_visits', 'unique_visitors'],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.metrics.totalVisits).toBeDefined();
      expect(parsed.metrics.uniqueVisitors).toBeDefined();
      expect(parsed.metrics.bounceRate).toBeUndefined();
    });

    it('should generate JSON with all metrics when none specified', () => {
      const json = ExportService.generateJSONReport(mockReport);
      const parsed = JSON.parse(json);

      expect(parsed.metrics.totalVisits).toBeDefined();
      expect(parsed.metrics.uniqueVisitors).toBeDefined();
      expect(parsed.metrics.bounceRate).toBeDefined();
    });

    it('should exclude traffic sources when not selected', () => {
      const options: ExportOptions = {
        metrics: ['total_visits'],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.trafficSources).toEqual([]);
    });

    it('should exclude campaigns when not selected', () => {
      const options: ExportOptions = {
        metrics: ['total_visits'],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.campaigns).toEqual([]);
    });

    it('should exclude daily data when not selected', () => {
      const options: ExportOptions = {
        metrics: ['bounce_rate', 'conversion_rate'],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.dailyData).toEqual([]);
    });
  });

  describe('Metric Filtering Logic', () => {
    it('should handle overview metrics correctly', () => {
      const options: ExportOptions = {
        metrics: [
          'total_visits',
          'unique_visitors',
          'avg_session_duration',
          'bounce_rate',
          'growth_rate',
        ],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.metrics.totalVisits).toBeDefined();
      expect(parsed.metrics.uniqueVisitors).toBeDefined();
      expect(parsed.metrics.avgSessionDuration).toBeDefined();
      expect(parsed.metrics.bounceRate).toBeDefined();
      expect(parsed.metrics.conversionRate).toBeUndefined();
    });

    it('should handle performance metrics correctly', () => {
      const options: ExportOptions = {
        metrics: [
          'avg_session_duration',
          'bounce_rate',
          'conversion_rate',
          'avg_pages_per_session',
          'return_visitor_rate',
        ],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.metrics.bounceRate).toBeDefined();
      expect(parsed.metrics.conversionRate).toBeDefined();
      expect(parsed.metrics.totalVisits).toBeUndefined();
    });

    it('should handle source metrics correctly', () => {
      const options: ExportOptions = {
        metrics: ['organic_traffic', 'direct_traffic', 'referral_traffic', 'social_traffic'],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.trafficSources.length).toBeGreaterThan(0);
      expect(parsed.campaigns).toEqual([]);
    });

    it('should handle campaign metrics correctly', () => {
      const options: ExportOptions = {
        metrics: ['active_campaigns', 'campaign_roi', 'campaign_performance'],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed.campaigns.length).toBeGreaterThan(0);
      expect(parsed.trafficSources).toEqual([]);
    });
  });

  describe('Export Options', () => {
    it('should accept custom date range in options', () => {
      const options: ExportOptions = {
        metrics: ['total_visits'],
        dateRange: { start: '2026-02-01', end: '2026-02-14' },
      };

      const csv = ExportService.generateCSVReport(mockReport, options);

      expect(csv).toContain('2026-02-01');
    });

    it('should accept custom website name in options', () => {
      const options: ExportOptions = {
        metrics: ['total_visits'],
        websiteName: 'Custom Site Name',
      };

      const csv = ExportService.generateCSVReport(mockReport, options);

      expect(csv).toContain('Test Website'); // Uses report data, not options
    });

    it('should handle includeCharts option', () => {
      const options: ExportOptions = {
        metrics: ['total_visits'],
        includeCharts: true,
      };

      const pdf = ExportService.generatePDFReport(mockReport, options);

      expect(pdf).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle report with no campaigns', () => {
      const reportNoCampaigns = { ...mockReport, campaigns: [] };
      const options: ExportOptions = {
        metrics: ['active_campaigns', 'campaign_roi'],
      };

      const csv = ExportService.generateCSVReport(reportNoCampaigns, options);

      expect(csv).toContain('Traffic Report');
      expect(csv).not.toContain('Campaign Performance');
    });

    it('should handle report with no traffic sources', () => {
      const reportNoSources = { ...mockReport, trafficSources: [] };
      const options: ExportOptions = {
        metrics: ['organic_traffic', 'direct_traffic'],
      };

      const csv = ExportService.generateCSVReport(reportNoSources, options);

      expect(csv).toContain('Traffic Report');
      expect(csv).not.toContain('Traffic Sources');
    });

    it('should handle report with no daily data', () => {
      const reportNoDailyData = { ...mockReport, dailyData: [] };
      const options: ExportOptions = {
        metrics: ['total_visits'],
      };

      const csv = ExportService.generateCSVReport(reportNoDailyData, options);

      expect(csv).toContain('Traffic Report');
      expect(csv).not.toContain('Daily Traffic');
    });

    it('should handle very large metric selections', () => {
      const options: ExportOptions = {
        metrics: [
          'total_visits',
          'unique_visitors',
          'avg_session_duration',
          'bounce_rate',
          'growth_rate',
          'conversion_rate',
          'avg_pages_per_session',
          'return_visitor_rate',
          'organic_traffic',
          'direct_traffic',
          'referral_traffic',
          'social_traffic',
          'active_campaigns',
          'campaign_roi',
          'campaign_performance',
        ],
      };

      const json = ExportService.generateJSONReport(mockReport, options);
      const parsed = JSON.parse(json);

      expect(parsed).toBeDefined();
      expect(parsed.metrics).toBeDefined();
      expect(parsed.trafficSources.length).toBeGreaterThan(0);
      expect(parsed.campaigns.length).toBeGreaterThan(0);
    });
  });
});
