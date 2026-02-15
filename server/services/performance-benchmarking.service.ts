/**
 * Performance Benchmarking Service
 * Tracks API performance metrics over time and compares against historical baselines
 */

export interface PerformanceMetric {
  endpoint: string;
  timestamp: Date;
  responseTime: number;
  statusCode: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface PerformanceBaseline {
  endpoint: string;
  p50: number; // 50th percentile
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  avgResponseTime: number;
  errorRate: number;
}

export interface PerformanceDegradation {
  endpoint: string;
  metric: string;
  currentValue: number;
  baselineValue: number;
  degradationPercent: number;
  severity: 'low' | 'medium' | 'high';
}

export class PerformanceBenchmarkingService {
  private static instance: PerformanceBenchmarkingService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private degradationAlerts: PerformanceDegradation[] = [];
  private subscribers: ((alert: PerformanceDegradation) => void)[] = [];

  private constructor() {}

  static getInstance(): PerformanceBenchmarkingService {
    if (!PerformanceBenchmarkingService.instance) {
      PerformanceBenchmarkingService.instance = new PerformanceBenchmarkingService();
    }
    return PerformanceBenchmarkingService.instance;
  }

  static resetInstance(): void {
    PerformanceBenchmarkingService.instance = new PerformanceBenchmarkingService();
  }

  recordMetric(metric: PerformanceMetric): void {
    const key = metric.endpoint;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);

    // Keep only last 1000 metrics per endpoint
    const endpointMetrics = this.metrics.get(key)!;
    if (endpointMetrics.length > 1000) {
      endpointMetrics.shift();
    }

    // Check for degradation
    this.checkForDegradation(metric);
  }

  private checkForDegradation(metric: PerformanceMetric): void {
    const baseline = this.baselines.get(metric.endpoint);
    if (!baseline) return;

    const degradationThreshold = 1.2; // 20% degradation threshold

    if (metric.responseTime > baseline.avgResponseTime * degradationThreshold) {
      const degradation: PerformanceDegradation = {
        endpoint: metric.endpoint,
        metric: 'responseTime',
        currentValue: metric.responseTime,
        baselineValue: baseline.avgResponseTime,
        degradationPercent: ((metric.responseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100,
        severity: this.calculateSeverity(metric.responseTime, baseline.avgResponseTime),
      };

      this.degradationAlerts.push(degradation);
      this.notifySubscribers(degradation);
    }
  }

  private calculateSeverity(current: number, baseline: number): 'low' | 'medium' | 'high' {
    const percent = ((current - baseline) / baseline) * 100;
    if (percent > 50) return 'high';
    if (percent > 30) return 'medium';
    return 'low';
  }

  calculateBaseline(endpoint: string): PerformanceBaseline | null {
    const metrics = this.metrics.get(endpoint);
    if (!metrics || metrics.length === 0) return null;

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;

    const baseline: PerformanceBaseline = {
      endpoint,
      p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      errorRate: errorCount / metrics.length,
    };

    this.baselines.set(endpoint, baseline);
    return baseline;
  }

  getBaseline(endpoint: string): PerformanceBaseline | null {
    return this.baselines.get(endpoint) || null;
  }

  getRecentDegradations(limit: number = 10): PerformanceDegradation[] {
    return this.degradationAlerts.slice(-limit);
  }

  getEndpointMetrics(endpoint: string, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(endpoint) || [];
    return metrics.slice(-limit);
  }

  compareToBaseline(endpoint: string): { isHealthy: boolean; issues: string[] } {
    const baseline = this.baselines.get(endpoint);
    if (!baseline) return { isHealthy: true, issues: [] };

    const recentMetrics = this.getEndpointMetrics(endpoint, 10);
    const issues: string[] = [];

    const avgResponseTime = recentMetrics.reduce((a, b) => a + b.responseTime, 0) / recentMetrics.length;
    if (avgResponseTime > baseline.avgResponseTime * 1.2) {
      issues.push(`Response time degraded by ${(((avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100).toFixed(1)}%`);
    }

    const errorRate = recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length;
    if (errorRate > baseline.errorRate * 1.5) {
      issues.push(`Error rate increased by ${(((errorRate - baseline.errorRate) / baseline.errorRate) * 100).toFixed(1)}%`);
    }

    return {
      isHealthy: issues.length === 0,
      issues,
    };
  }

  subscribe(callback: (alert: PerformanceDegradation) => void): void {
    this.subscribers.push(callback);
  }

  private notifySubscribers(alert: PerformanceDegradation): void {
    this.subscribers.forEach(callback => callback(alert));
  }

  clearMetrics(endpoint?: string): void {
    if (endpoint) {
      this.metrics.delete(endpoint);
      this.baselines.delete(endpoint);
    } else {
      this.metrics.clear();
      this.baselines.clear();
    }
  }
}

export const performanceBenchmarkingService = PerformanceBenchmarkingService.getInstance();
