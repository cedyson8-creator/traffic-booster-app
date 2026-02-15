import { EventEmitter } from 'events';

export interface Forecast {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

export interface TrendData {
  slope: number;
  growthRate: number;
  volatility: number;
  seasonality: number;
}

export interface ForecastingUpdate {
  type: 'forecast';
  forecasts: Forecast[];
  trend: TrendData;
  daysAhead: number;
  timestamp: number;
}

/**
 * ForecastingEmitterService
 * Emits real-time forecasting predictions and trend analysis
 * Simulates usage forecasting data generation
 */
export class ForecastingEmitterService extends EventEmitter {
  private static instance: ForecastingEmitterService;
  private forecastInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private currentTrend: TrendData = {
    slope: 0.045,
    growthRate: 5.2,
    volatility: 0.12,
    seasonality: 0.35,
  };
  private baseUsage = 1200;

  private constructor() {
    super();
  }

  static getInstance(): ForecastingEmitterService {
    if (!ForecastingEmitterService.instance) {
      ForecastingEmitterService.instance = new ForecastingEmitterService();
    }
    return ForecastingEmitterService.instance;
  }

  /**
   * Start emitting forecasting data at regular intervals
   * @param intervalMs Interval in milliseconds (default: 10000ms)
   */
  start(intervalMs: number = 10000): void {
    if (this.isRunning) {
      console.log('[ForecastingEmitter] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[ForecastingEmitter] Starting with ${intervalMs}ms interval`);

    this.forecastInterval = setInterval(() => {
      this.emitForecast();
    }, intervalMs);

    // Emit initial forecast immediately
    this.emitForecast();
  }

  /**
   * Stop emitting forecasting data
   */
  stop(): void {
    if (this.forecastInterval) {
      clearInterval(this.forecastInterval);
      this.forecastInterval = null;
    }
    this.isRunning = false;
    console.log('[ForecastingEmitter] Stopped');
  }

  /**
   * Generate and emit current forecasting data
   */
  private emitForecast(): void {
    const daysAhead = 7;
    const forecasts: Forecast[] = [];

    // Update trend with slight variance
    this.updateTrend();

    for (let i = 0; i <= daysAhead; i++) {
      const dayLabel = i === 0 ? 'Today' : `+${i}d`;
      
      // Calculate predicted value using trend
      const predicted = Math.round(
        this.baseUsage * Math.pow(1 + this.currentTrend.growthRate / 100, i) +
        (Math.random() - 0.5) * this.baseUsage * this.currentTrend.volatility
      );

      // Calculate confidence interval
      const confidenceMargin = predicted * (0.1 + this.currentTrend.volatility);
      const lower = Math.round(predicted - confidenceMargin);
      const upper = Math.round(predicted + confidenceMargin);

      // Calculate confidence (decreases with days ahead)
      const confidence = Math.max(0.5, 1 - (i / daysAhead) * 0.5);

      forecasts.push({
        date: dayLabel,
        predicted,
        lower,
        upper,
        confidence,
      });
    }

    const update: ForecastingUpdate = {
      type: 'forecast',
      forecasts,
      trend: this.currentTrend,
      daysAhead,
      timestamp: Date.now(),
    };

    this.emit('update', update);
  }

  /**
   * Update trend with slight variance
   */
  private updateTrend(): void {
    // Slight random walk for trend parameters
    this.currentTrend.growthRate += (Math.random() - 0.5) * 0.5;
    this.currentTrend.growthRate = Math.max(0, Math.min(10, this.currentTrend.growthRate));

    this.currentTrend.volatility += (Math.random() - 0.5) * 0.02;
    this.currentTrend.volatility = Math.max(0.05, Math.min(0.3, this.currentTrend.volatility));

    this.currentTrend.slope += (Math.random() - 0.5) * 0.005;
    this.currentTrend.slope = Math.max(0, Math.min(0.1, this.currentTrend.slope));

    // Seasonality remains relatively stable
    this.currentTrend.seasonality += (Math.random() - 0.5) * 0.02;
    this.currentTrend.seasonality = Math.max(0.2, Math.min(0.5, this.currentTrend.seasonality));
  }

  /**
   * Manually emit forecasting data
   */
  emitManual(forecasts: Forecast[], trend: TrendData, daysAhead: number = 7): void {
    const update: ForecastingUpdate = {
      type: 'forecast',
      forecasts,
      trend,
      daysAhead,
      timestamp: Date.now(),
    };

    this.emit('update', update);
  }

  /**
   * Get current trend data
   */
  getCurrentTrend(): TrendData {
    return { ...this.currentTrend };
  }

  /**
   * Update base usage for forecasting
   */
  setBaseUsage(usage: number): void {
    this.baseUsage = Math.max(100, usage);
  }

  /**
   * Get current base usage
   */
  getBaseUsage(): number {
    return this.baseUsage;
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Generate forecast for specific number of days
   */
  generateForecast(daysAhead: number): Forecast[] {
    const forecasts: Forecast[] = [];

    for (let i = 0; i <= daysAhead; i++) {
      const dayLabel = i === 0 ? 'Today' : `+${i}d`;
      
      const predicted = Math.round(
        this.baseUsage * Math.pow(1 + this.currentTrend.growthRate / 100, i)
      );

      const confidenceMargin = predicted * (0.1 + this.currentTrend.volatility);
      const lower = Math.round(predicted - confidenceMargin);
      const upper = Math.round(predicted + confidenceMargin);

      // Calculate confidence (decreases with days ahead)
      const confidence = Math.max(0.5, 1 - (i / daysAhead) * 0.5);

      forecasts.push({
        date: dayLabel,
        predicted,
        lower,
        upper,
        confidence,
      });
    }

    return forecasts;
  }
}

export const forecastingEmitter = ForecastingEmitterService.getInstance();
