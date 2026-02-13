import {
  HistoricalDataPoint,
  TrendAnalysis,
  SeasonalPattern,
  PerformanceForecast,
  OptimalLaunchTiming,
  PredictiveInsight,
  ForecastMetrics,
} from "./predictive-analytics-types";

/**
 * Calculate simple linear regression
 */
function calculateLinearRegression(
  data: number[]
): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const xMean = x.reduce((a, b) => a + b) / n;
  const yMean = y.reduce((a, b) => a + b) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R²
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + (yi - predicted) ** 2;
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2: Math.max(0, r2) };
}

/**
 * Analyze trend in historical data
 */
export function analyzeTrend(data: HistoricalDataPoint[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      direction: "stable",
      strength: 0,
      slope: 0,
      r2: 0,
    };
  }

  const visits = data.map((d) => d.visits);
  const { slope, r2 } = calculateLinearRegression(visits);

  const avgVisits = visits.reduce((a, b) => a + b) / visits.length;
  const percentageChange = avgVisits !== 0 ? (slope / avgVisits) * 100 : 0;

  return {
    direction:
      percentageChange > 5 ? "upward" : percentageChange < -5 ? "downward" : "stable",
    strength: Math.min(100, Math.abs(percentageChange * 2)),
    slope,
    r2,
  };
}

/**
 * Detect seasonal patterns
 */
export function detectSeasonalPattern(
  data: HistoricalDataPoint[],
  period: "daily" | "weekly" | "monthly" = "weekly"
): SeasonalPattern {
  if (data.length < 4) {
    return {
      period,
      pattern: [],
      strength: 0,
    };
  }

  const periodLength = period === "daily" ? 7 : period === "weekly" ? 4 : 12;
  const visits = data.map((d) => d.visits);
  const avgVisits = visits.reduce((a, b) => a + b) / visits.length;

  // Calculate seasonal indices
  const indices: number[] = [];
  for (let i = 0; i < periodLength; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i; j < visits.length; j += periodLength) {
      sum += visits[j];
      count++;
    }
    const avg = count > 0 ? sum / count : avgVisits;
    indices.push(avg / avgVisits);
  }

  // Calculate seasonality strength (coefficient of variation)
  const indexMean = indices.reduce((a, b) => a + b) / indices.length;
  const variance = indices.reduce((sum, idx) => sum + (idx - indexMean) ** 2, 0) / indices.length;
  const stdDev = Math.sqrt(variance);
  const strength = Math.min(100, (stdDev / indexMean) * 100);

  return {
    period,
    pattern: indices,
    strength: Math.max(0, strength),
  };
}

/**
 * Forecast future performance
 */
export function forecastPerformance(
  campaignId: string,
  historicalData: HistoricalDataPoint[],
  daysAhead: number = 30
): PerformanceForecast[] {
  if (historicalData.length < 3) {
    return [];
  }

  const trend = analyzeTrend(historicalData);
  const seasonality = detectSeasonalPattern(historicalData, "weekly");

  const visits = historicalData.map((d) => d.visits);
  const { slope, intercept } = calculateLinearRegression(visits);

  const forecasts: PerformanceForecast[] = [];
  const lastDate = historicalData[historicalData.length - 1].date;
  const avgVisits = visits.reduce((a, b) => a + b) / visits.length;

  for (let i = 1; i <= daysAhead; i++) {
    const forecastDate = lastDate + i * 86400000; // Add days in milliseconds
    const x = historicalData.length + i - 1;

    // Trend component
    const trendComponent = slope * x + intercept;

    // Seasonal component
    const dayOfWeek = Math.floor(i / 7) % seasonality.pattern.length;
    const seasonalComponent =
      trendComponent * (seasonality.pattern[dayOfWeek] || 1);

    // Random component (small noise)
    const randomComponent = (Math.random() - 0.5) * avgVisits * 0.1;

    const predictedVisits = Math.max(
      0,
      trendComponent + seasonalComponent * 0.3 + randomComponent
    );

    // Estimate conversions based on historical ratio
    const conversionRatio =
      historicalData.reduce((sum, d) => sum + d.conversions, 0) /
      visits.reduce((a, b) => a + b);
    const predictedConversions = predictedVisits * conversionRatio;

    // Confidence interval (wider for farther dates)
    const confidenceWidth = avgVisits * 0.2 * (1 + i / daysAhead);
    const confidenceInterval = {
      lower: Math.max(0, predictedVisits - confidenceWidth),
      upper: predictedVisits + confidenceWidth,
    };

    // Calculate accuracy (decreases with forecast distance)
    const accuracy = Math.max(50, 100 - (i / daysAhead) * 30);

    forecasts.push({
      campaignId,
      forecastDate,
      predictedVisits: Math.round(predictedVisits),
      predictedConversions: Math.round(predictedConversions),
      confidenceInterval: {
        lower: Math.round(confidenceInterval.lower),
        upper: Math.round(confidenceInterval.upper),
      },
      accuracy,
      factors: {
        trend: 50,
        seasonality: 30,
        random: 20,
      },
    });
  }

  return forecasts;
}

/**
 * Suggest optimal launch timing
 */
export function suggestOptimalLaunchTiming(
  campaignId: string,
  forecasts: PerformanceForecast[],
  budget: number
): OptimalLaunchTiming {
  if (forecasts.length === 0) {
    return {
      campaignId,
      recommendedDate: Date.now() + 86400000,
      expectedPerformance: {
        visits: 0,
        conversions: 0,
        roi: 0,
      },
      reason: "Insufficient data for prediction",
      alternatives: [],
    };
  }

  // Find top 3 performing dates
  const sorted = [...forecasts]
    .sort((a, b) => b.predictedVisits - a.predictedVisits)
    .slice(0, 3);

  const recommended = sorted[0];
  const alternatives = sorted.slice(1).map((f, idx) => ({
    date: f.forecastDate,
    expectedPerformance: {
      visits: f.predictedVisits,
      conversions: f.predictedConversions,
      roi: budget > 0 ? (f.predictedConversions * 100) / budget : 0,
    },
    score: 100 - idx * 15,
  }));

  return {
    campaignId,
    recommendedDate: recommended.forecastDate,
    expectedPerformance: {
      visits: recommended.predictedVisits,
      conversions: recommended.predictedConversions,
      roi: budget > 0 ? (recommended.predictedConversions * 100) / budget : 0,
    },
    reason: `Based on historical patterns, this date shows ${recommended.predictedVisits} expected visits with ${recommended.accuracy.toFixed(0)}% confidence`,
    alternatives,
  };
}

/**
 * Generate predictive insights
 */
export function generatePredictiveInsights(
  campaignId: string,
  trend: TrendAnalysis,
  seasonality: SeasonalPattern,
  forecasts: PerformanceForecast[]
): PredictiveInsight[] {
  const insights: PredictiveInsight[] = [];

  // Trend insights
  if (trend.direction === "upward" && trend.strength > 70) {
    insights.push({
      campaignId,
      type: "trend_acceleration",
      title: "Strong Upward Trend Detected",
      description: `Your campaign is showing a strong upward trend with ${trend.strength.toFixed(0)}% strength`,
      confidence: trend.r2 * 100,
      recommendation: "Consider increasing budget to capitalize on momentum",
      impact: "high",
    });
  }

  if (trend.direction === "downward" && trend.strength > 50) {
    insights.push({
      campaignId,
      type: "trend_deceleration",
      title: "Downward Trend Detected",
      description: `Performance is declining with ${trend.strength.toFixed(0)}% strength`,
      confidence: trend.r2 * 100,
      recommendation: "Review campaign strategy and consider optimization",
      impact: "high",
    });
  }

  // Seasonality insights
  if (seasonality.strength > 60) {
    const peakIdx = seasonality.pattern.indexOf(Math.max(...seasonality.pattern));
    insights.push({
      campaignId,
      type: "seasonal_peak",
      title: "Seasonal Peak Identified",
      description: `Strong seasonal pattern detected. Peak performance occurs around day ${peakIdx}`,
      confidence: 85,
      recommendation: "Schedule major campaigns during seasonal peaks for maximum impact",
      impact: "high",
    });
  }

  // Forecast insights
  if (forecasts.length > 0) {
    const avgForecast = forecasts.reduce((sum, f) => sum + f.predictedVisits, 0) / forecasts.length;
    const maxForecast = Math.max(...forecasts.map((f) => f.predictedVisits));

    if (maxForecast > avgForecast * 1.5) {
      insights.push({
        campaignId,
        type: "opportunity",
        title: "Performance Opportunity",
        description: `Forecasts show significant variation, with peak performance ${((maxForecast / avgForecast - 1) * 100).toFixed(0)}% above average`,
        confidence: 75,
        recommendation: "Target the high-performance period for maximum ROI",
        impact: "medium",
      });
    }
  }

  return insights;
}

/**
 * Calculate forecast accuracy metrics
 */
export function calculateForecastAccuracy(
  actual: HistoricalDataPoint[],
  predicted: PerformanceForecast[]
): ForecastMetrics {
  if (actual.length === 0 || predicted.length === 0) {
    return { mae: 0, rmse: 0, mape: 0, accuracy: 0 };
  }

  const errors: number[] = [];
  const percentErrors: number[] = [];

  for (let i = 0; i < Math.min(actual.length, predicted.length); i++) {
    const error = Math.abs(actual[i].visits - predicted[i].predictedVisits);
    errors.push(error);

    if (actual[i].visits > 0) {
      percentErrors.push((error / actual[i].visits) * 100);
    }
  }

  const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
  const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e ** 2, 0) / errors.length);
  const mape = percentErrors.reduce((a, b) => a + b, 0) / percentErrors.length;
  const accuracy = Math.max(0, 100 - mape);

  return { mae, rmse, mape, accuracy };
}
