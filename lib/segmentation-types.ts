export type TrafficSource = "organic" | "social" | "direct" | "referral" | "paid" | "email";
export type DeviceType = "mobile" | "desktop" | "tablet";
export type BrowserType = "chrome" | "safari" | "firefox" | "edge" | "other";
export type AgeGroup = "13-17" | "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";
export type Gender = "male" | "female" | "other";
export type InterestCategory = "technology" | "business" | "health" | "lifestyle" | "entertainment" | "sports" | "education" | "finance";

export interface DemographicProfile {
  ageGroups: AgeGroup[];
  genders: Gender[];
  interests: InterestCategory[];
  languages: string[];
  countries: string[];
  cities: string[];
}

export interface BehavioralProfile {
  sessionDuration: {
    min: number; // seconds
    max: number;
  };
  pageViewsPerSession: {
    min: number;
    max: number;
  };
  bounceRate: {
    min: number; // percentage
    max: number;
  };
  returnVisitorRatio: {
    min: number; // percentage
    max: number;
  };
  conversionProbability: {
    min: number; // percentage
    max: number;
  };
}

export interface DeviceProfile {
  deviceTypes: DeviceType[];
  browsers: BrowserType[];
  operatingSystems: string[];
  screenSizes: string[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  trafficSources: TrafficSource[];
  demographics: DemographicProfile;
  behavior: BehavioralProfile;
  devices: DeviceProfile;
  size: number; // estimated audience size
  engagement: number; // 0-100, engagement score
  conversionRate: number; // percentage
  averageOrderValue: number;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface SegmentPerformance {
  segmentId: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  revenue: number;
  roi: number;
  period: "day" | "week" | "month";
  date: number;
}

export interface SegmentRule {
  id: string;
  type: "traffic_source" | "demographic" | "behavioral" | "device";
  operator: "equals" | "contains" | "greater_than" | "less_than" | "between";
  field: string;
  value: string | number | string[];
}

export interface SegmentBuilder {
  name: string;
  rules: SegmentRule[];
  combineWith: "AND" | "OR";
  excludeRules: SegmentRule[];
}

export interface AudienceProfile {
  segmentId: string;
  campaignId: string;
  targetingStrategy: "broad" | "narrow" | "lookalike";
  bidMultiplier: number; // 0.5 - 2.0
  budgetAllocation: number; // percentage
  priority: "low" | "medium" | "high";
  createdAt: number;
}
