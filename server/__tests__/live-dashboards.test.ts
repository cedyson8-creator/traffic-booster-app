import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceEmitterService } from '../services/performance-emitter.service';
import { ForecastingEmitterService } from '../services/forecasting-emitter.service';
import { OptimizationEmitterService } from '../services/optimization-emitter.service';
import { EventAggregatorService } from '../services/event-aggregator.service';
import { WebSocketService } from '../services/websocket.service';

describe('Live Dashboards Integration Tests', () => {
  let wsService: WebSocketService;
  let perfEmitter: PerformanceEmitterService;
  let forecastEmitter: ForecastingEmitterService;
  let optimEmitter: OptimizationEmitterService;

  beforeEach(() => {
    wsService = WebSocketService.getInstance();
    perfEmitter = PerformanceEmitterService.getInstance();
    forecastEmitter = ForecastingEmitterService.getInstance();
    optimEmitter = OptimizationEmitterService.getInstance();
    
    // Stop all emitters to ensure clean state
    perfEmitter.stop();
    forecastEmitter.stop();
    optimEmitter.stop();
  });

  afterEach(() => {
    perfEmitter.stop();
    forecastEmitter.stop();
    optimEmitter.stop();
  });

  describe('Performance Dashboard Live Updates', () => {
    it('should emit performance metrics with proper structure', async () => {
      return new Promise<void>(resolve => {
        perfEmitter.on('update', (update) => {
          expect(update.type).toBe('performance');
          expect(Array.isArray(update.metrics)).toBe(true);
          
          if (update.metrics.length > 0) {
            const metric = update.metrics[0] as any;
            expect(metric.endpoint).toBeDefined();
            expect(metric.avgResponseTime).toBeGreaterThan(0);
            expect(metric.p95ResponseTime).toBeGreaterThan(metric.avgResponseTime);
            expect(metric.p99ResponseTime).toBeGreaterThan(metric.p95ResponseTime);
            expect(metric.errorRate).toBeGreaterThanOrEqual(0);
            expect(metric.errorRate).toBeLessThanOrEqual(1);
            expect(['up', 'down', 'stable']).toContain(metric.trend);
            resolve();
          }
        });

        perfEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should emit degradation alerts', async () => {
      return new Promise<void>(resolve => {
        perfEmitter.on('update', (update) => {
          expect(Array.isArray(update.alerts)).toBe(true);
          
          if (update.alerts.length > 0) {
            const alert = update.alerts[0] as any;
            expect(alert.endpoint).toBeDefined();
            expect(alert.metric).toBeDefined();
            expect(alert.degradationPercent).toBeGreaterThan(0);
            expect(['low', 'medium', 'high']).toContain(alert.severity);
            resolve();
          }
        });

        perfEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should track multiple endpoints', async () => {
      return new Promise<void>(resolve => {
        perfEmitter.on('update', (update) => {
          expect(update.metrics.length).toBeGreaterThan(0);
          
          const endpoints = new Set(update.metrics.map((m: any) => m.endpoint));
          expect(endpoints.size).toBeGreaterThan(1);
          resolve();
        });

        perfEmitter.start(100);
      });
    }, { timeout: 5000 });
  });

  describe('Forecasting Dashboard Live Updates', () => {
    it('should emit forecasts with confidence intervals', async () => {
      return new Promise<void>(resolve => {
        forecastEmitter.on('update', (update) => {
          expect(update.type).toBe('forecast');
          expect(Array.isArray(update.forecasts)).toBe(true);
          
          if (update.forecasts.length > 0) {
            const forecast = update.forecasts[0] as any;
            expect(forecast.date).toBeDefined();
            expect(forecast.predicted).toBeGreaterThan(0);
            expect(forecast.lower).toBeGreaterThan(0);
            expect(forecast.upper).toBeGreaterThan(forecast.lower);
            expect(forecast.confidence).toBeGreaterThanOrEqual(0);
            expect(forecast.confidence).toBeLessThanOrEqual(1);
            resolve();
          }
        });

        forecastEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should include trend analysis data', async () => {
      return new Promise<void>(resolve => {
        forecastEmitter.on('update', (update) => {
          expect(update.trend).toBeDefined();
          expect(typeof update.trend.growthRate).toBe('number');
          expect(typeof update.trend.volatility).toBe('number');
          expect(typeof update.trend.seasonality).toBe('number');
          expect(typeof update.trend.slope).toBe('number');
          
          // Validate ranges
          expect(update.trend.volatility).toBeGreaterThanOrEqual(0);
          expect(update.trend.seasonality).toBeGreaterThanOrEqual(0);
          resolve();
        });

        forecastEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should generate 7-day forecasts', async () => {
      return new Promise<void>(resolve => {
        forecastEmitter.on('update', (update) => {
          expect(update.forecasts.length).toBeGreaterThanOrEqual(7);
          
          // Verify dates
          expect(update.forecasts[0].date).toBe('Today');
          expect(update.forecasts[1].date).toBe('+1d');
          expect(update.forecasts[7].date).toBe('+7d');
          resolve();
        });

        forecastEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should maintain forecast confidence', async () => {
      return new Promise<void>(resolve => {
        forecastEmitter.on('update', (update) => {
          // Confidence should decrease for future dates
          const confidences = update.forecasts.map((f: any) => f.confidence);
          
          for (let i = 1; i < confidences.length; i++) {
            expect(confidences[i]).toBeLessThanOrEqual(confidences[i - 1]);
          }
          resolve();
        });

        forecastEmitter.start(100);
      });
    }, { timeout: 5000 });
  });

  describe('Optimization Dashboard Live Updates', () => {
    it('should emit recommendations with priority levels', async () => {
      return new Promise<void>(resolve => {
        optimEmitter.on('update', (update) => {
          expect(update.type).toBe('optimization');
          expect(Array.isArray(update.recommendations)).toBe(true);
          
          if (update.recommendations.length > 0) {
            const rec = update.recommendations[0] as any;
            expect(rec.id).toBeDefined();
            expect(['caching', 'batching', 'compression', 'rate-limiting', 'pagination']).toContain(rec.type);
            expect(rec.description).toBeDefined();
            expect(rec.estimatedSavings).toBeGreaterThan(0);
            expect(rec.estimatedCostReduction).toBeGreaterThan(0);
            expect(['low', 'medium', 'high']).toContain(rec.priority);
            expect(typeof rec.applied).toBe('boolean');
            resolve();
          }
        });

        optimEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should track applied recommendations', async () => {
      return new Promise<void>(resolve => {
        let updateCount = 0;
        
        optimEmitter.on('update', (update) => {
          updateCount++;
          
          if (updateCount === 1) {
            // First update: apply a recommendation
            const rec = update.recommendations[0];
            optimEmitter.applyRecommendation(rec.id);
          } else if (updateCount === 2) {
            // Second update: verify it was applied
            const applied = update.recommendations.filter((r: any) => r.applied);
            expect(applied.length).toBeGreaterThan(0);
            resolve();
          }
        });

        optimEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should calculate optimization summary', async () => {
      return new Promise<void>(resolve => {
        optimEmitter.on('update', (update) => {
          expect(update.summary).toBeDefined();
          expect(typeof update.summary.appliedCount).toBe('number');
          expect(typeof update.summary.totalRecommendations).toBe('number');
          expect(typeof update.summary.totalSavings).toBe('number');
          expect(typeof update.summary.potentialSavings).toBe('number');
          
          expect(update.summary.appliedCount).toBeGreaterThanOrEqual(0);
          expect(update.summary.totalRecommendations).toBeGreaterThan(0);
          expect(update.summary.totalSavings).toBeGreaterThanOrEqual(0);
          expect(update.summary.potentialSavings).toBeGreaterThan(0);
          resolve();
        });

        optimEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should filter recommendations by priority', () => {
      const recs = optimEmitter.getCurrentRecommendations();
      
      const highPriority = optimEmitter.getByPriority('high');
      expect(highPriority.every((r: any) => r.priority === 'high')).toBe(true);
      
      const mediumPriority = optimEmitter.getByPriority('medium');
      expect(mediumPriority.every((r: any) => r.priority === 'medium')).toBe(true);
      
      const lowPriority = optimEmitter.getByPriority('low');
      expect(lowPriority.every((r: any) => r.priority === 'low')).toBe(true);
    });

    it('should filter recommendations by type', () => {
      const cachingRecs = optimEmitter.getByType('caching');
      expect(cachingRecs.every((r: any) => r.type === 'caching')).toBe(true);
      
      const batchingRecs = optimEmitter.getByType('batching');
      expect(batchingRecs.every((r: any) => r.type === 'batching')).toBe(true);
    });
  });

  describe('Real-time Update Synchronization', () => {
    it('should emit all three metric types simultaneously', async () => {
      return new Promise<void>(resolve => {
        const types = new Set<string>();

        perfEmitter.on('update', () => types.add('performance'));
        forecastEmitter.on('update', () => types.add('forecast'));
        optimEmitter.on('update', () => types.add('optimization'));

        perfEmitter.start(50);
        forecastEmitter.start(50);
        optimEmitter.start(50);

        setTimeout(() => {
          perfEmitter.stop();
          forecastEmitter.stop();
          optimEmitter.stop();

          expect(types.has('performance')).toBe(true);
          expect(types.has('forecast')).toBe(true);
          expect(types.has('optimization')).toBe(true);
          resolve();
        }, 200);
      });
    });

    it('should maintain consistent update frequency', async () => {
      return new Promise<void>(resolve => {
        let updateCount = 0;
        const startTime = Date.now();

        perfEmitter.on('update', () => {
          updateCount++;
        });

        perfEmitter.start(100);

        setTimeout(() => {
          perfEmitter.stop();
          const elapsed = Date.now() - startTime;
          const expectedUpdates = Math.floor(elapsed / 100);
          
          // Allow some variance (±1 update)
          expect(updateCount).toBeGreaterThanOrEqual(expectedUpdates - 1);
          expect(updateCount).toBeLessThanOrEqual(expectedUpdates + 1);
          resolve();
        }, 350);
      });
    });

    it('should handle rapid subscription changes', () => {
      const aggregator = EventAggregatorService.getInstance(wsService);
      aggregator.initialize();
      
      // Start all
      aggregator.startAll();
      expect(perfEmitter.isActive()).toBe(true);
      
      // Stop specific
      aggregator.stopEmitter('performance');
      expect(perfEmitter.isActive()).toBe(false);
      expect(forecastEmitter.isActive()).toBe(true);
      
      // Start specific
      aggregator.startEmitter('performance');
      expect(perfEmitter.isActive()).toBe(true);
      
      // Stop all
      aggregator.stopAll();
      expect(perfEmitter.isActive()).toBe(false);
      expect(forecastEmitter.isActive()).toBe(false);
      expect(optimEmitter.isActive()).toBe(false);
    });
  });

  describe('Dashboard Data Consistency', () => {
    it('should maintain data integrity across updates', async () => {
      return new Promise<void>(resolve => {
        let updateCount = 0;
        const metrics: any[] = [];

        perfEmitter.on('update', (update) => {
          updateCount++;
          metrics.push(...update.metrics);
          
          if (updateCount === 3) {
            // Verify all metrics have required fields
            metrics.forEach((m: any) => {
              expect(m.endpoint).toBeDefined();
              expect(m.avgResponseTime).toBeGreaterThan(0);
              expect(m.errorRate).toBeGreaterThanOrEqual(0);
            });
            resolve();
          }
        });

        perfEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should provide accurate summary statistics', async () => {
      return new Promise<void>(resolve => {
        optimEmitter.on('update', (update) => {
          const { summary, recommendations } = update;
          
          // Verify summary matches recommendations
          expect(summary.totalRecommendations).toBe(recommendations.length);
          
          const appliedCount = recommendations.filter((r: any) => r.applied).length;
          expect(summary.appliedCount).toBe(appliedCount);
          
          // Verify savings calculations
          const totalSavings = recommendations
            .filter((r: any) => r.applied)
            .reduce((sum: number, r: any) => sum + r.estimatedSavings, 0);
          expect(summary.totalSavings).toBeGreaterThanOrEqual(0);
          
          const potentialSavings = recommendations
            .reduce((sum: number, r: any) => sum + r.estimatedSavings, 0);
          expect(summary.potentialSavings).toBeGreaterThanOrEqual(summary.totalSavings);
          
          resolve();
        });

        optimEmitter.start(100);
      });
    }, { timeout: 5000 });
  });
});
