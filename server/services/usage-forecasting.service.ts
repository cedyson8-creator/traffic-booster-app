/**
 * Usage Forecasting Service
 * Predicts future API usage based on historical trends
 */

export interface UsageDataPoint {
  date: Date;
  apiCalls: number;
  errors: number;
  webhooks: number;
}

export interface Forecast {
  date: Date;
  predictedCalls: number;
  confidenceInterval: { lower: number; upper: number };
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrendAnalysis {
  slope: number; // Rate of change
  seasonality: number; // Seasonal pattern strength (0-1)
  volatility: number; // Variance in data
  growthRate: number; // Percentage growth per period
}

export class UsageForecastingService {
  private static instance: UsageForecastingService;
  private usageHistory: Map<string, UsageDataPoint[]> = new Map();
  private forecasts: Map<string, Forecast[]> = new Map();

  private constructor() {}

  static getInstance(): UsageForecastingService {
    if (!UsageForecastingService.instance) {
      UsageForecastingService.instance = new UsageForecastingService();
    }
    return UsageForecastingService.instance;
  }

  static resetInstance(): void {
    UsageForecastingService.instance = new UsageForecastingService();
  }

  recordUsage(organizationId: string, dataPoint: UsageDataPoint): void {
    if (!this.usageHistory.has(organizationId)) {
      this.usageHistory.set(organizationId, []);
    }
    this.usageHistory.get(organizationId)!.push(dataPoint);

    // Keep only last 365 days
    const history = this.usageHistory.get(organizationId)!;
    if (history.length > 365) {
      history.shift();
    }
  }

  generateForecast(organizationId: string, daysAhead: number = 30): Forecast[] {
    const history = this.usageHistory.get(organizationId);
    if (!history || history.length < 7) {
      return [];
    }

    const forecasts: Forecast[] = [];
    const trend = this.analyzeTrend(history);

    const lastDataPoint = history[history.length - 1];
    let lastValue = lastDataPoint.apiCalls;

    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(lastDataPoint.date);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Simple linear regression with growth rate
      const predictedCalls = Math.round(lastValue * (1 + trend.growthRate / 100));
      const confidenceInterval = {
        lower: Math.round(predictedCalls * 0.85),
        upper: Math.round(predictedCalls * 1.15),
      };

      const forecast: Forecast = {
        date: forecastDate,
        predictedCalls,
        confidenceInterval,
        trend: trend.slope > 0.01 ? 'increasing' : trend.slope < -0.01 ? 'decreasing' : 'stable',
      };

      forecasts.push(forecast);
      lastValue = predictedCalls;
    }

    this.forecasts.set(organizationId, forecasts);
    return forecasts;
  }

  private analyzeTrend(history: UsageDataPoint[]): TrendAnalysis {
    const values = history.map(h => h.apiCalls);
    const n = values.length;

    // Calculate linear regression slope
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Calculate volatility (standard deviation)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / n;
    const volatility = Math.sqrt(variance) / yMean;

    // Calculate growth rate
    const firstValue = values[0];
    const lastValue = values[n - 1];
    const growthRate = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;

    return {
      slope,
      seasonality: this.calculateSeasonality(values),
      volatility,
      growthRate,
    };
  }

  private calculateSeasonality(values: number[]): number {
    if (values.length < 14) return 0;

    // Simple seasonality detection: compare weekly patterns
    const weeks = Math.floor(values.length / 7);
    if (weeks < 2) return 0;

    let totalVariance = 0;
    for (let i = 0; i < 7; i++) {
      const weeklyValues = [];
      for (let w = 0; w < weeks; w++) {
        const idx = w * 7 + i;
        if (idx < values.length) {
          weeklyValues.push(values[idx]);
        }
      }

      if (weeklyValues.length > 1) {
        const mean = weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length;
        const variance = weeklyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / weeklyValues.length;
        totalVariance += variance;
      }
    }

    return Math.min(totalVariance / values.length / 1000, 1);
  }

  getForecast(organizationId: string): Forecast[] {
    return this.forecasts.get(organizationId) || [];
  }

  getAccuracy(organizationId: string): number {
    const forecasts = this.forecasts.get(organizationId);
    const history = this.usageHistory.get(organizationId);

    if (!forecasts || !history || forecasts.length === 0) {
      return 0;
    }

    // Calculate MAPE (Mean Absolute Percentage Error)
    let totalError = 0;
    let count = 0;

    for (const forecast of forecasts) {
      const actual = history.find(h => h.date.toDateString() === forecast.date.toDateString());
      if (actual) {
        const error = Math.abs((forecast.predictedCalls - actual.apiCalls) / actual.apiCalls);
        totalError += error;
        count++;
      }
    }

    if (count === 0) return 0;
    const mape = totalError / count;
    return Math.max(0, 100 - mape * 100);
  }

  getTrendAnalysis(organizationId: string): TrendAnalysis | null {
    const history = this.usageHistory.get(organizationId);
    if (!history || history.length < 7) {
      return null;
    }

    return this.analyzeTrend(history);
  }

  predictCapacityNeeded(organizationId: string, daysAhead: number = 30): number {
    const forecasts = this.generateForecast(organizationId, daysAhead);
    if (forecasts.length === 0) return 0;

    const maxPredicted = Math.max(...forecasts.map(f => f.confidenceInterval.upper));
    return maxPredicted;
  }

  clearHistory(organizationId?: string): void {
    if (organizationId) {
      this.usageHistory.delete(organizationId);
      this.forecasts.delete(organizationId);
    } else {
      this.usageHistory.clear();
      this.forecasts.clear();
    }
  }
}

export const usageForecastingService = UsageForecastingService.getInstance();
