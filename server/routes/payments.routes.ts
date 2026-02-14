import { Router, Request, Response } from 'express';
import { StripePaymentService } from '@/server/services/stripe-payment.service';
import { StripeWebhookService } from '@/server/services/stripe-webhook.service';
import { FeatureGatingService } from '@/server/services/feature-gating.service';

const router = Router();

/**
 * GET /api/payments/subscription
 * Get user's current subscription
 */
router.get('/subscription', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await StripePaymentService.getUserSubscription(userId);
    const features = await FeatureGatingService.getUserFeatureAccess(userId);

    res.json({
      subscription: subscription || null,
      features,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Error getting subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/plans
 * Get all available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await FeatureGatingService.getPlanComparison();
    res.json(plans);
  } catch (error) {
    console.error('[PaymentRoutes] Error getting plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/subscribe
 * Create a new subscription
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planId, paymentMethodId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Create Stripe customer
    // Note: In production, would fetch user email from database
    const stripeCustomerId = await StripePaymentService.createCustomer(userId, `user${userId}@example.com`);

    if (!stripeCustomerId) {
      return res.status(500).json({ error: 'Failed to create customer' });
    }

    // Create subscription
    const result = await StripePaymentService.createSubscription(
      userId,
      planId,
      stripeCustomerId,
      paymentMethodId
    );

    if (!result) {
      return res.status(500).json({ error: 'Failed to create subscription' });
    }

    res.json({
      success: true,
      subscriptionId: result.subscriptionId,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Error creating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/upgrade
 * Upgrade to a different plan
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const success = await StripePaymentService.updateSubscription(userId, planId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to upgrade subscription' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[PaymentRoutes] Error upgrading subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/cancel
 * Cancel subscription
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { atPeriodEnd = true } = req.body;

    const success = await StripePaymentService.cancelSubscription(userId, atPeriodEnd);

    if (!success) {
      return res.status(500).json({ error: 'Failed to cancel subscription' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[PaymentRoutes] Error canceling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/usage
 * Get user's current usage
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const usage = await StripePaymentService.getUserUsage(userId);
    const limits = await StripePaymentService.checkUsageLimits(userId);

    res.json({
      usage,
      limits,
    });
  } catch (error) {
    console.error('[PaymentRoutes] Error getting usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/invoices
 * Get user's invoices
 */
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoices = await StripePaymentService.getUserInvoices(userId);

    res.json(invoices || []);
  } catch (error) {
    console.error('[PaymentRoutes] Error getting invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!signature || !secret) {
      return res.status(400).json({ error: 'Missing webhook signature or secret' });
    }

    const result = await StripeWebhookService.handleWebhookEvent(req.body, signature, secret);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[PaymentRoutes] Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/upgrade-recommendation
 * Get upgrade recommendation for user
 */
router.get('/upgrade-recommendation', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recommendation = await FeatureGatingService.getUpgradeRecommendation(userId);

    res.json({ recommendation });
  } catch (error) {
    console.error('[PaymentRoutes] Error getting upgrade recommendation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
