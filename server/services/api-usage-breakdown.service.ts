/**
 * API Usage Breakdown Service
 * Tracks per-endpoint usage statistics, response times, and error distribution
 */

export interface EndpointUsage {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  callCount: number;
  errorCount: number;
  successCount: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  lastCalled: Date;
}

export interface APIUsageBreakdown {
  organizationId: string;
  userId?: string;
  totalCalls: number;
  totalErrors: number;
  successRate: number;
  averageResponseTime: number;
  endpoints: EndpointUsage[];
  topEndpoints: EndpointUsage[];
  slowestEndpoints: EndpointUsage[];
  errorDistribution: Record<number, number>;
  timeRange: { start: Date; end: Date };
}

export interface ResponseTimePercentile {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export class APIUsageBreakdownService {
  private static instance: APIUsageBreakdownService;
  private usageData: Map<string, EndpointUsage> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private errors: Map<string, Record<number, number>> = new Map();

  private constructor() {}

  static getInstance(): APIUsageBreakdownService {
    if (!APIUsageBreakdownService.instance) {
      APIUsageBreakdownService.instance = new APIUsageBreakdownService();
    }
    return APIUsageBreakdownService.instance;
  }

  /**
   * Record API call
   */
  recordCall(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    responseTime: number,
    statusCode: number,
    organizationId: string
  ): void {
    const key = `${organizationId}-${method}-${endpoint}`;

    // Initialize if needed
    if (!this.usageData.has(key)) {
      this.usageData.set(key, {
        endpoint,
        method,
        callCount: 0,
        errorCount: 0,
        successCount: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        lastCalled: new Date(),
      });

      this.responseTimes.set(key, []);
      this.errors.set(key, {});
    }

    const usage = this.usageData.get(key)!;
    const times = this.responseTimes.get(key)!;
    const errorMap = this.errors.get(key)!;

    // Update counters
    usage.callCount += 1;
    usage.lastCalled = new Date();

    // Track response time
    times.push(responseTime);
    usage.minResponseTime = Math.min(usage.minResponseTime, responseTime);
    usage.maxResponseTime = Math.max(usage.maxResponseTime, responseTime);
    usage.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;

    // Calculate percentiles
    const sorted = [...times].sort((a, b) => a - b);
    usage.p50ResponseTime = sorted[Math.floor(sorted.length * 0.5)];
    usage.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
    usage.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];

    // Track errors
    if (statusCode >= 400) {
      usage.errorCount += 1;
      errorMap[statusCode] = (errorMap[statusCode] || 0) + 1;
    } else {
      usage.successCount += 1;
    }

    usage.errorRate = (usage.errorCount / usage.callCount) * 100;
  }

  /**
   * Get usage breakdown for organization
   */
  getBreakdown(organizationId: string, startDate?: Date, endDate?: Date): APIUsageBreakdown {
    const endpoints = Array.from(this.usageData.values()).filter(u => {
      const key = `${organizationId}-${u.method}-${u.endpoint}`;
      return this.usageData.has(key);
    });

    const totalCalls = endpoints.reduce((sum, e) => sum + e.callCount, 0);
    const totalErrors = endpoints.reduce((sum, e) => sum + e.errorCount, 0);
    const successRate = totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 0;
    const averageResponseTime =
      endpoints.length > 0 ? endpoints.reduce((sum, e) => sum + e.averageResponseTime, 0) / endpoints.length : 0;

    // Get top endpoints by call count
    const topEndpoints = [...endpoints].sort((a, b) => b.callCount - a.callCount).slice(0, 5);

    // Get slowest endpoints
    const slowestEndpoints = [...endpoints].sort((a, b) => b.averageResponseTime - a.averageResponseTime).slice(0, 5);

    // Aggregate error distribution
    const errorDistribution: Record<number, number> = {};
    endpoints.forEach(e => {
      const key = `${organizationId}-${e.method}-${e.endpoint}`;
      const errors = this.errors.get(key) || {};
      Object.entries(errors).forEach(([code, count]) => {
        errorDistribution[parseInt(code)] = (errorDistribution[parseInt(code)] || 0) + count;
      });
    });

    return {
      organizationId,
      totalCalls,
      totalErrors,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      endpoints,
      topEndpoints,
      slowestEndpoints,
      errorDistribution,
      timeRange: { start: startDate || new Date(0), end: endDate || new Date() },
    };
  }

  /**
   * Get endpoint usage details
   */
  getEndpointUsage(organizationId: string, method: string, endpoint: string): EndpointUsage | undefined {
    const key = `${organizationId}-${method}-${endpoint}`;
    return this.usageData.get(key);
  }

  /**
   * Get response time percentiles for endpoint
   */
  getResponseTimePercentiles(organizationId: string, method: string, endpoint: string): ResponseTimePercentile | undefined {
    const key = `${organizationId}-${method}-${endpoint}`;
    const times = this.responseTimes.get(key);

    if (!times || times.length === 0) {
      return undefined;
    }

    const sorted = [...times].sort((a, b) => a - b);

    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get error distribution for endpoint
   */
  getErrorDistribution(organizationId: string, method: string, endpoint: string): Record<number, number> {
    const key = `${organizationId}-${method}-${endpoint}`;
    return this.errors.get(key) || {};
  }

  /**
   * Get top error codes across all endpoints
   */
  getTopErrorCodes(organizationId: string, limit: number = 10): Array<{ code: number; count: number }> {
    const allErrors: Record<number, number> = {};

    this.errors.forEach((errorMap, key) => {
      if (key.startsWith(organizationId)) {
        Object.entries(errorMap).forEach(([code, count]) => {
          const codeNum = parseInt(code);
          allErrors[codeNum] = (allErrors[codeNum] || 0) + count;
        });
      }
    });

    return Object.entries(allErrors)
      .map(([code, count]) => ({ code: parseInt(code as string), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get endpoints by error rate
   */
  getEndpointsByErrorRate(organizationId: string, limit: number = 10): EndpointUsage[] {
    const endpoints = Array.from(this.usageData.values()).filter(u => {
      const key = `${organizationId}-${u.method}-${u.endpoint}`;
      return this.usageData.has(key);
    });

    return endpoints.sort((a, b) => b.errorRate - a.errorRate).slice(0, limit);
  }

  /**
   * Get usage statistics summary
   */
  getSummary(organizationId: string) {
    const breakdown = this.getBreakdown(organizationId);

      const mostCommonErrorEntry = Object.entries(breakdown.errorDistribution)
        .sort(([, a], [, b]) => b - a)[0];
      const mostCommonError = mostCommonErrorEntry ? parseInt(mostCommonErrorEntry[0] as string) : null;

      return {
        totalEndpoints: breakdown.endpoints.length,
        totalCalls: breakdown.totalCalls,
        totalErrors: breakdown.totalErrors,
        successRate: breakdown.successRate,
        averageResponseTime: breakdown.averageResponseTime,
        topEndpoint: breakdown.topEndpoints[0] || null,
        slowestEndpoint: breakdown.slowestEndpoints[0] || null,
        mostCommonError,
      };
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.usageData.clear();
    this.responseTimes.clear();
    this.errors.clear();
  }

  /**
   * Get total endpoints tracked
   */
  getTotalEndpoints(): number {
    return this.usageData.size;
  }
}

export const apiUsageBreakdownService = APIUsageBreakdownService.getInstance();
