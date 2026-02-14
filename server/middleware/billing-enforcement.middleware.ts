import { Request, Response, NextFunction } from 'express';
import { StripePaymentService } from '@/server/services/stripe-payment.service';
import { FeatureGatingService } from '@/server/services/feature-gating.service';

/**
 * Billing Enforcement Middleware
 * Checks usage limits and enforces billing constraints
 */

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userFeatures?: any;
    }
  }
}

/**
 * Middleware to check usage limits before allowing operations
 */
export async function enforceBillingLimits(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's feature access
    const features = await FeatureGatingService.getUserFeatureAccess(userId);
    req.userFeatures = features;

    // Check usage limits
    const usageLimits = await StripePaymentService.checkUsageLimits(userId);

    if (usageLimits?.exceeded) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        limits: usageLimits.limits,
        message: 'You have exceeded your usage limits. Please upgrade your plan or wait for the next billing period.',
      });
    }

    return next();
  } catch (error) {
    console.error('[BillingEnforcement] Error enforcing billing limits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if user can create websites
 */
export async function checkWebsiteCreationLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's current website count
    // Note: This would need to be fetched from the database
    const currentWebsiteCount = 0; // Placeholder

    const canCreate = await FeatureGatingService.canCreateWebsite(userId, currentWebsiteCount);

    if (!canCreate) {
      return res.status(403).json({
        error: 'Website limit exceeded',
        message: `You have reached the maximum number of websites for your plan. Please upgrade to create more websites.`,
      });
    }

    return next();
  } catch (error) {
    console.error('[BillingEnforcement] Error checking website creation limit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if user can create scheduled reports
 */
export async function checkScheduleCreationLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's current schedule count
    // Note: This would need to be fetched from the database
    const currentScheduleCount = 0; // Placeholder

    const canCreate = await FeatureGatingService.canCreateSchedule(userId, currentScheduleCount);

    if (!canCreate) {
      return res.status(403).json({
        error: 'Schedule limit exceeded',
        message: `You have reached the maximum number of scheduled reports for your plan. Please upgrade to create more schedules.`,
      });
    }

    return next();
  } catch (error) {
    console.error('[BillingEnforcement] Error checking schedule creation limit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if user can send emails
 */
export async function checkEmailSendingLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's current email count for this month
    const usage = await StripePaymentService.getUserUsage(userId);
    const emailsSentThisMonth = usage?.emailsSent || 0;

    const canSend = await FeatureGatingService.canSendEmail(userId, emailsSentThisMonth);

    if (!canSend) {
      return res.status(429).json({
        error: 'Email sending limit exceeded',
        message: `You have reached the maximum number of emails for this month. Please upgrade your plan or wait for the next billing period.`,
        currentUsage: emailsSentThisMonth,
        limit: req.userFeatures?.maxEmailsPerMonth,
      });
    }

    return next();
  } catch (error) {
    console.error('[BillingEnforcement] Error checking email sending limit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if user can access advanced analytics
 */
export async function checkAdvancedAnalyticsAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const canAccess = await FeatureGatingService.canAccessAdvancedAnalytics(userId);

    if (!canAccess) {
      return res.status(403).json({
        error: 'Feature not available',
        message: 'Advanced analytics is only available on Pro and Enterprise plans. Please upgrade to access this feature.',
      });
    }

    return next();
  } catch (error) {
    console.error('[BillingEnforcement] Error checking advanced analytics access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if user can use webhooks
 */
export async function checkWebhookAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const canAccess = await FeatureGatingService.canUseWebhooks(userId);

    if (!canAccess) {
      return res.status(403).json({
        error: 'Feature not available',
        message: 'Webhook integration is only available on Pro and Enterprise plans. Please upgrade to use this feature.',
      });
    }

    return next();
  } catch (error) {
    console.error('[BillingEnforcement] Error checking webhook access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if user can access API
 */
export async function checkAPIAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const canAccess = await FeatureGatingService.canAccessAPI(userId);

    if (!canAccess) {
      return res.status(403).json({
        error: 'Feature not available',
        message: 'API access is only available on the Enterprise plan. Please upgrade to use this feature.',
      });
    }

    return next();
  } catch (error) {
    console.error('[BillingEnforcement] Error checking API access:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
