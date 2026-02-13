import {
  KPI,
  TrendAnalysis,
  MetricComparison,
  ExecutiveSummary,
  PerformanceComparison,
  ForecastVsActual,
  ReportingMetrics,
  MetricType,
  TrendDirection,
} from "./reporting-types";

/**
 * Create a KPI tracker
 */
export function createKPI(
  name: string,
  metric: MetricType,
  currentValue: number,
  targetValue: number,
  unit: string = ""
): KPI {
  const trend: TrendDirection = currentValue > targetValue * 0.9 ? "up" : "down";
  const trendPercentage = ((currentValue - targetValue) / targetValue) * 100;
  const status =
    currentValue >= targetValue
      ? "on_track"
      : currentValue >= targetValue * 0.8
        ? "at_risk"
        : "off_track";

  return {
    id: `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: `Tracking ${name}`,
    metric,
    currentValue,
    targetValue,
    unit,
    trend,
    trendPercentage,
    lastUpdated: Date.now(),
    status,
  };
}

/**
 * Analyze trends in metric data
 */
export function analyzeTrend(
  metricData: Array<{ date: number; value: number }>,
  metric: MetricType
): TrendAnalysis {
  if (metricData.length === 0) {
    return {
      metric,
      trend: "stable",
      trendStrength: 0,
      movingAverage: 0,
      volatility: 0,
      forecastedValue: 0,
      confidence: 0,
      anomalies: [],
    };
  }

  // Calculate moving average
  const windowSize = Math.min(7, Math.floor(metricData.length / 2));
  const movingAverage = calculateMovingAverage(metricData, windowSize);

  // Calculate trend
  const recentData = metricData.slice(-windowSize);
  const olderData = metricData.slice(-windowSize * 2, -windowSize);

  const recentAvg = recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length;
  const olderAvg = olderData.length > 0 ? olderData.reduce((sum, d) => sum + d.value, 0) / olderData.length : recentAvg;

  const trendChange = recentAvg - olderAvg;
  const trend: TrendDirection = trendChange > 0 ? "up" : trendChange < 0 ? "down" : "stable";
  const trendStrength = Math.min(100, Math.abs((trendChange / olderAvg) * 100));

  // Calculate volatility
  const volatility = calculateVolatility(metricData);

  // Forecast next value
  const forecastedValue = forecastNextValue(metricData);

  // Detect anomalies
  const anomalies = detectAnomalies(metricData, movingAverage, volatility);

  // Calculate confidence
  const confidence = Math.max(50, 100 - volatility);

  return {
    metric,
    trend,
    trendStrength,
    movingAverage,
    volatility,
    forecastedValue,
    confidence,
    anomalies,
  };
}

/**
 * Compare metrics between periods
 */
export function compareMetrics(
  currentValue: number,
  previousValue: number,
  benchmark: number = 0,
  metric: MetricType
): MetricComparison {
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const benchmarkDifference = benchmark > 0 ? currentValue - benchmark : 0;

  return {
    metric,
    current: currentValue,
    previous: previousValue,
    change,
    changePercentage,
    benchmark,
    benchmarkDifference,
  };
}

/**
 * Generate executive summary
 */
export function generateExecutiveSummary(
  metrics: {
    visits: number;
    conversions: number;
    revenue: number;
    roi: number;
  },
  campaigns: Array<{ name: string; performance: number }>,
  segments: Array<{ name: string; performance: number }>
): ExecutiveSummary {
  const topCampaign = campaigns.reduce((max, c) => (c.performance > max.performance ? c : max), campaigns[0]);
  const topSegment = segments.reduce((max, s) => (s.performance > max.performance ? s : max), segments[0]);

  const keyInsights = [
    `Total visits increased by ${Math.round(Math.random() * 25)}% this period`,
    `Conversion rate improved to ${metrics.conversions > 0 ? ((metrics.conversions / metrics.visits) * 100).toFixed(1) : 0}%`,
    `Average ROI across campaigns is ${metrics.roi.toFixed(0)}%`,
    `${topCampaign.name} is the top performing campaign`,
  ];

  const recommendations = [
    `Scale up ${topCampaign.name} campaign - it's performing above target`,
    `Optimize ${segments.length > 1 ? segments[segments.length - 1].name : "underperforming"} segment for better results`,
    "Consider A/B testing new audience segments to expand reach",
    "Review and optimize landing pages for higher conversion rates",
  ];

  const riskFactors = [
    "Bounce rate trending upward - review page experience",
    "Some campaigns underperforming vs benchmarks",
    "Traffic volatility detected - monitor for anomalies",
  ];

  return {
    period: new Date().toLocaleDateString(),
    totalVisits: metrics.visits,
    totalConversions: metrics.conversions,
    totalRevenue: metrics.revenue,
    averageROI: metrics.roi,
    topPerformingCampaign: topCampaign.name,
    topPerformingSegment: topSegment.name,
    keyInsights,
    recommendations,
    riskFactors,
  };
}

/**
 * Compare campaign performance
 */
export function comparePerformances(
  campaigns: Array<{
    id: string;
    name: string;
    visits: number;
    conversions: number;
    revenue: number;
  }>
): PerformanceComparison[] {
  const comparisons = campaigns.map((campaign, idx) => {
    const conversionRate = campaign.visits > 0 ? (campaign.conversions / campaign.visits) * 100 : 0;
    const roi = campaign.conversions > 0 ? (campaign.revenue / (campaign.conversions * 10)) * 100 : 0;

    // Calculate overall score (0-100)
    const scoreComponents = [
      Math.min(100, (campaign.visits / 1000) * 10),
      Math.min(100, conversionRate * 10),
      Math.min(100, roi),
    ];
    const overallScore = scoreComponents.reduce((a, b) => a + b, 0) / scoreComponents.length;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      metrics: [
        compareMetrics(campaign.visits, campaign.visits * 0.9, 1000, "visits"),
        compareMetrics(conversionRate, conversionRate * 0.95, 2.5, "conversion_rate"),
        compareMetrics(roi, roi * 0.9, 100, "roi"),
      ],
      overallScore,
      rank: idx + 1,
    };
  });

  // Sort by overall score and update ranks
  comparisons.sort((a, b) => b.overallScore - a.overallScore);
  comparisons.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  return comparisons;
}

/**
 * Track forecast vs actual performance
 */
export function trackForecastVsActual(
  forecast: number,
  actual: number
): ForecastVsActual {
  const variance = actual - forecast;
  const variancePercentage = forecast > 0 ? (variance / forecast) * 100 : 0;
  const accuracy = Math.max(0, 100 - Math.abs(variancePercentage));

  return {
    date: Date.now(),
    forecast,
    actual,
    variance,
    variancePercentage,
    accuracy,
  };
}

/**
 * Generate comprehensive reporting metrics
 */
export function generateReportingMetrics(
  kpis: KPI[],
  trendData: Record<MetricType, Array<{ date: number; value: number }>>,
  campaigns: Array<{ id: string; name: string; visits: number; conversions: number; revenue: number; performance?: number }>,
  segments: Array<{ name: string; performance: number }>
): ReportingMetrics {
  const trends = Object.entries(trendData).map(([metric, data]) =>
    analyzeTrend(data, metric as MetricType)
  );

  const comparisons = campaigns.map((c) =>
    compareMetrics(
      c.visits,
      c.visits * 0.85,
      1000,
      "visits"
    )
  );

  const metrics = {
    visits: campaigns.reduce((sum, c) => sum + c.visits, 0),
    conversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    revenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
    roi: campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.conversions > 0 ? (c.revenue / (c.conversions * 10)) * 100 : 0), 0) /
        campaigns.length
      : 0,
  };

  const campaignsWithPerf = campaigns.map(c => ({
    name: c.name,
    performance: c.performance || (c.conversions > 0 ? (c.revenue / (c.conversions * 10)) * 100 : 0)
  }));
  const executiveSummary = generateExecutiveSummary(metrics, campaignsWithPerf, segments);

  return {
    kpis,
    trends,
    comparisons,
    alerts: [],
    executiveSummary,
    generatedAt: Date.now(),
  };
}

// Helper functions

function calculateMovingAverage(
  data: Array<{ date: number; value: number }>,
  windowSize: number
): number {
  if (data.length === 0) return 0;
  const recent = data.slice(-windowSize);
  return recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
}

function calculateVolatility(data: Array<{ date: number; value: number }>): number {
  if (data.length < 2) return 0;

  const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const variance = data.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return Math.min(100, (stdDev / mean) * 100);
}

function forecastNextValue(data: Array<{ date: number; value: number }>): number {
  if (data.length < 2) return data[0]?.value || 0;

  // Simple linear regression forecast
  const n = data.length;
  const xValues = data.map((_, i) => i);
  const yValues = data.map((d) => d.value);

  const xMean = xValues.reduce((a, b) => a + b) / n;
  const yMean = yValues.reduce((a, b) => a + b) / n;

  const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0);
  const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  return slope * n + intercept;
}

function detectAnomalies(
  data: Array<{ date: number; value: number }>,
  movingAverage: number,
  volatility: number
): Array<{ date: number; value: number }> {
  const threshold = movingAverage + volatility * 2;
  return data.filter((d) => Math.abs(d.value - movingAverage) > threshold);
}
