export interface HistoricalDataPoint {
  date: number; // timestamp
  visits: number;
  conversions: number;
  bounceRate: number;
  avgSessionDuration: number;
  trafficSources: Record<string, number>;
}

export interface TrendAnalysis {
  direction: "upward" | "downward" | "stable";
  strength: number; // 0-100, how strong the trend is
  slope: number; // rate of change
  r2: number; // coefficient of determination
}

export interface SeasonalPattern {
  period: "daily" | "weekly" | "monthly" | "yearly";
  pattern: number[]; // seasonal indices
  strength: number; // 0-100, how pronounced the seasonality is
}

export interface PerformanceForecast {
  campaignId: string;
  forecastDate: number;
  predictedVisits: number;
  predictedConversions: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  accuracy: number; // 0-100
  factors: {
    trend: number; // contribution percentage
    seasonality: number;
    random: number;
  };
}

export interface OptimalLaunchTiming {
  campaignId: string;
  recommendedDate: number;
  expectedPerformance: {
    visits: number;
    conversions: number;
    roi: number;
  };
  reason: string;
  alternatives: {
    date: number;
    expectedPerformance: {
      visits: number;
      conversions: number;
      roi: number;
    };
    score: number; // 0-100
  }[];
}

export interface PredictiveInsight {
  campaignId: string;
  type:
    | "trend_acceleration"
    | "trend_deceleration"
    | "seasonal_peak"
    | "seasonal_trough"
    | "anomaly"
    | "opportunity";
  title: string;
  description: string;
  confidence: number; // 0-100
  recommendation: string;
  impact: "high" | "medium" | "low";
}

export interface ForecastMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  accuracy: number; // 0-100
}
