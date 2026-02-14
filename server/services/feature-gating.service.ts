import { getDb } from '@/server/db';
import { userSubscriptions, subscriptionPlans } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Feature Gating Service
 * Controls feature access based on subscription tier
 */

export interface FeatureAccess {
  canCreateWebsites: boolean;
  canCreateSchedules: boolean;
  canSendEmails: boolean;
  canAccessAdvancedAnalytics: boolean;
  canUseWebhooks: boolean;
  canAccessAPI: boolean;
  maxWebsites: number;
  maxSchedules: number;
  maxEmailsPerMonth: number;
  maxApiCallsPerDay: number;
}

const DEFAULT_FREE_TIER: FeatureAccess = {
  canCreateWebsites: true,
  canCreateSchedules: true,
  canSendEmails: true,
  canAccessAdvancedAnalytics: false,
  canUseWebhooks: false,
  canAccessAPI: false,
  maxWebsites: 1,
  maxSchedules: 5,
  maxEmailsPerMonth: 50,
  maxApiCallsPerDay: 100,
};

export class FeatureGatingService {
  /**
   * Get feature access for a user based on their subscription
   */
  static async getUserFeatureAccess(userId: number): Promise<FeatureAccess> {
    try {
      const db = await getDb();
      if (!db) {
        return DEFAULT_FREE_TIER;
      }

      // Get user's subscription
      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      if (!subscription || subscription.length === 0) {
        // User has no subscription, return free tier
        return DEFAULT_FREE_TIER;
      }

      // Get subscription plan details
      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription[0].planId));

      if (!plan || plan.length === 0) {
        return DEFAULT_FREE_TIER;
      }

      const planData = plan[0];

      // Determine feature access based on plan
      return {
        canCreateWebsites: true,
        canCreateSchedules: true,
        canSendEmails: true,
        canAccessAdvancedAnalytics: planData.name !== 'Free',
        canUseWebhooks: planData.name !== 'Free',
        canAccessAPI: planData.name === 'Enterprise',
        maxWebsites: planData.maxWebsites,
        maxSchedules: planData.maxSchedules,
        maxEmailsPerMonth: planData.maxEmailsPerMonth,
        maxApiCallsPerDay: planData.maxApiCallsPerDay,
      };
    } catch (error) {
      console.error('[FeatureGating] Error getting user feature access:', error);
      return DEFAULT_FREE_TIER;
    }
  }

  /**
   * Check if user can create a new website
   */
  static async canCreateWebsite(userId: number, currentWebsiteCount: number): Promise<boolean> {
    try {
      const access = await this.getUserFeatureAccess(userId);
      return currentWebsiteCount < access.maxWebsites;
    } catch (error) {
      console.error('[FeatureGating] Error checking website creation:', error);
      return false;
    }
  }

  /**
   * Check if user can create a new scheduled report
   */
  static async canCreateSchedule(userId: number, currentScheduleCount: number): Promise<boolean> {
    try {
      const access = await this.getUserFeatureAccess(userId);
      return currentScheduleCount < access.maxSchedules;
    } catch (error) {
      console.error('[FeatureGating] Error checking schedule creation:', error);
      return false;
    }
  }

  /**
   * Check if user can send an email
   */
  static async canSendEmail(userId: number, emailsSentThisMonth: number): Promise<boolean> {
    try {
      const access = await this.getUserFeatureAccess(userId);
      return emailsSentThisMonth < access.maxEmailsPerMonth;
    } catch (error) {
      console.error('[FeatureGating] Error checking email sending:', error);
      return false;
    }
  }

  /**
   * Check if user can access advanced analytics
   */
  static async canAccessAdvancedAnalytics(userId: number): Promise<boolean> {
    try {
      const access = await this.getUserFeatureAccess(userId);
      return access.canAccessAdvancedAnalytics;
    } catch (error) {
      console.error('[FeatureGating] Error checking advanced analytics access:', error);
      return false;
    }
  }

  /**
   * Check if user can use webhooks
   */
  static async canUseWebhooks(userId: number): Promise<boolean> {
    try {
      const access = await this.getUserFeatureAccess(userId);
      return access.canUseWebhooks;
    } catch (error) {
      console.error('[FeatureGating] Error checking webhook access:', error);
      return false;
    }
  }

  /**
   * Check if user can access API
   */
  static async canAccessAPI(userId: number): Promise<boolean> {
    try {
      const access = await this.getUserFeatureAccess(userId);
      return access.canAccessAPI;
    } catch (error) {
      console.error('[FeatureGating] Error checking API access:', error);
      return false;
    }
  }

  /**
   * Get upgrade recommendation for user
   */
  static async getUpgradeRecommendation(userId: number): Promise<string | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      // Get user's subscription
      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      if (!subscription || subscription.length === 0) {
        return 'Consider upgrading to Pro to unlock advanced features';
      }

      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription[0].planId));

      if (!plan || plan.length === 0) {
        return null;
      }

      // Provide upgrade recommendations based on current plan
      if (plan[0].name === 'Free') {
        return 'Upgrade to Pro for advanced analytics, webhooks, and more scheduled reports';
      } else if (plan[0].name === 'Pro') {
        return 'Upgrade to Enterprise for unlimited resources and dedicated support';
      }

      return null;
    } catch (error) {
      console.error('[FeatureGating] Error getting upgrade recommendation:', error);
      return null;
    }
  }

  /**
   * Get plan comparison data
   */
  static async getPlanComparison(): Promise<any[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));

      return plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        description: plan.description,
        features: plan.features,
        limits: {
          maxWebsites: plan.maxWebsites,
          maxSchedules: plan.maxSchedules,
          maxEmailsPerMonth: plan.maxEmailsPerMonth,
          maxApiCallsPerDay: plan.maxApiCallsPerDay,
        },
      }));
    } catch (error) {
      console.error('[FeatureGating] Error getting plan comparison:', error);
      return [];
    }
  }
}
