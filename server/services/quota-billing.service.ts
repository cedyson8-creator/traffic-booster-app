/**
 * Quota & Billing Service
 * Manages API usage quotas, billing, and overage charges
 */

export interface QuotaLimit {
  monthlyRequests: number;
  monthlyWebhooks: number;
  monthlyExports: number;
  monthlyAlerts: number;
  maxTeamMembers: number;
  maxSharedKeys: number;
}

export interface OrganizationQuota {
  organizationId: string;
  plan: 'free' | 'pro' | 'enterprise';
  quotaLimits: QuotaLimit;
  currentMonth: string; // YYYY-MM
  requestsUsed: number;
  webhooksUsed: number;
  exportsUsed: number;
  alertsUsed: number;
  overageCharges: number;
  resetDate: Date;
  isOverQuota: boolean;
}

export interface BillingRecord {
  id: string;
  organizationId: string;
  period: string; // YYYY-MM
  baseCost: number;
  overageCharges: number;
  totalCost: number;
  status: 'pending' | 'paid' | 'failed';
  dueDate: Date;
  paidDate?: Date;
  invoiceUrl?: string;
}

export interface QuotaAlert {
  id: string;
  organizationId: string;
  type: 'warning' | 'critical';
  metric: 'requests' | 'webhooks' | 'exports' | 'alerts';
  usagePercentage: number;
  createdAt: Date;
  acknowledged: boolean;
}

/**
 * Plan-based quota limits
 */
export const PLAN_QUOTAS: Record<string, QuotaLimit> = {
  free: {
    monthlyRequests: 10000,
    monthlyWebhooks: 1000,
    monthlyExports: 10,
    monthlyAlerts: 100,
    maxTeamMembers: 1,
    maxSharedKeys: 0,
  },
  pro: {
    monthlyRequests: 100000,
    monthlyWebhooks: 10000,
    monthlyExports: 100,
    monthlyAlerts: 1000,
    maxTeamMembers: 10,
    maxSharedKeys: 5,
  },
  enterprise: {
    monthlyRequests: 1000000,
    monthlyWebhooks: 100000,
    monthlyExports: 1000,
    monthlyAlerts: 10000,
    maxTeamMembers: 100,
    maxSharedKeys: 50,
  },
};

/**
 * Plan pricing (in cents)
 */
export const PLAN_PRICING: Record<string, { baseCost: number; overageRate: Record<string, number> }> = {
  free: {
    baseCost: 0,
    overageRate: {
      requests: 0, // No overage allowed
      webhooks: 0,
      exports: 0,
      alerts: 0,
    },
  },
  pro: {
    baseCost: 9900, // $99/month
    overageRate: {
      requests: 0.001, // $0.001 per request
      webhooks: 0.01, // $0.01 per webhook
      exports: 1, // $1 per export
      alerts: 0.1, // $0.10 per alert
    },
  },
  enterprise: {
    baseCost: 49900, // $499/month
    overageRate: {
      requests: 0.0005, // $0.0005 per request
      webhooks: 0.005, // $0.005 per webhook
      exports: 0.5, // $0.50 per export
      alerts: 0.05, // $0.05 per alert
    },
  },
};

/**
 * Quota & Billing Service
 */
export class QuotaBillingService {
  private quotas: Map<string, OrganizationQuota> = new Map();
  private billingRecords: Map<string, BillingRecord[]> = new Map();
  private quotaAlerts: Map<string, QuotaAlert[]> = new Map();

  /**
   * Initialize quota for organization
   */
  initializeQuota(organizationId: string, plan: 'free' | 'pro' | 'enterprise'): OrganizationQuota {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const quotaLimits = PLAN_QUOTAS[plan];

    const quota: OrganizationQuota = {
      organizationId,
      plan,
      quotaLimits,
      currentMonth,
      requestsUsed: 0,
      webhooksUsed: 0,
      exportsUsed: 0,
      alertsUsed: 0,
      overageCharges: 0,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      isOverQuota: false,
    };

    this.quotas.set(organizationId, quota);
    console.log(`[QuotaBilling] Quota initialized for organization ${organizationId} (${plan})`);
    return quota;
  }

  /**
   * Get organization quota
   */
  getQuota(organizationId: string): OrganizationQuota | undefined {
    return this.quotas.get(organizationId);
  }

  /**
   * Record API request usage
   */
  recordRequest(organizationId: string, count: number = 1): boolean {
    const quota = this.quotas.get(organizationId);
    if (!quota) {
      console.warn(`[QuotaBilling] Quota not found for organization ${organizationId}`);
      return false;
    }

    // Check if quota reset needed
    this.checkAndResetQuota(organizationId);

    const newUsage = quota.requestsUsed + count;
    const limit = quota.quotaLimits.monthlyRequests;

    if (newUsage > limit && quota.plan === 'free') {
      quota.isOverQuota = true;
      console.warn(`[QuotaBilling] Organization ${organizationId} exceeded request quota`);
      return false;
    }

    quota.requestsUsed = newUsage;

    // Check for overage
    if (newUsage > limit) {
      const overageCount = newUsage - limit;
      const overageRate = PLAN_PRICING[quota.plan].overageRate.requests;
      quota.overageCharges += overageCount * overageRate;
    }

    // Check for quota alerts
    this.checkQuotaAlerts(organizationId, 'requests');

    return true;
  }

  /**
   * Record webhook usage
   */
  recordWebhook(organizationId: string, count: number = 1): boolean {
    const quota = this.quotas.get(organizationId);
    if (!quota) return false;

    this.checkAndResetQuota(organizationId);

    const newUsage = quota.webhooksUsed + count;
    const limit = quota.quotaLimits.monthlyWebhooks;

    if (newUsage > limit && quota.plan === 'free') {
      quota.isOverQuota = true;
      return false;
    }

    quota.webhooksUsed = newUsage;

    if (newUsage > limit) {
      const overageCount = newUsage - limit;
      const overageRate = PLAN_PRICING[quota.plan].overageRate.webhooks;
      quota.overageCharges += overageCount * overageRate;
    }

    this.checkQuotaAlerts(organizationId, 'webhooks');
    return true;
  }

  /**
   * Record export usage
   */
  recordExport(organizationId: string, count: number = 1): boolean {
    const quota = this.quotas.get(organizationId);
    if (!quota) return false;

    this.checkAndResetQuota(organizationId);

    const newUsage = quota.exportsUsed + count;
    const limit = quota.quotaLimits.monthlyExports;

    if (newUsage > limit && quota.plan === 'free') {
      quota.isOverQuota = true;
      return false;
    }

    quota.exportsUsed = newUsage;

    if (newUsage > limit) {
      const overageCount = newUsage - limit;
      const overageRate = PLAN_PRICING[quota.plan].overageRate.exports;
      quota.overageCharges += overageCount * overageRate;
    }

    this.checkQuotaAlerts(organizationId, 'exports');
    return true;
  }

  /**
   * Record alert usage
   */
  recordAlert(organizationId: string, count: number = 1): boolean {
    const quota = this.quotas.get(organizationId);
    if (!quota) return false;

    this.checkAndResetQuota(organizationId);

    const newUsage = quota.alertsUsed + count;
    const limit = quota.quotaLimits.monthlyAlerts;

    if (newUsage > limit && quota.plan === 'free') {
      quota.isOverQuota = true;
      return false;
    }

    quota.alertsUsed = newUsage;

    if (newUsage > limit) {
      const overageCount = newUsage - limit;
      const overageRate = PLAN_PRICING[quota.plan].overageRate.alerts;
      quota.overageCharges += overageCount * overageRate;
    }

    this.checkQuotaAlerts(organizationId, 'alerts');
    return true;
  }

  /**
   * Get quota usage percentage
   */
  getUsagePercentage(organizationId: string, metric: 'requests' | 'webhooks' | 'exports' | 'alerts'): number {
    const quota = this.quotas.get(organizationId);
    if (!quota) return 0;

    let used = 0;
    let limit = 0;

    switch (metric) {
      case 'requests':
        used = quota.requestsUsed;
        limit = quota.quotaLimits.monthlyRequests;
        break;
      case 'webhooks':
        used = quota.webhooksUsed;
        limit = quota.quotaLimits.monthlyWebhooks;
        break;
      case 'exports':
        used = quota.exportsUsed;
        limit = quota.quotaLimits.monthlyExports;
        break;
      case 'alerts':
        used = quota.alertsUsed;
        limit = quota.quotaLimits.monthlyAlerts;
        break;
    }

    return limit > 0 ? (used / limit) * 100 : 0;
  }

  /**
   * Generate billing record
   */
  generateBillingRecord(organizationId: string): BillingRecord {
    const quota = this.quotas.get(organizationId);
    if (!quota) {
      throw new Error('Quota not found');
    }

    const pricing = PLAN_PRICING[quota.plan];
    const baseCost = pricing.baseCost;
    const overageCharges = quota.overageCharges;
    const totalCost = baseCost + overageCharges;

    const record: BillingRecord = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      period: quota.currentMonth,
      baseCost,
      overageCharges,
      totalCost,
      status: 'pending',
      dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    const records = this.billingRecords.get(organizationId) || [];
    records.push(record);
    this.billingRecords.set(organizationId, records);

    console.log(`[QuotaBilling] Billing record generated for ${organizationId}: $${(totalCost / 100).toFixed(2)}`);
    return record;
  }

  /**
   * Get billing history
   */
  getBillingHistory(organizationId: string, limit: number = 12): BillingRecord[] {
    const records = this.billingRecords.get(organizationId) || [];
    return records.slice(-limit);
  }

  /**
   * Mark billing record as paid
   */
  markBillingAsPaid(billingId: string): BillingRecord | null {
    for (const [_, records] of this.billingRecords.entries()) {
      const record = records.find((r) => r.id === billingId);
      if (record) {
        record.status = 'paid';
        record.paidDate = new Date();
        console.log(`[QuotaBilling] Billing record ${billingId} marked as paid`);
        return record;
      }
    }
    return null;
  }

  /**
   * Upgrade organization plan
   */
  upgradePlan(organizationId: string, newPlan: 'free' | 'pro' | 'enterprise'): OrganizationQuota | null {
    const quota = this.quotas.get(organizationId);
    if (!quota) return null;

    quota.plan = newPlan;
    quota.quotaLimits = PLAN_QUOTAS[newPlan];
    quota.isOverQuota = false;

    console.log(`[QuotaBilling] Organization ${organizationId} upgraded to ${newPlan}`);
    return quota;
  }

  /**
   * Get quota alerts
   */
  getQuotaAlerts(organizationId: string): QuotaAlert[] {
    return this.quotaAlerts.get(organizationId) || [];
  }

  /**
   * Check and create quota alerts
   */
  private checkQuotaAlerts(organizationId: string, metric: 'requests' | 'webhooks' | 'exports' | 'alerts'): void {
    const percentage = this.getUsagePercentage(organizationId, metric);

    const alerts = this.quotaAlerts.get(organizationId) || [];
    const existingAlert = alerts.find((a) => a.metric === metric && !a.acknowledged);

    if (percentage >= 90 && !existingAlert) {
      const alert: QuotaAlert = {
        id: `alert_${Date.now()}`,
        organizationId,
        type: percentage >= 100 ? 'critical' : 'warning',
        metric,
        usagePercentage: percentage,
        createdAt: new Date(),
        acknowledged: false,
      };

      alerts.push(alert);
      this.quotaAlerts.set(organizationId, alerts);
      console.log(`[QuotaBilling] Quota alert created for ${organizationId}: ${metric} at ${percentage.toFixed(1)}%`);
    }
  }

  /**
   * Check and reset quota if month changed
   */
  private checkAndResetQuota(organizationId: string): void {
    const quota = this.quotas.get(organizationId);
    if (!quota) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (quota.currentMonth !== currentMonth) {
      // Generate billing record for previous month
      this.generateBillingRecord(organizationId);

      // Reset usage
      quota.currentMonth = currentMonth;
      quota.requestsUsed = 0;
      quota.webhooksUsed = 0;
      quota.exportsUsed = 0;
      quota.alertsUsed = 0;
      quota.overageCharges = 0;
      quota.isOverQuota = false;
      quota.resetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

      console.log(`[QuotaBilling] Quota reset for organization ${organizationId} for month ${currentMonth}`);
    }
  }
}

// Export singleton instance
export const quotaBillingService = new QuotaBillingService();
