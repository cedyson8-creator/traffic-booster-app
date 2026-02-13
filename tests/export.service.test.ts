import { describe, it, expect } from 'vitest';
import { ExportService, TrafficReport } from '../server/services/export.service';

// Mock traffic report for testing
const mockReport: TrafficReport = {
  websiteId: 'test-123',
  websiteName: 'Test Website',
  dateRange: {
    start: new Date('2026-02-01'),
    end: new Date('2026-02-13'),
  },
  metrics: {
    totalVisits: 10000,
    uniqueVisitors: 5000,
    avgSessionDuration: 120,
    bounceRate: 35.5,
    conversionRate: 2.5,
  },
  trafficSources: [
    { source: 'Google', visits: 5000, percentage: 50 },
    { source: 'Facebook', visits: 3000, percentage: 30 },
    { source: 'Direct', visits: 2000, percentage: 20 },
  ],
  dailyData: [
    { date: '2026-02-01', visits: 500, uniqueVisitors: 250 },
    { date: '2026-02-02', visits: 600, uniqueVisitors: 300 },
    { date: '2026-02-03', visits: 700, uniqueVisitors: 350 },
  ],
  campaigns: [
    { name: 'Spring Sale', visits: 3000, conversions: 75, roi: 150 },
    { name: 'Email Campaign', visits: 2000, conversions: 50, roi: 120 },
  ],
};

describe('ExportService', () => {
  describe('generatePDFReport', () => {
    it('should generate a PDF buffer from traffic report', async () => {
      const pdfBuffer = await ExportService.generatePDFReport(mockReport);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should have correct PDF structure', async () => {
      const pdfBuffer = await ExportService.generatePDFReport(mockReport);
      const pdfContent = pdfBuffer.toString('utf8');
      expect(pdfContent).toContain('/Type');
    });

    it('should have reasonable PDF size', async () => {
      const pdfBuffer = await ExportService.generatePDFReport(mockReport);
      expect(pdfBuffer.length).toBeGreaterThan(500);
      expect(pdfBuffer.length).toBeLessThan(1000000);
    });

    it('should be a valid PDF document', async () => {
      const pdfBuffer = await ExportService.generatePDFReport(mockReport);
      const pdfStart = pdfBuffer.toString('utf8', 0, 4);
      expect(pdfStart).toBe('%PDF');
    });
  });

  describe('generateCSVReport', () => {
    it('should generate a CSV string from traffic report', () => {
      const csvContent = ExportService.generateCSVReport(mockReport);

      expect(typeof csvContent).toBe('string');
      expect(csvContent.length).toBeGreaterThan(0);
    });

    it('should include report header in CSV', () => {
      const csvContent = ExportService.generateCSVReport(mockReport);

      expect(csvContent).toContain('Traffic Report');
      expect(csvContent).toContain('Test Website');
    });

    it('should include summary metrics in CSV', () => {
      const csvContent = ExportService.generateCSVReport(mockReport);

      expect(csvContent).toContain('Summary Metrics');
      expect(csvContent).toContain('Total Visits');
      expect(csvContent).toContain('10000');
    });

    it('should include daily traffic data in CSV', () => {
      const csvContent = ExportService.generateCSVReport(mockReport);

      expect(csvContent).toContain('Daily Traffic');
      expect(csvContent).toContain('2026-02-01');
      expect(csvContent).toContain('500');
    });

    it('should include traffic sources in CSV', () => {
      const csvContent = ExportService.generateCSVReport(mockReport);

      expect(csvContent).toContain('Traffic Sources');
      expect(csvContent).toContain('Google');
      expect(csvContent).toContain('Facebook');
    });

    it('should include campaign performance in CSV', () => {
      const csvContent = ExportService.generateCSVReport(mockReport);

      expect(csvContent).toContain('Campaign Performance');
      expect(csvContent).toContain('Spring Sale');
      expect(csvContent).toContain('Email Campaign');
    });

    it('should be properly formatted with commas', () => {
      const csvContent = ExportService.generateCSVReport(mockReport);
      const lines = csvContent.split('\n');

      // Check that lines contain comma-separated values
      const dataLines = lines.filter((line) => line.includes(','));
      expect(dataLines.length).toBeGreaterThan(0);
    });
  });

  describe('generateJSONReport', () => {
    it('should generate a JSON string from traffic report', () => {
      const jsonContent = ExportService.generateJSONReport(mockReport);

      expect(typeof jsonContent).toBe('string');
      expect(jsonContent.length).toBeGreaterThan(0);
    });

    it('should be valid JSON', () => {
      const jsonContent = ExportService.generateJSONReport(mockReport);

      expect(() => JSON.parse(jsonContent)).not.toThrow();
    });

    it('should include all report data in JSON', () => {
      const jsonContent = ExportService.generateJSONReport(mockReport);
      const parsed = JSON.parse(jsonContent);

      expect(parsed.websiteName).toBe('Test Website');
      expect(parsed.metrics.totalVisits).toBe(10000);
      expect(parsed.trafficSources.length).toBe(3);
      expect(parsed.campaigns.length).toBe(2);
    });

    it('should preserve data types in JSON', () => {
      const jsonContent = ExportService.generateJSONReport(mockReport);
      const parsed = JSON.parse(jsonContent);

      expect(typeof parsed.metrics.totalVisits).toBe('number');
      expect(typeof parsed.metrics.bounceRate).toBe('number');
      expect(Array.isArray(parsed.trafficSources)).toBe(true);
    });
  });
});
