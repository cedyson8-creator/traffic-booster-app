import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceBenchmarkingService } from '../services/performance-benchmarking.service';
import { UsageForecastingService } from '../services/usage-forecasting.service';
import { CostOptimizationAutomationService } from '../services/cost-optimization-automation.service';

describe('Performance Benchmarking Service', () => {
  let benchmarkService: PerformanceBenchmarkingService;

  beforeEach(() => {
    PerformanceBenchmarkingService.resetInstance();
    benchmarkService = PerformanceBenchmarkingService.getInstance();
  });

  it('should record performance metrics', () => {
    benchmarkService.recordMetric({
      endpoint: '/api/users',
      timestamp: new Date(),
      responseTime: 150,
      statusCode: 200,
      memoryUsage: 50,
      cpuUsage: 20,
    });

    const metrics = benchmarkService.getEndpointMetrics('/api/users');
    expect(metrics.length).toBe(1);
    expect(metrics[0].responseTime).toBe(150);
  });

  it('should calculate baseline from metrics', () => {
    for (let i = 0; i < 10; i++) {
      benchmarkService.recordMetric({
        endpoint: '/api/users',
        timestamp: new Date(),
        responseTime: 100 + i * 10,
        statusCode: 200,
        memoryUsage: 50,
        cpuUsage: 20,
      });
    }

    const baseline = benchmarkService.calculateBaseline('/api/users');
    expect(baseline).not.toBeNull();
    expect(baseline?.avgResponseTime).toBeGreaterThan(100);
  });

  it('should detect performance degradation', () => {
    // Set baseline
    for (let i = 0; i < 10; i++) {
      benchmarkService.recordMetric({
        endpoint: '/api/users',
        timestamp: new Date(),
        responseTime: 100,
        statusCode: 200,
        memoryUsage: 50,
        cpuUsage: 20,
      });
    }
    benchmarkService.calculateBaseline('/api/users');

    // Record degraded metric
    benchmarkService.recordMetric({
      endpoint: '/api/users',
      timestamp: new Date(),
      responseTime: 250, // 2.5x baseline
      statusCode: 200,
      memoryUsage: 50,
      cpuUsage: 20,
    });

    const degradations = benchmarkService.getRecentDegradations();
    expect(degradations.length).toBeGreaterThan(0);
  });

  it('should compare to baseline', () => {
    // Set baseline
    for (let i = 0; i < 10; i++) {
      benchmarkService.recordMetric({
        endpoint: '/api/users',
        timestamp: new Date(),
        responseTime: 100,
        statusCode: 200,
        memoryUsage: 50,
        cpuUsage: 20,
      });
    }
    benchmarkService.calculateBaseline('/api/users');

    // Record healthy metrics
    for (let i = 0; i < 10; i++) {
      benchmarkService.recordMetric({
        endpoint: '/api/users',
        timestamp: new Date(),
        responseTime: 105,
        statusCode: 200,
        memoryUsage: 50,
        cpuUsage: 20,
      });
    }

    const comparison = benchmarkService.compareToBaseline('/api/users');
    expect(comparison.isHealthy).toBe(true);
  });
});

describe('Usage Forecasting Service', () => {
  let forecastService: UsageForecastingService;

  beforeEach(() => {
    UsageForecastingService.resetInstance();
    forecastService = UsageForecastingService.getInstance();
  });

  it('should record usage data', () => {
    const now = new Date();
    forecastService.recordUsage('org-1', {
      date: now,
      apiCalls: 1000,
      errors: 10,
      webhooks: 50,
    });

    const forecast = forecastService.generateForecast('org-1', 1);
    expect(forecast.length).toBe(0); // Need at least 7 days of data
  });

  it('should generate forecast with sufficient data', () => {
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (10 - i));
      forecastService.recordUsage('org-1', {
        date,
        apiCalls: 1000 + i * 100,
        errors: 10,
        webhooks: 50,
      });
    }

    const forecast = forecastService.generateForecast('org-1', 5);
    expect(forecast.length).toBe(5);
    expect(forecast[0].predictedCalls).toBeGreaterThan(0);
  });

  it('should analyze trend', () => {
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (30 - i));
      forecastService.recordUsage('org-1', {
        date,
        apiCalls: 1000 + i * 50,
        errors: 10,
        webhooks: 50,
      });
    }

    const trend = forecastService.getTrendAnalysis('org-1');
    expect(trend).not.toBeNull();
    expect(trend?.slope).toBeGreaterThan(0);
  });

  it('should predict capacity needed', () => {
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (30 - i));
      forecastService.recordUsage('org-1', {
        date,
        apiCalls: 1000 + i * 50,
        errors: 10,
        webhooks: 50,
      });
    }

    const capacity = forecastService.predictCapacityNeeded('org-1', 7);
    expect(capacity).toBeGreaterThan(1000);
  });
});

describe('Cost Optimization Automation Service', () => {
  let optimizationService: CostOptimizationAutomationService;

  beforeEach(() => {
    CostOptimizationAutomationService.resetInstance();
    optimizationService = CostOptimizationAutomationService.getInstance();
  });

  it('should generate recommendations for high usage', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some(r => r.type === 'caching')).toBe(true);
  });

  it('should generate recommendations for high error rate', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 5000, 0.1);
    expect(recommendations.some(r => r.type === 'rate-limiting')).toBe(true);
  });

  it('should apply optimization', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);
    const recommendation = recommendations[0];

    const log = optimizationService.applyOptimization('org-1', recommendation);
    expect(log.action).toBe('applied');
    expect(log.costSavings).toBeGreaterThan(0);
  });

  it('should skip optimization with reason', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);
    const recommendation = recommendations[0];

    const log = optimizationService.skipOptimization('org-1', recommendation.id, 'Already implemented');
    expect(log.action).toBe('skipped');
  });

  it('should track applied optimizations', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);
    const recommendation = recommendations[0];

    optimizationService.applyOptimization('org-1', recommendation);
    const applied = optimizationService.getAppliedOptimizations('org-1');
    expect(applied.length).toBe(1);
  });

  it('should calculate total savings', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);
    const recommendation = recommendations[0];

    optimizationService.applyOptimization('org-1', recommendation);
    const savings = optimizationService.getTotalSavings('org-1');
    expect(savings).toBeGreaterThan(0);
  });

  it('should get optimization status', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);

    optimizationService.applyOptimization('org-1', recommendations[0]);
    optimizationService.skipOptimization('org-1', recommendations[1].id, 'Not applicable');

    const status = optimizationService.getOptimizationStatus('org-1');
    expect(status.applied).toBe(1);
    expect(status.skipped).toBe(1);
    expect(status.totalSavings).toBeGreaterThan(0);
  });

  it('should auto-apply optimizations', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);
    const logs = optimizationService.autoApplyOptimizations('org-1', recommendations, 500);
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should get audit logs', () => {
    const recommendations = optimizationService.generateRecommendations('org-1', 15000, 0.02);
    optimizationService.applyOptimization('org-1', recommendations[0]);

    const logs = optimizationService.getAuditLogs('org-1');
    expect(logs.length).toBe(1);
  });
});
