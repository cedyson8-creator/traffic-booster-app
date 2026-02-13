export type MetricType = "visits" | "conversions" | "revenue" | "roi" | "engagement" | "bounce_rate" | "avg_session" | "conversion_rate";
export type TrendDirection = "up" | "down" | "stable";
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface KPI {
  id: string;
  name: string;
  description: string;
  metric: MetricType;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: TrendDirection;
  trendPercentage: number;
  lastUpdated: number;
  status: "on_track" | "at_risk" | "off_track";
}

export interface TrendData {
  date: number;
  value: number;
  forecast?: number;
}

export interface TrendAnalysis {
  metric: MetricType;
  trend: TrendDirection;
  trendStrength: number; // 0-100
  movingAverage: number;
  volatility: number;
  forecastedValue: number;
  confidence: number; // 0-100
  anomalies: TrendData[];
}

export interface MetricComparison {
  metric: MetricType;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  benchmark: number;
  benchmarkDifference: number;
}

export interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  metrics: MetricType[];
  timeRange: "day" | "week" | "month" | "quarter" | "year" | "custom";
  refreshInterval: number; // seconds
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutiveSummary {
  period: string;
  totalVisits: number;
  totalConversions: number;
  totalRevenue: number;
  averageROI: number;
  topPerformingCampaign: string;
  topPerformingSegment: string;
  keyInsights: string[];
  recommendations: string[];
  riskFactors: string[];
}

export interface PerformanceComparison {
  campaignId: string;
  campaignName: string;
  metrics: MetricComparison[];
  overallScore: number; // 0-100
  rank: number;
}

export interface ForecastVsActual {
  date: number;
  forecast: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  accuracy: number; // 0-100
}

export interface AlertThreshold {
  id: string;
  metric: MetricType;
  operator: "greater_than" | "less_than" | "equals" | "between";
  value: number;
  upperValue?: number;
  severity: AlertSeverity;
  enabled: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: number;
}

export interface ReportAlert {
  id: string;
  thresholdId: string;
  metric: MetricType;
  currentValue: number;
  severity: AlertSeverity;
  message: string;
  createdAt: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface StakeholderReport {
  id: string;
  name: string;
  recipientEmail: string;
  frequency: "daily" | "weekly" | "monthly";
  metrics: MetricType[];
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
  isActive: boolean;
  lastSentAt?: number;
  nextSendAt: number;
  createdAt: number;
}

export interface DashboardWidget {
  id: string;
  type: "kpi" | "chart" | "table" | "gauge" | "trend";
  metric: MetricType;
  title: string;
  size: "small" | "medium" | "large";
  position: { x: number; y: number };
  refreshInterval: number;
}

export interface ReportingMetrics {
  kpis: KPI[];
  trends: TrendAnalysis[];
  comparisons: MetricComparison[];
  alerts: ReportAlert[];
  executiveSummary: ExecutiveSummary;
  generatedAt: number;
}
