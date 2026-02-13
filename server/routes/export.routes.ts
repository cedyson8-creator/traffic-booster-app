import { Router, Request, Response } from 'express';
import { ExportService, TrafficReport } from '../services/export.service';

const router = Router();

/**
 * POST /api/export/pdf
 * Generate and download a PDF traffic report
 */
router.post('/pdf', async (req: Request, res: Response) => {
  try {
    const report: TrafficReport = req.body;

    // Validate report data
    if (!report.websiteName || !report.metrics) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    // Generate PDF
    const pdfBuffer = await ExportService.generatePDFReport(report);

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
 * POST /api/export/csv
 * Generate and download a CSV traffic report
 */
router.post('/csv', async (req: Request, res: Response) => {
  try {
    const report: TrafficReport = req.body;

    // Validate report data
    if (!report.websiteName || !report.metrics) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    // Generate CSV
    const csvContent = ExportService.generateCSVReport(report);

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
 * POST /api/export/json
 * Generate and download a JSON traffic report
 */
router.post('/json', async (req: Request, res: Response) => {
  try {
    const report: TrafficReport = req.body;

    // Validate report data
    if (!report.websiteName || !report.metrics) {
      return res.status(400).json({ error: 'Invalid report data' });
    }

    // Generate JSON
    const jsonContent = ExportService.generateJSONReport(report);

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

export default router;
