import { Router } from 'express';
import { EmailService } from '../services/email.service';
import { PushNotificationsService } from '../services/push-notifications.service';
import { EmailTestingService } from '../services/email-testing.service';

export function createEmailTestingRoutes(
  emailService: EmailService,
  pushService: PushNotificationsService
): Router {
  const router = Router();
  const emailTestingService = new EmailTestingService(emailService, pushService);

  /**
   * GET /api/email-testing/status
   * Get email delivery status
   */
  router.get('/status', (req, res) => {
    const status = emailTestingService.getEmailStatus();
    return res.json(status);
  });

  /**
   * POST /api/email-testing/send-test
   * Send a test email
   */
  router.post('/send-test', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      const result = await emailTestingService.sendTestEmail(email);
      return res.json(result);
    } catch (error) {
      console.error('[EmailTesting] Error sending test email:', error);
      return res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  /**
   * POST /api/email-testing/send-performance-alert
   * Send a test performance alert email
   */
  router.post('/send-performance-alert', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      const result = await emailTestingService.sendTestPerformanceAlert(email);
      return res.json(result);
    } catch (error) {
      console.error('[EmailTesting] Error sending performance alert:', error);
      return res.status(500).json({ error: 'Failed to send performance alert' });
    }
  });

  /**
   * POST /api/email-testing/send-forecast-warning
   * Send a test forecast warning email
   */
  router.post('/send-forecast-warning', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      const result = await emailTestingService.sendTestForecastWarning(email);
      return res.json(result);
    } catch (error) {
      console.error('[EmailTesting] Error sending forecast warning:', error);
      return res.status(500).json({ error: 'Failed to send forecast warning' });
    }
  });

  /**
   * POST /api/email-testing/send-optimization-recommendation
   * Send a test optimization recommendation email
   */
  router.post('/send-optimization-recommendation', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      const result = await emailTestingService.sendTestOptimizationRecommendation(email);
      return res.json(result);
    } catch (error) {
      console.error('[EmailTesting] Error sending optimization recommendation:', error);
      return res.status(500).json({ error: 'Failed to send optimization recommendation' });
    }
  });

  /**
   * POST /api/email-testing/send-all
   * Send all test emails
   */
  router.post('/send-all', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      const results = await emailTestingService.sendAllTestEmails(email);
      return res.json(results);
    } catch (error) {
      console.error('[EmailTesting] Error sending all test emails:', error);
      return res.status(500).json({ error: 'Failed to send test emails' });
    }
  });

  return router;
}
