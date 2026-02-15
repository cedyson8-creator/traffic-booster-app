/**
 * Cost Optimization Automation Service
 * Automatically applies recommended optimizations to reduce costs
 */

export interface OptimizationRecommendation {
  id: string;
  type: 'caching' | 'batching' | 'compression' | 'rate-limiting' | 'pagination' | 'indexing';
  description: string;
  estimatedSavings: number; // Percentage savings
  estimatedCostReduction: number; // Dollar amount
  priority: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface OptimizationAuditLog {
  id: string;
  timestamp: Date;
  organizationId: string;
  recommendationId: string;
  action: 'applied' | 'skipped' | 'failed';
  result: string;
  costSavings?: number;
}

export class CostOptimizationAutomationService {
  private static instance: CostOptimizationAutomationService;
  private auditLogs: OptimizationAuditLog[] = [];
  private appliedOptimizations: Map<string, string[]> = new Map(); // org -> optimization IDs
  private subscribers: ((log: OptimizationAuditLog) => void)[] = [];

  private constructor() {}

  static getInstance(): CostOptimizationAutomationService {
    if (!CostOptimizationAutomationService.instance) {
      CostOptimizationAutomationService.instance = new CostOptimizationAutomationService();
    }
    return CostOptimizationAutomationService.instance;
  }

  static resetInstance(): void {
    CostOptimizationAutomationService.instance = new CostOptimizationAutomationService();
  }

  generateRecommendations(organizationId: string, apiUsage: number, errorRate: number): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // High API usage - recommend caching
    if (apiUsage > 10000) {
      recommendations.push({
        id: `cache-${organizationId}`,
        type: 'caching',
        description: 'Implement response caching for frequently accessed endpoints',
        estimatedSavings: 30,
        estimatedCostReduction: Math.round(apiUsage * 0.01 * 0.3),
        priority: 'high',
        implementation: 'Add Redis caching layer with 5-minute TTL for GET requests',
      });
    }

    // Recommend batching
    if (apiUsage > 5000) {
      recommendations.push({
        id: `batch-${organizationId}`,
        type: 'batching',
        description: 'Batch multiple API requests into single calls',
        estimatedSavings: 25,
        estimatedCostReduction: Math.round(apiUsage * 0.01 * 0.25),
        priority: 'high',
        implementation: 'Implement batch endpoint accepting up to 100 requests per call',
      });
    }

    // High error rate - recommend rate limiting
    if (errorRate > 0.05) {
      recommendations.push({
        id: `ratelimit-${organizationId}`,
        type: 'rate-limiting',
        description: 'Implement stricter rate limiting to reduce error costs',
        estimatedSavings: 15,
        estimatedCostReduction: Math.round(apiUsage * 0.01 * 0.15),
        priority: 'medium',
        implementation: 'Set rate limit to 100 requests/minute per API key',
      });
    }

    // Recommend compression
    if (apiUsage > 1000) {
      recommendations.push({
        id: `compress-${organizationId}`,
        type: 'compression',
        description: 'Enable gzip compression for API responses',
        estimatedSavings: 20,
        estimatedCostReduction: Math.round(apiUsage * 0.01 * 0.2),
        priority: 'medium',
        implementation: 'Enable gzip compression for all JSON responses',
      });
    }

    // Recommend pagination
    if (apiUsage > 5000) {
      recommendations.push({
        id: `paginate-${organizationId}`,
        type: 'pagination',
        description: 'Implement pagination for list endpoints',
        estimatedSavings: 18,
        estimatedCostReduction: Math.round(apiUsage * 0.01 * 0.18),
        priority: 'medium',
        implementation: 'Add limit/offset pagination with default limit of 50',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  applyOptimization(organizationId: string, recommendation: OptimizationRecommendation): OptimizationAuditLog {
    const log: OptimizationAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      organizationId,
      recommendationId: recommendation.id,
      action: 'applied',
      result: `Successfully applied ${recommendation.type} optimization`,
      costSavings: recommendation.estimatedCostReduction,
    };

    // Track applied optimization
    if (!this.appliedOptimizations.has(organizationId)) {
      this.appliedOptimizations.set(organizationId, []);
    }
    this.appliedOptimizations.get(organizationId)!.push(recommendation.id);

    this.auditLogs.push(log);
    this.notifySubscribers(log);

    return log;
  }

  skipOptimization(organizationId: string, recommendationId: string, reason: string): OptimizationAuditLog {
    const log: OptimizationAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      organizationId,
      recommendationId,
      action: 'skipped',
      result: `Optimization skipped: ${reason}`,
    };

    this.auditLogs.push(log);
    this.notifySubscribers(log);

    return log;
  }

  getAppliedOptimizations(organizationId: string): string[] {
    return this.appliedOptimizations.get(organizationId) || [];
  }

  getAuditLogs(organizationId: string, limit: number = 50): OptimizationAuditLog[] {
    return this.auditLogs
      .filter(log => log.organizationId === organizationId)
      .slice(-limit);
  }

  getTotalSavings(organizationId: string): number {
    return this.auditLogs
      .filter(log => log.organizationId === organizationId && log.action === 'applied')
      .reduce((sum, log) => sum + (log.costSavings || 0), 0);
  }

  getOptimizationStatus(organizationId: string): {
    applied: number;
    skipped: number;
    failed: number;
    totalSavings: number;
  } {
    const logs = this.auditLogs.filter(log => log.organizationId === organizationId);

    return {
      applied: logs.filter(l => l.action === 'applied').length,
      skipped: logs.filter(l => l.action === 'skipped').length,
      failed: logs.filter(l => l.action === 'failed').length,
      totalSavings: logs
        .filter(l => l.action === 'applied')
        .reduce((sum, l) => sum + (l.costSavings || 0), 0),
    };
  }

  autoApplyOptimizations(organizationId: string, recommendations: OptimizationRecommendation[], maxCost: number = 1000): OptimizationAuditLog[] {
    const logs: OptimizationAuditLog[] = [];
    let totalSavings = 0;

    for (const recommendation of recommendations) {
      if (totalSavings >= maxCost) break;

      if (recommendation.priority === 'high' || (recommendation.priority === 'medium' && totalSavings < maxCost * 0.5)) {
        const log = this.applyOptimization(organizationId, recommendation);
        logs.push(log);
        totalSavings += recommendation.estimatedCostReduction;
      }
    }

    return logs;
  }

  subscribe(callback: (log: OptimizationAuditLog) => void): void {
    this.subscribers.push(callback);
  }

  private notifySubscribers(log: OptimizationAuditLog): void {
    this.subscribers.forEach(callback => callback(log));
  }

  clearLogs(organizationId?: string): void {
    if (organizationId) {
      this.auditLogs = this.auditLogs.filter(log => log.organizationId !== organizationId);
      this.appliedOptimizations.delete(organizationId);
    } else {
      this.auditLogs = [];
      this.appliedOptimizations.clear();
    }
  }
}

export const costOptimizationAutomationService = CostOptimizationAutomationService.getInstance();
