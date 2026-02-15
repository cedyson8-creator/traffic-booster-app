import { Router, Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { PushNotificationsService } from '../services/push-notifications.service';
import { ExportSchedulerService } from '../services/export-scheduler.service';
import { NotificationsService } from '../services/notifications.service';

const router = Router();
const emailService = EmailService.getInstance();
const pushService = PushNotificationsService.getInstance();
const exportService = ExportSchedulerService.getInstance();
const notificationsService = NotificationsService.getInstance();

/**
 * POST /api/notifications/push/register
 * Register push token for user
 */
router.post('/push/register', async (req: Request, res: Response) => {
  try {
    const { userId, token, platform } = req.body;

    if (!userId || !token || !platform) {
      return res.status(400).json({
        error: 'Missing required fields: userId, token, platform',
      });
    }

    const pushToken = pushService.registerToken(userId, token, platform);

    return res.json({
      success: true,
      token: pushToken,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error registering push token:', errorMessage);

    return res.status(500).json({
      error: 'Failed to register push token',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/push/unregister
 * Unregister push token for user
 */
router.post('/push/unregister', async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        error: 'Missing required fields: userId, token',
      });
    }

    const success = pushService.unregisterToken(userId, token);

    return res.json({
      success,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error unregistering push token:', errorMessage);

    return res.status(500).json({
      error: 'Failed to unregister push token',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/email/send
 * Send email notification
 */
router.post('/email/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text, attachments } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html',
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      attachments,
    });

    return res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error sending email:', errorMessage);

    return res.status(500).json({
      error: 'Failed to send email',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/email/export
 * Send export report via email
 */
router.post('/email/export', async (req: Request, res: Response) => {
  try {
    const { email, format, reportName, reportContent, contentType } = req.body;

    if (!email || !format || !reportName || !reportContent) {
      return res.status(400).json({
        error: 'Missing required fields: email, format, reportName, reportContent',
      });
    }

    const result = await emailService.sendExportReport(
      email,
      format,
      reportName,
      Buffer.from(reportContent, 'base64'),
      contentType || 'application/octet-stream'
    );

    return res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error sending export email:', errorMessage);

    return res.status(500).json({
      error: 'Failed to send export email',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/push/send
 * Send push notification to user
 */
router.post('/push/send', async (req: Request, res: Response) => {
  try {
    const { userId, title, body, data, sound } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: userId, title, body',
      });
    }

    const result = await pushService.sendNotification(userId, {
      title,
      body,
      data,
      sound: sound || 'default',
    });

    return res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error sending push notification:', errorMessage);

    return res.status(500).json({
      error: 'Failed to send push notification',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/alerts/performance
 * Send performance alert via email and push
 */
router.post('/alerts/performance', async (req: Request, res: Response) => {
  try {
    const { userId, email, endpoint, metric, degradationPercent } = req.body;

    if (!userId || !email || !endpoint || !metric || !degradationPercent) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email, endpoint, metric, degradationPercent',
      });
    }

    // Send email
    const emailResult = await emailService.sendPerformanceAlert({
      email,
      metric: endpoint,
      value: metric,
      threshold: degradationPercent,
      timestamp: new Date().toISOString(),
    });

    // Send push notification
    const pushResult = await pushService.sendPerformanceAlert(
      userId,
      endpoint,
      metric,
      degradationPercent
    );

    // Log notification
    notificationsService.createNotification(
      userId,
      'performance_alert',
      'Performance Alert',
      `${metric} degraded by ${degradationPercent}% on ${endpoint}`,
      'high',
      { endpoint, metric, degradationPercent }
    );

    return res.json({
      success: emailResult.success && pushResult.success,
      email: emailResult,
      push: pushResult,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error sending performance alert:', errorMessage);

    return res.status(500).json({
      error: 'Failed to send performance alert',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/alerts/forecast
 * Send forecast warning via email and push
 */
router.post('/alerts/forecast', async (req: Request, res: Response) => {
  try {
    const { userId, email, predicted, threshold } = req.body;

    if (!userId || !email || !predicted || !threshold) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email, predicted, threshold',
      });
    }

    // Send email
    const emailResult = await emailService.sendForecastWarning({
      email,
      metric: 'forecast',
      forecastedValue: predicted,
      threshold,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    });

    // Send push notification
    const pushResult = await pushService.sendForecastWarning(userId, predicted, threshold);

    // Log notification
    notificationsService.createNotification(
      userId,
      'forecast_warning',
      'Forecast Warning',
      `Predicted usage (${predicted}) exceeds threshold (${threshold})`,
      'medium',
      { predicted, threshold }
    );

    return res.json({
      success: emailResult.success && pushResult.success,
      email: emailResult,
      push: pushResult,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error sending forecast warning:', errorMessage);

    return res.status(500).json({
      error: 'Failed to send forecast warning',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/alerts/optimization
 * Send optimization recommendation via email and push
 */
router.post('/alerts/optimization', async (req: Request, res: Response) => {
  try {
    const { userId, email, type, savings, description } = req.body;

    if (!userId || !email || !type || !savings) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email, type, savings',
      });
    }

    // Send email
    const emailResult = await emailService.sendOptimizationRecommendation({
      email,
      recommendation: type,
      potentialSavings: `$${savings}`,
      priority: 'medium',
      timestamp: new Date().toISOString(),
    });

    // Send push notification
    const pushResult = await pushService.sendOptimizationRecommendation(userId, type, savings);

    // Log notification
    notificationsService.createNotification(
      userId,
      'optimization_recommendation',
      'Optimization Opportunity',
      `${type} can save approximately $${savings}`,
      'low',
      { type, savings, description }
    );

    return res.json({
      success: emailResult.success && pushResult.success,
      email: emailResult,
      push: pushResult,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error sending optimization alert:', errorMessage);

    return res.status(500).json({
      error: 'Failed to send optimization alert',
      message: errorMessage,
    });
  }
});

/**
 * GET /api/notifications/history/:userId
 * Get notification history for user
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const notifications = notificationsService.getNotifications(
      parseInt(userId),
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error fetching notification history:', errorMessage);

    return res.status(500).json({
      error: 'Failed to fetch notification history',
      message: errorMessage,
    });
  }
});

/**
 * POST /api/notifications/preferences
 * Update user notification preferences
 */
router.post('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, preferences } = req.body;

    if (!userId || !preferences) {
      return res.status(400).json({
        error: 'Missing required fields: userId, preferences',
      });
    }

    notificationsService.setPreferences(userId, preferences);

    return res.json({
      success: true,
      message: 'Preferences updated',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error updating preferences:', errorMessage);

    return res.status(500).json({
      error: 'Failed to update preferences',
      message: errorMessage,
    });
  }
});

/**
 * GET /api/notifications/preferences/:userId
 * Get user notification preferences
 */
router.get('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const preferences = notificationsService.getPreferences(parseInt(userId));

    return res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error fetching preferences:', errorMessage);

    return res.status(500).json({
      error: 'Failed to fetch preferences',
      message: errorMessage,
    });
  }
});

/**
 * GET /api/notifications/status
 * Get notification service status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const emailConfigured = emailService.isEmailConfigured();

    return res.json({
      success: true,
      email: { configured: emailConfigured },
      push: { configured: true },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationsAPI] Error fetching status:', errorMessage);

    return res.status(500).json({
      error: 'Failed to fetch status',
      message: errorMessage,
    });
  }
});

export default router;
