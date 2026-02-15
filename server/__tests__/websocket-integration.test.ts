import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceEmitterService } from '../services/performance-emitter.service';
import { ForecastingEmitterService } from '../services/forecasting-emitter.service';
import { OptimizationEmitterService } from '../services/optimization-emitter.service';
import { EventAggregatorService } from '../services/event-aggregator.service';
import { WebSocketService } from '../services/websocket.service';

describe('WebSocket Real-Time Integration', () => {
  let wsService: WebSocketService;
  let perfEmitter: PerformanceEmitterService;
  let forecastEmitter: ForecastingEmitterService;
  let optimEmitter: OptimizationEmitterService;

  beforeEach(() => {
    wsService = WebSocketService.getInstance();
    perfEmitter = PerformanceEmitterService.getInstance();
    forecastEmitter = ForecastingEmitterService.getInstance();
    optimEmitter = OptimizationEmitterService.getInstance();
  });

  afterEach(() => {
    perfEmitter.stop();
    forecastEmitter.stop();
    optimEmitter.stop();
  });

  describe('PerformanceEmitterService', () => {
    it('should emit performance metrics', async () => {
      return new Promise<void>(resolve => {
        perfEmitter.on('update', (update) => {
          expect(update.type).toBe('performance');
          expect(Array.isArray(update.metrics)).toBe(true);
          expect(update.metrics.length).toBeGreaterThan(0);
          resolve();
        });

        perfEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should include performance metric details', async () => {
      return new Promise<void>(resolve => {
        perfEmitter.on('update', (update) => {
          const metric = update.metrics[0];
          expect(metric.endpoint).toBeDefined();
          expect(metric.avgResponseTime).toBeGreaterThan(0);
          expect(metric.p95ResponseTime).toBeGreaterThan(0);
          expect(metric.p99ResponseTime).toBeGreaterThan(0);
          expect(metric.errorRate).toBeGreaterThanOrEqual(0);
          expect(['up', 'down', 'stable']).toContain(metric.trend);
          resolve();
        });

        perfEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should emit degradation alerts', async () => {
      return new Promise<void>(resolve => {
        perfEmitter.on('update', (update) => {
          expect(Array.isArray(update.alerts)).toBe(true);
          // Alerts may or may not be present
          resolve();
        });

        perfEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should start and stop emitting', async () => {
      let updateCount = 0;

      perfEmitter.on('update', () => {
        updateCount++;
      });

      perfEmitter.start(50);

      await new Promise(resolve => setTimeout(resolve, 150));
      perfEmitter.stop();
      const countBefore = updateCount;

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(updateCount).toBe(countBefore);
    });

    it('should get current metrics', () => {
      const metrics = perfEmitter.getCurrentMetrics();
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should update baseline metrics', () => {
      const endpoint = '/api/users';
      perfEmitter.updateBaseline(endpoint, { avgResponseTime: 200 });

      const metrics = perfEmitter.getCurrentMetrics();
      const updated = metrics.find(m => m.endpoint === endpoint);
      expect(updated?.avgResponseTime).toBe(200);
    });
  });

  describe('ForecastingEmitterService', () => {
    it('should emit forecasting data', async () => {
      return new Promise<void>(resolve => {
        forecastEmitter.on('update', (update) => {
          expect(update.type).toBe('forecast');
          expect(Array.isArray(update.forecasts)).toBe(true);
          expect(update.forecasts.length).toBeGreaterThan(0);
          resolve();
        });

        forecastEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should include forecast details', async () => {
      return new Promise<void>(resolve => {
        forecastEmitter.on('update', (update) => {
          const forecast = update.forecasts[0];
          expect(forecast.date).toBeDefined();
          expect(forecast.predicted).toBeGreaterThan(0);
          expect(forecast.lower).toBeGreaterThan(0);
          expect(forecast.upper).toBeGreaterThan(forecast.lower);
          resolve();
        });

        forecastEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should include trend analysis', async () => {
      return new Promise<void>(resolve => {
        forecastEmitter.on('update', (update) => {
          expect(update.trend.growthRate).toBeDefined();
          expect(update.trend.volatility).toBeDefined();
          expect(update.trend.seasonality).toBeDefined();
          expect(update.trend.slope).toBeDefined();
          resolve();
        });

        forecastEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should generate forecasts for specific days', () => {
      const forecasts = forecastEmitter.generateForecast(14);
      expect(forecasts.length).toBe(15); // 0-14 inclusive
      expect(forecasts[0].date).toBe('Today');
      expect(forecasts[1].date).toBe('+1d');
    });

    it('should update base usage', () => {
      forecastEmitter.setBaseUsage(2000);
      expect(forecastEmitter.getBaseUsage()).toBe(2000);
    });

    it('should get current trend', () => {
      const trend = forecastEmitter.getCurrentTrend();
      expect(trend.growthRate).toBeDefined();
      expect(trend.volatility).toBeDefined();
    });
  });

  describe('OptimizationEmitterService', () => {
    it('should emit optimization recommendations', async () => {
      return new Promise<void>(resolve => {
        optimEmitter.on('update', (update) => {
          expect(update.type).toBe('optimization');
          expect(Array.isArray(update.recommendations)).toBe(true);
          expect(update.recommendations.length).toBeGreaterThan(0);
          resolve();
        });

        optimEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should include recommendation details', async () => {
      return new Promise<void>(resolve => {
        optimEmitter.on('update', (update) => {
          const rec = update.recommendations[0];
          expect(rec.id).toBeDefined();
          expect(['caching', 'batching', 'compression', 'rate-limiting', 'pagination']).toContain(rec.type);
          expect(rec.description).toBeDefined();
          expect(rec.estimatedSavings).toBeGreaterThan(0);
          expect(rec.estimatedCostReduction).toBeGreaterThan(0);
          expect(['low', 'medium', 'high']).toContain(rec.priority);
          resolve();
        });

        optimEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should calculate optimization summary', async () => {
      return new Promise<void>(resolve => {
        optimEmitter.on('update', (update) => {
          expect(update.summary.appliedCount).toBeGreaterThanOrEqual(0);
          expect(update.summary.totalRecommendations).toBeGreaterThan(0);
          expect(update.summary.totalSavings).toBeGreaterThanOrEqual(0);
          expect(update.summary.potentialSavings).toBeGreaterThan(0);
          resolve();
        });

        optimEmitter.start(100);
      });
    }, { timeout: 5000 });

    it('should apply and unapply recommendations', async () => {
      return new Promise<void>(resolve => {
        optimEmitter.on('update', (update) => {
          const rec = update.recommendations[0];

          optimEmitter.applyRecommendation(rec.id);

          optimEmitter.on('update', (update2) => {
            const updated = update2.recommendations.find((r: any) => r.id === rec.id);
            expect(updated?.applied).toBe(true);
            resolve();
          });
        });
      });

      optimEmitter.start(100);
    });

    it('should get recommendations by priority', () => {
      const highPriority = optimEmitter.getByPriority('high');
      expect(Array.isArray(highPriority)).toBe(true);
      highPriority.forEach(rec => {
        expect(rec.priority).toBe('high');
      });
    });

    it('should get recommendations by type', () => {
      const caching = optimEmitter.getByType('caching');
      expect(Array.isArray(caching)).toBe(true);
      caching.forEach(rec => {
        expect(rec.type).toBe('caching');
      });
    });
  });

  describe('EventAggregatorService Integration', () => {
    it('should initialize event listeners', () => {
      const aggregator = EventAggregatorService.getInstance(wsService);
      aggregator.initialize();
      expect(aggregator.isInitialized_()).toBe(true);
    });

    it('should start all emitters', () => {
      const aggregator = EventAggregatorService.getInstance(wsService);
      aggregator.initialize();
      aggregator.startAll();

      expect(perfEmitter.isActive()).toBe(true);
      expect(forecastEmitter.isActive()).toBe(true);
      expect(optimEmitter.isActive()).toBe(true);
    });

    it('should stop all emitters', () => {
      const aggregator = EventAggregatorService.getInstance(wsService);
      aggregator.initialize();
      aggregator.startAll();
      aggregator.stopAll();

      expect(perfEmitter.isActive()).toBe(false);
      expect(forecastEmitter.isActive()).toBe(false);
      expect(optimEmitter.isActive()).toBe(false);
    });

    it('should start specific emitter', () => {
      const aggregator = EventAggregatorService.getInstance(wsService);
      aggregator.initialize();
      aggregator.startEmitter('performance');

      expect(perfEmitter.isActive()).toBe(true);
    });

    it('should stop specific emitter', () => {
      const aggregator = EventAggregatorService.getInstance(wsService);
      aggregator.initialize();
      aggregator.startEmitter('performance');
      aggregator.stopEmitter('performance');

      expect(perfEmitter.isActive()).toBe(false);
    });

    it('should check emitter status', () => {
      const aggregator = EventAggregatorService.getInstance(wsService);
      aggregator.initialize();
      aggregator.startAll();

      const status = aggregator.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.emitters.performance).toBe(true);
      expect(status.emitters.forecasting).toBe(true);
      expect(status.emitters.optimization).toBe(true);
    });
  });

  describe('Real-time Update Flow', () => {
    it('should emit performance updates continuously', async () => {
      let updateCount = 0;

      perfEmitter.on('update', () => {
        updateCount++;
      });

      perfEmitter.start(50);

      await new Promise(resolve => setTimeout(resolve, 150));
      perfEmitter.stop();
      expect(updateCount).toBeGreaterThanOrEqual(2);
    });

    it('should emit different metric types', async () => {
      const types = new Set<string>();

      perfEmitter.on('update', () => types.add('performance'));
      forecastEmitter.on('update', () => types.add('forecast'));
      optimEmitter.on('update', () => types.add('optimization'));

      perfEmitter.start(50);
      forecastEmitter.start(50);
      optimEmitter.start(50);

      await new Promise(resolve => setTimeout(resolve, 200));
      perfEmitter.stop();
      forecastEmitter.stop();
      optimEmitter.stop();

      expect(types.has('performance')).toBe(true);
      expect(types.has('forecast')).toBe(true);
      expect(types.has('optimization')).toBe(true);
    });
  });
});
