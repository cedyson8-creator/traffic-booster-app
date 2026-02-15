/**
 * Cost analysis service
 * Tracks API usage costs and provides optimization recommendations
 */

export interface EndpointCost {
  endpoint: string;
  callCount: number;
  costPerCall: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface CostOptimizationRecommendation {
  id: string;
  type: 'caching' | 'batching' | 'optimization' | 'upgrade';
  endpoint: string;
  description: string;
  estimatedSavings: number;
  priority: 'low' | 'medium' | 'high';
  implementationEffort: 'easy' | 'medium' | 'hard';
}

export interface CostAnalysis {
  organizationId: string;
  period: { start: Date; end: Date };
  totalCost: number;
  totalApiCalls: number;
  averageCostPerCall: number;
  costByEndpoint: EndpointCost[];
  recommendations: CostOptimizationRecommendation[];
  costTrend: { date: Date; cost: number }[];
}

export class CostAnalysisService {
  private static instance: CostAnalysisService;
  private costData: Map<string, Map<string, EndpointCost>> = new Map();
  private recommendations: Map<string, CostOptimizationRecommendation[]> = new Map();
  private recommendationCounter = 0;

  private constructor() {}

  static getInstance(): CostAnalysisService {
    if (!CostAnalysisService.instance) {
      CostAnalysisService.instance = new CostAnalysisService();
    }
    return CostAnalysisService.instance;
  }

  /**
   * Record API call cost
   */
  recordApiCall(organizationId: string, endpoint: string, cost: number, responseTime: number, isError: boolean): void {
    if (!this.costData.has(organizationId)) {
      this.costData.set(organizationId, new Map());
    }

    const orgCosts = this.costData.get(organizationId)!;
    const existing = orgCosts.get(endpoint) || {
      endpoint,
      callCount: 0,
      costPerCall: cost,
      totalCost: 0,
      averageResponseTime: 0,
      errorRate: 0,
    };

    existing.callCount++;
    existing.totalCost += cost;
    existing.costPerCall = existing.totalCost / existing.callCount;
    existing.averageResponseTime = (existing.averageResponseTime * (existing.callCount - 1) + responseTime) / existing.callCount;
    
    if (isError) {
      existing.errorRate = (existing.errorRate * (existing.callCount - 1) + 1) / existing.callCount;
    } else {
      existing.errorRate = (existing.errorRate * (existing.callCount - 1)) / existing.callCount;
    }

    orgCosts.set(endpoint, existing);
  }

  /**
   * Get cost analysis for organization
   */
  analyzeCosts(organizationId: string, startDate: Date, endDate: Date): CostAnalysis {
    const orgCosts = this.costData.get(organizationId) || new Map();
    const costByEndpoint = Array.from(orgCosts.values());
    
    const totalCost = costByEndpoint.reduce((sum, ep) => sum + ep.totalCost, 0);
    const totalApiCalls = costByEndpoint.reduce((sum, ep) => sum + ep.callCount, 0);
    const averageCostPerCall = totalApiCalls > 0 ? totalCost / totalApiCalls : 0;

    const recommendations = this.generateRecommendations(organizationId, costByEndpoint);

    return {
      organizationId,
      period: { start: startDate, end: endDate },
      totalCost,
      totalApiCalls,
      averageCostPerCall,
      costByEndpoint: costByEndpoint.sort((a, b) => b.totalCost - a.totalCost),
      recommendations,
      costTrend: this.generateCostTrend(costByEndpoint),
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(organizationId: string, endpoints: EndpointCost[]): CostOptimizationRecommendation[] {
    const recommendations: CostOptimizationRecommendation[] = [];

    endpoints.forEach(endpoint => {
      // High error rate recommendation
      if (endpoint.errorRate > 0.05) {
        recommendations.push({
          id: `rec-${++this.recommendationCounter}`,
          type: 'optimization',
          endpoint: endpoint.endpoint,
          description: `High error rate (${(endpoint.errorRate * 100).toFixed(1)}%) - investigate and fix errors to reduce costs`,
          estimatedSavings: endpoint.totalCost * endpoint.errorRate * 0.5,
          priority: 'high',
          implementationEffort: 'medium',
        });
      }

      // Slow response time recommendation
      if (endpoint.averageResponseTime > 1000) {
        recommendations.push({
          id: `rec-${++this.recommendationCounter}`,
          type: 'optimization',
          endpoint: endpoint.endpoint,
          description: `Slow response time (${endpoint.averageResponseTime.toFixed(0)}ms) - optimize queries or add caching`,
          estimatedSavings: endpoint.totalCost * 0.2,
          priority: 'medium',
          implementationEffort: 'hard',
        });
      }

      // Caching recommendation
      if (endpoint.callCount > 1000) {
        recommendations.push({
          id: `rec-${++this.recommendationCounter}`,
          type: 'caching',
          endpoint: endpoint.endpoint,
          description: `High call volume (${endpoint.callCount} calls) - implement caching to reduce API calls`,
          estimatedSavings: endpoint.totalCost * 0.3,
          priority: 'high',
          implementationEffort: 'easy',
        });
      }

      // Batching recommendation
      if (endpoint.callCount > 500 && endpoint.averageResponseTime < 500) {
        recommendations.push({
          id: `rec-${++this.recommendationCounter}`,
          type: 'batching',
          endpoint: endpoint.endpoint,
          description: `Batch requests to reduce API calls and improve efficiency`,
          estimatedSavings: endpoint.totalCost * 0.15,
          priority: 'medium',
          implementationEffort: 'medium',
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate cost trend
   */
  private generateCostTrend(endpoints: EndpointCost[]): { date: Date; cost: number }[] {
    const trend: { date: Date; cost: number }[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulate daily costs (in real implementation, fetch from database)
      const dailyCost = endpoints.reduce((sum, ep) => {
        return sum + (ep.totalCost / 30);
      }, 0);
      
      trend.push({ date, cost: dailyCost });
    }
    
    return trend;
  }

  /**
   * Get high-cost endpoints
   */
  getHighCostEndpoints(organizationId: string, limit: number = 10): EndpointCost[] {
    const orgCosts = this.costData.get(organizationId) || new Map();
    return Array.from(orgCosts.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  /**
   * Get cost summary
   */
  getCostSummary(organizationId: string): { totalCost: number; totalCalls: number; averageCostPerCall: number } {
    const orgCosts = this.costData.get(organizationId) || new Map();
    const endpoints = Array.from(orgCosts.values());
    
    const totalCost = endpoints.reduce((sum, ep) => sum + ep.totalCost, 0);
    const totalCalls = endpoints.reduce((sum, ep) => sum + ep.callCount, 0);
    
    return {
      totalCost,
      totalCalls,
      averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
    };
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.costData.clear();
    this.recommendations.clear();
    this.recommendationCounter = 0;
  }

  /**
   * Reset for testing
   */
  static resetInstance(): void {
    CostAnalysisService.instance = new CostAnalysisService();
  }
}

export const costAnalysisService = CostAnalysisService.getInstance();
