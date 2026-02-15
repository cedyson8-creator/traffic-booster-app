import { EventEmitter } from 'events';

export interface PerformanceMetric {
  endpoint: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: number;
}

export interface PerformanceAlert {
  endpoint: string;
  metric: string;
  degradationPercent: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface PerformanceUpdate {
  type: 'performance';
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  timestamp: number;
}

/**
 * PerformanceEmitterService
 * Emits real-time performance metrics and alerts
 * Simulates performance monitoring data collection
 */
export class PerformanceEmitterService extends EventEmitter {
  private static instance: PerformanceEmitterService;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private baselineMetrics: Map<string, PerformanceMetric> = new Map();

  private constructor() {
    super();
    this.initializeBaseline();
  }

  static getInstance(): PerformanceEmitterService {
    if (!PerformanceEmitterService.instance) {
      PerformanceEmitterService.instance = new PerformanceEmitterService();
    }
    return PerformanceEmitterService.instance;
  }

  private initializeBaseline(): void {
    const endpoints = ['/api/users', '/api/posts', '/api/comments', '/api/search'];
    
    endpoints.forEach(endpoint => {
      this.baselineMetrics.set(endpoint, {
        endpoint,
        avgResponseTime: 100 + Math.random() * 150,
        p95ResponseTime: 200 + Math.random() * 200,
        p99ResponseTime: 300 + Math.random() * 250,
        errorRate: Math.random() * 0.05,
        trend: 'stable',
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Start emitting performance metrics at regular intervals
   * @param intervalMs Interval in milliseconds (default: 5000ms)
   */
  start(intervalMs: number = 5000): void {
    if (this.isRunning) {
      console.log('[PerformanceEmitter] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[PerformanceEmitter] Starting with ${intervalMs}ms interval`);

    this.metricsInterval = setInterval(() => {
      this.emitMetrics();
    }, intervalMs);

    // Emit initial metrics immediately
    this.emitMetrics();
  }

  /**
   * Stop emitting performance metrics
   */
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    this.isRunning = false;
    console.log('[PerformanceEmitter] Stopped');
  }

  /**
   * Generate and emit current performance metrics
   */
  private emitMetrics(): void {
    const metrics: PerformanceMetric[] = [];
    const alerts: PerformanceAlert[] = [];

    this.baselineMetrics.forEach((baseline, endpoint) => {
      // Simulate metric variations
      const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
      const metric: PerformanceMetric = {
        endpoint,
        avgResponseTime: Math.max(50, baseline.avgResponseTime * (1 + variance)),
        p95ResponseTime: Math.max(100, baseline.p95ResponseTime * (1 + variance)),
        p99ResponseTime: Math.max(150, baseline.p99ResponseTime * (1 + variance)),
        errorRate: Math.max(0, Math.min(0.1, baseline.errorRate + (Math.random() - 0.5) * 0.02)),
        trend: this.calculateTrend(baseline),
        timestamp: Date.now(),
      };

      metrics.push(metric);

      // Check for degradation alerts
      if (metric.avgResponseTime > baseline.avgResponseTime * 1.5) {
        alerts.push({
          endpoint,
          metric: 'responseTime',
          degradationPercent: ((metric.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100,
          severity: metric.avgResponseTime > baseline.avgResponseTime * 2 ? 'high' : 'medium',
          timestamp: Date.now(),
        });
      }

      if (metric.errorRate > baseline.errorRate * 2) {
        alerts.push({
          endpoint,
          metric: 'errorRate',
          degradationPercent: ((metric.errorRate - baseline.errorRate) / baseline.errorRate) * 100,
          severity: metric.errorRate > 0.05 ? 'high' : 'medium',
          timestamp: Date.now(),
        });
      }
    });

    const update: PerformanceUpdate = {
      type: 'performance',
      metrics,
      alerts,
      timestamp: Date.now(),
    };

    this.emit('update', update);
  }

  /**
   * Manually emit performance metrics
   */
  emitManual(metrics: PerformanceMetric[], alerts: PerformanceAlert[] = []): void {
    const update: PerformanceUpdate = {
      type: 'performance',
      metrics,
      alerts,
      timestamp: Date.now(),
    };

    this.emit('update', update);
  }

  /**
   * Calculate trend based on recent metrics
   */
  private calculateTrend(metric: PerformanceMetric): 'up' | 'down' | 'stable' {
    const random = Math.random();
    if (random < 0.3) return 'up';
    if (random < 0.6) return 'down';
    return 'stable';
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics(): PerformanceMetric[] {
    return Array.from(this.baselineMetrics.values());
  }

  /**
   * Update baseline metrics for an endpoint
   */
  updateBaseline(endpoint: string, metric: Partial<PerformanceMetric>): void {
    const current = this.baselineMetrics.get(endpoint);
    if (current) {
      this.baselineMetrics.set(endpoint, { ...current, ...metric });
    }
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export const performanceEmitter = PerformanceEmitterService.getInstance();
