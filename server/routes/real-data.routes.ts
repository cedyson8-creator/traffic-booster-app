import { Router } from 'express';
import { RealDataIntegrationService } from '../services/real-data-integration.service';

export function createRealDataRoutes(): Router {
  const router = Router();
  const realDataService = new RealDataIntegrationService();

  /**
   * GET /api/real-data/status
   * Get integration status
   */
  router.get('/status', (req, res) => {
    const status = {
      googleAnalyticsConfigured: realDataService.isGoogleAnalyticsConfigured(),
      metaAdsConfigured: realDataService.isMetaAdsConfigured(),
    };
    return res.json(status);
  });

  /**
   * GET /api/real-data/google-analytics
   * Fetch Google Analytics traffic data
   */
  router.get('/google-analytics', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const data = await realDataService.fetchGoogleAnalyticsMetrics(
        String(startDate),
        String(endDate)
      );

      return res.json({
        success: true,
        data,
        configured: realDataService.isGoogleAnalyticsConfigured(),
      });
    } catch (error) {
      console.error('[RealData] Error fetching Google Analytics data:', error);
      return res.status(500).json({ error: 'Failed to fetch Google Analytics data' });
    }
  });

  /**
   * GET /api/real-data/meta-campaigns
   * Fetch Meta Ads campaign data
   */
  router.get('/meta-campaigns', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const data = await realDataService.fetchMetaAdsMetrics();

      return res.json({
        success: true,
        data,
        configured: realDataService.isMetaAdsConfigured(),
      });
    } catch (error) {
      console.error('[RealData] Error fetching Meta Ads data:', error);
      return res.status(500).json({ error: 'Failed to fetch Meta Ads data' });
    }
  });

  return router;
}
