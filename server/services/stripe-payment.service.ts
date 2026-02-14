import Stripe from 'stripe';
import { getDb } from '@/server/db';
import {
  subscriptionPlans,
  userSubscriptions,
  invoices,
  paymentHistory,
  usageTracking,
} from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Stripe Payment Service
 * Handles subscription management, payments, and billing
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export class StripePaymentService {
  /**
   * Initialize default subscription plans in Stripe and database
   */
  static async initializeDefaultPlans(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.error('[StripePayment] Database connection failed');
        return;
      }

      // Check if plans already exist
      const existingPlans = await db.select().from(subscriptionPlans);
      if (existingPlans.length > 0) {
        console.log('[StripePayment] Plans already initialized');
        return;
      }

      // Define subscription plans
      const plans = [
        {
          name: 'Free',
          monthlyPrice: 0,
          yearlyPrice: 0,
          description: 'Get started with basic traffic analytics',
          features: ['1 website', '5 scheduled reports/month', 'Basic analytics', 'Email support'],
          maxWebsites: 1,
          maxSchedules: 5,
          maxEmailsPerMonth: 50,
          maxApiCallsPerDay: 100,
        },
        {
          name: 'Pro',
          monthlyPrice: 2999, // $29.99
          yearlyPrice: 29990, // $299.90
          description: 'For growing businesses',
          features: [
            '10 websites',
            '50 scheduled reports/month',
            'Advanced analytics',
            'Custom reports',
            'Priority support',
            'Webhook integration',
          ],
          maxWebsites: 10,
          maxSchedules: 50,
          maxEmailsPerMonth: 5000,
          maxApiCallsPerDay: 10000,
        },
        {
          name: 'Enterprise',
          monthlyPrice: 9999, // $99.99
          yearlyPrice: 99990, // $999.90
          description: 'For large-scale operations',
          features: [
            'Unlimited websites',
            'Unlimited scheduled reports',
            'Advanced analytics',
            'Custom reports',
            'Dedicated support',
            'Webhook integration',
            'API access',
            'Custom integrations',
          ],
          maxWebsites: 999,
          maxSchedules: 999,
          maxEmailsPerMonth: 999999,
          maxApiCallsPerDay: 999999,
        },
      ];

      // Insert plans into database
      for (const plan of plans) {
        await db.insert(subscriptionPlans).values({
          ...plan,
          features: plan.features,
        });
      }

      console.log('[StripePayment] Default plans initialized');
    } catch (error) {
      console.error('[StripePayment] Error initializing plans:', error);
    }
  }

  /**
   * Create a Stripe customer for a user
   */
  static async createCustomer(userId: number, email: string, name?: string): Promise<string | null> {
    try {
      const customer = await stripe.customers.create({
        email,
        name: name || `User ${userId}`,
        metadata: { userId: userId.toString() },
      });

      return customer.id;
    } catch (error) {
      console.error('[StripePayment] Error creating Stripe customer:', error);
      return null;
    }
  }

  /**
   * Create a subscription for a user
   */
  static async createSubscription(
    userId: number,
    planId: number,
    stripeCustomerId: string,
    paymentMethodId?: string
  ): Promise<{ subscriptionId: string; clientSecret?: string } | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      // Get the plan
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
      if (!plan || plan.length === 0) {
        console.error('[StripePayment] Plan not found');
        return null;
      }

      const stripePriceId = plan[0].stripePriceId;
      if (!stripePriceId) {
        console.error('[StripePayment] Plan does not have a Stripe price ID');
        return null;
      }

      // Create Stripe subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        off_session: true,
        metadata: { userId: userId.toString(), planId: planId.toString() },
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Save subscription to database
      const currentDate = new Date();
      const periodEnd = new Date(currentDate);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await db.insert(userSubscriptions).values({
        userId,
        planId,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status as any,
        currentPeriodStart: currentDate,
        currentPeriodEnd: periodEnd,
      });

      return {
        subscriptionId: subscription.id,
      };
    } catch (error) {
      console.error('[StripePayment] Error creating subscription:', error);
      return null;
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: number): Promise<any | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      if (!subscription || subscription.length === 0) {
        return null;
      }

      return subscription[0];
    } catch (error) {
      console.error('[StripePayment] Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  static async updateSubscription(userId: number, newPlanId: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      // Get current subscription
      const currentSub = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      if (!currentSub || currentSub.length === 0) {
        console.error('[StripePayment] No subscription found');
        return false;
      }

      const subscription = currentSub[0];

      // Get new plan
      const newPlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, newPlanId));
      if (!newPlan || newPlan.length === 0) {
        console.error('[StripePayment] New plan not found');
        return false;
      }

      // Update Stripe subscription
      if (subscription.stripeSubscriptionId && newPlan[0].stripePriceId) {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlan[0].stripePriceId,
            },
          ],
        });
      }

      // Update database
      await db
        .update(userSubscriptions)
        .set({
          planId: newPlanId,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, userId));

      console.log(`[StripePayment] Subscription updated for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[StripePayment] Error updating subscription:', error);
      return false;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: number, atPeriodEnd: boolean = true): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      if (!subscription || subscription.length === 0) {
        return false;
      }

      const sub = subscription[0];

      // Cancel Stripe subscription
      if (sub.stripeSubscriptionId) {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: atPeriodEnd,
        });
      }

      // Update database
      await db
        .update(userSubscriptions)
        .set({
          cancelAtPeriodEnd: atPeriodEnd,
          canceledAt: atPeriodEnd ? null : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, userId));

      console.log(`[StripePayment] Subscription canceled for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[StripePayment] Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Track usage for a user
   */
  static async trackUsage(
    userId: number,
    type: 'emailsSent' | 'apiCalls' | 'schedulesCreated' | 'reportsGenerated',
    amount: number = 1
  ): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Check if usage record exists for this month
      const existing = await db
        .select()
        .from(usageTracking)
        .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, month)));

      if (existing && existing.length > 0) {
        // Update existing record
        const current = existing[0];
        const updates: any = {};
        const currentValue = current[type as keyof typeof current];
        const numValue = typeof currentValue === 'number' ? currentValue : 0;
        updates[type] = numValue + amount;

        await db
          .update(usageTracking)
          .set(updates)
          .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, month)));
      } else {
        // Create new record
        const newRecord: any = {
          userId,
          month,
          [type]: amount,
        };

        await db.insert(usageTracking).values(newRecord);
      }

      return true;
    } catch (error) {
      console.error('[StripePayment] Error tracking usage:', error);
      return false;
    }
  }

  /**
   * Get user's usage for current month
   */
  static async getUserUsage(userId: number): Promise<any | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const usage = await db
        .select()
        .from(usageTracking)
        .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, month)));

      if (!usage || usage.length === 0) {
        return {
          emailsSent: 0,
          apiCalls: 0,
          schedulesCreated: 0,
          reportsGenerated: 0,
        };
      }

      return usage[0];
    } catch (error) {
      console.error('[StripePayment] Error getting user usage:', error);
      return null;
    }
  }

  /**
   * Check if user has exceeded usage limits
   */
  static async checkUsageLimits(userId: number): Promise<{ exceeded: boolean; limits: any } | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      // Get user's subscription
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return { exceeded: false, limits: {} };
      }

      // Get plan details
      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId));

      if (!plan || plan.length === 0) {
        return { exceeded: false, limits: {} };
      }

      // Get current usage
      const usage = await this.getUserUsage(userId);
      if (!usage) {
        return { exceeded: false, limits: plan[0] };
      }

      // Check limits
      const emailsSent = typeof usage.emailsSent === 'number' ? usage.emailsSent : 0;
      const apiCalls = typeof usage.apiCalls === 'number' ? usage.apiCalls : 0;
      const exceeded = emailsSent >= plan[0].maxEmailsPerMonth || apiCalls >= plan[0].maxApiCallsPerDay;

      return {
        exceeded,
        limits: {
          maxEmailsPerMonth: plan[0].maxEmailsPerMonth,
          currentEmails: emailsSent,
          maxApiCallsPerDay: plan[0].maxApiCallsPerDay,
          currentApiCalls: apiCalls,
        },
      };
    } catch (error) {
      console.error('[StripePayment] Error checking usage limits:', error);
      return null;
    }
  }

  /**
   * Create invoice from Stripe event
   */
  static async createInvoiceFromStripe(stripeInvoiceId: string, userId: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      // Fetch invoice from Stripe
      const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId);

      // Get subscription
      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, stripeInvoice.subscription as string));

      if (!subscription || subscription.length === 0) {
        return false;
      }

      // Create invoice in database
      await db.insert(invoices).values({
        userId,
        subscriptionId: subscription[0].id,
        stripeInvoiceId,
        amount: stripeInvoice.amount_paid || stripeInvoice.total || 0,
        currency: stripeInvoice.currency?.toUpperCase() || 'USD',
        status: stripeInvoice.status as any,
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : null,
        dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
        invoiceUrl: stripeInvoice.hosted_invoice_url || undefined,
        pdfUrl: stripeInvoice.invoice_pdf || undefined,
      });

      return true;
    } catch (error) {
      console.error('[StripePayment] Error creating invoice:', error);
      return false;
    }
  }

  /**
   * Get user's invoices
   */
  static async getUserInvoices(userId: number, limit: number = 10): Promise<any[] | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const userInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, userId))
        .limit(limit);

      return userInvoices;
    } catch (error) {
      console.error('[StripePayment] Error getting user invoices:', error);
      return null;
    }
  }
}

// Initialize default plans on startup
StripePaymentService.initializeDefaultPlans().catch(console.error);
