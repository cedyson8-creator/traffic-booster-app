import { Router, Request, Response } from 'express';
import { ExportService, TrafficReport, ExportOptions } from '../services/export.service';
import { TrafficDataService } from '../services/traffic-data.service';

const router = Router();

/**
 * POST /api/export/pdf
 * Generate and download a PDF traffic report
 */
router.post('/pdf', async (req: Request, res: Response) => {
  try {
    const { report, options } = req.body;

    // Validate report data
    if (!report || !report.websiteName || !report.metrics) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    // Generate PDF with optional custom metrics
    const pdfBuffer = await ExportService.generatePDFReport(report, options as ExportOptions);

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

/**
 * POST /api/export/pdf-real
 * Generate PDF with real traffic data from integrations
 */
router.post('/pdf-real', async (req: Request, res: Response) => {
  try {
    const { userId, websiteId, metrics, dateRange } = req.body;

    // Validate required parameters
    if (!userId || !websiteId || !dateRange) {
      return res.status(400).json({ error: 'Missing required parameters: userId, websiteId, dateRange' });
    }

    // Fetch real traffic data from integrations
    const report = await TrafficDataService.fetchRealTrafficData(
      userId,
      websiteId,
      {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    );

    if (!report) {
      return res.status(404).json({ error: 'No traffic data available for this website' });
    }

    // Generate PDF with selected metrics
    const options: ExportOptions = { metrics };
    const pdfBuffer = await ExportService.generatePDFReport(report, options);

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF real data export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report with real data' });
  }
});

/**
 * POST /api/export/pdf-custom
 * Generate PDF with custom metric selection
 */
router.post('/pdf-custom', async (req: Request, res: Response) => {
  try {
    const { report, metrics, format } = req.body;

    // Validate report data
    if (!report || !report.websiteName || !metrics) {
      return res.status(400).json({ error: 'Invalid report data or metrics' });
    }

    // Generate PDF with selected metrics
    const options: ExportOptions = { metrics };
    const pdfBuffer = await ExportService.generatePDFReport(report, options);

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF custom export error:', error);
    res.status(500).json({ error: 'Failed to generate custom PDF report' });
  }
});

/**
 * POST /api/export/csv
 * Generate and download a CSV traffic report
 */
router.post('/csv', async (req: Request, res: Response) => {
  try {
    const { report, options } = req.body;

    // Validate report data
    if (!report || !report.websiteName || !report.metrics) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    // Generate CSV with optional custom metrics
    const csvContent = ExportService.generateCSVReport(report, options as ExportOptions);

    // Send as downloadable file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

/**
 * POST /api/export/csv-real
 * Generate CSV with real traffic data from integrations
 */
router.post('/csv-real', async (req: Request, res: Response) => {
  try {
    const { userId, websiteId, metrics, dateRange } = req.body;

    // Validate required parameters
    if (!userId || !websiteId || !dateRange) {
      return res.status(400).json({ error: 'Missing required parameters: userId, websiteId, dateRange' });
    }

    // Fetch real traffic data from integrations
    const report = await TrafficDataService.fetchRealTrafficData(
      userId,
      websiteId,
      {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    );

    if (!report) {
      return res.status(404).json({ error: 'No traffic data available for this website' });
    }

    // Generate CSV with selected metrics
    const options: ExportOptions = { metrics };
    const csvContent = ExportService.generateCSVReport(report, options);

    // Send as downloadable file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error('CSV real data export error:', error);
    res.status(500).json({ error: 'Failed to generate CSV report with real data' });
  }
});

/**
 * POST /api/export/csv-custom
 * Generate CSV with custom metric selection
 */
router.post('/csv-custom', async (req: Request, res: Response) => {
  try {
    const { report, metrics } = req.body;

    // Validate report data
    if (!report || !report.websiteName || !metrics) {
      return res.status(400).json({ error: 'Invalid report data or metrics' });
    }

    // Generate CSV with selected metrics
    const options: ExportOptions = { metrics };
    const csvContent = ExportService.generateCSVReport(report, options);

    // Send as downloadable file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error('CSV custom export error:', error);
    res.status(500).json({ error: 'Failed to generate custom CSV report' });
  }
});

/**
 * POST /api/export/json
 * Generate and download a JSON traffic report
 */
router.post('/json', async (req: Request, res: Response) => {
  try {
    const { report, options } = req.body;

    // Validate report data
    if (!report || !report.websiteName || !report.metrics) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    // Generate JSON with optional custom metrics
    const jsonContent = ExportService.generateJSONReport(report, options as ExportOptions);

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.send(jsonContent);
  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({ error: 'Failed to generate JSON report' });
  }
});

/**
 * POST /api/export/json-real
 * Generate JSON with real traffic data from integrations
 */
router.post('/json-real', async (req: Request, res: Response) => {
  try {
    const { userId, websiteId, metrics, dateRange } = req.body;

    // Validate required parameters
    if (!userId || !websiteId || !dateRange) {
      return res.status(400).json({ error: 'Missing required parameters: userId, websiteId, dateRange' });
    }

    // Fetch real traffic data from integrations
    const report = await TrafficDataService.fetchRealTrafficData(
      userId,
      websiteId,
      {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      }
    );

    if (!report) {
      return res.status(404).json({ error: 'No traffic data available for this website' });
    }

    // Generate JSON with selected metrics
    const options: ExportOptions = { metrics };
    const jsonContent = ExportService.generateJSONReport(report, options);

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.send(jsonContent);
  } catch (error) {
    console.error('JSON real data export error:', error);
    res.status(500).json({ error: 'Failed to generate JSON report with real data' });
  }
});

/**
 * POST /api/export/json-custom
 * Generate JSON with custom metric selection
 */
router.post('/json-custom', async (req: Request, res: Response) => {
  try {
    const { report, metrics } = req.body;

    // Validate report data
    if (!report || !report.websiteName || !metrics) {
      return res.status(400).json({ error: 'Invalid report data or metrics' });
    }

    // Generate JSON with selected metrics
    const options: ExportOptions = { metrics };
    const jsonContent = ExportService.generateJSONReport(report, options);

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="traffic-report-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.send(jsonContent);
  } catch (error) {
    console.error('JSON custom export error:', error);
    res.status(500).json({ error: 'Failed to generate custom JSON report' });
  }
});

export default router;
