import {
  AudienceSegment,
  SegmentPerformance,
  SegmentRule,
  DemographicProfile,
  BehavioralProfile,
  DeviceProfile,
  AgeGroup,
  Gender,
  InterestCategory,
  TrafficSource,
  DeviceType,
  BrowserType,
} from "./segmentation-types";

/**
 * Create a new audience segment
 */
export function createSegment(
  name: string,
  description: string,
  trafficSources: TrafficSource[] = [],
  demographics: Partial<DemographicProfile> = {},
  behavior: Partial<BehavioralProfile> = {},
  devices: Partial<DeviceProfile> = {}
): AudienceSegment {
  const id = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    name,
    description,
    trafficSources,
    demographics: {
      ageGroups: demographics.ageGroups || [],
      genders: demographics.genders || [],
      interests: demographics.interests || [],
      languages: demographics.languages || [],
      countries: demographics.countries || [],
      cities: demographics.cities || [],
    },
    behavior: {
      sessionDuration: behavior.sessionDuration || { min: 0, max: Infinity },
      pageViewsPerSession: behavior.pageViewsPerSession || { min: 0, max: Infinity },
      bounceRate: behavior.bounceRate || { min: 0, max: 100 },
      returnVisitorRatio: behavior.returnVisitorRatio || { min: 0, max: 100 },
      conversionProbability: behavior.conversionProbability || { min: 0, max: 100 },
    },
    devices: {
      deviceTypes: devices.deviceTypes || [],
      browsers: devices.browsers || [],
      operatingSystems: devices.operatingSystems || [],
      screenSizes: devices.screenSizes || [],
    },
    size: 0,
    engagement: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isActive: true,
  };
}

/**
 * Estimate segment size based on criteria
 */
export function estimateSegmentSize(segment: AudienceSegment): number {
  let baseSize = 10000; // Base audience size

  // Traffic source multipliers
  const trafficSourceMultipliers: Record<TrafficSource, number> = {
    organic: 0.4,
    social: 0.25,
    direct: 0.15,
    referral: 0.12,
    paid: 0.05,
    email: 0.03,
  };

  let trafficMultiplier = 0;
  for (const source of segment.trafficSources) {
    trafficMultiplier += trafficSourceMultipliers[source] || 0;
  }

  // Demographic constraints
  let demographicMultiplier = 1;
  if (segment.demographics.ageGroups.length > 0) {
    demographicMultiplier *= (segment.demographics.ageGroups.length / 7) * 0.8;
  }
  if (segment.demographics.genders.length > 0) {
    demographicMultiplier *= (segment.demographics.genders.length / 3) * 0.9;
  }
  if (segment.demographics.countries.length > 0) {
    demographicMultiplier *= Math.min(1, segment.demographics.countries.length / 50);
  }

  // Device constraints
  let deviceMultiplier = 1;
  if (segment.devices.deviceTypes.length > 0) {
    deviceMultiplier *= (segment.devices.deviceTypes.length / 3) * 0.85;
  }

  // Behavioral constraints (stricter = smaller audience)
  let behavioralMultiplier = 1;
  const sessionDurationRange =
    segment.behavior.sessionDuration.max - segment.behavior.sessionDuration.min;
  if (sessionDurationRange < 600) {
    behavioralMultiplier *= 0.7;
  }

  const estimatedSize = Math.round(
    baseSize * (trafficMultiplier || 0.5) * demographicMultiplier * deviceMultiplier * behavioralMultiplier
  );

  return Math.max(100, estimatedSize);
}

/**
 * Calculate engagement score for a segment
 */
export function calculateEngagementScore(segment: AudienceSegment): number {
  let score = 50; // Base score

  // Traffic source engagement
  const engagementBySource: Record<TrafficSource, number> = {
    organic: 85,
    social: 70,
    direct: 75,
    referral: 80,
    paid: 65,
    email: 72,
  };

  if (segment.trafficSources.length > 0) {
    const avgEngagement =
      segment.trafficSources.reduce((sum, source) => sum + (engagementBySource[source] || 50), 0) /
      segment.trafficSources.length;
    score = (score + avgEngagement) / 2;
  }

  // Behavioral engagement
  const avgSessionDuration =
    (segment.behavior.sessionDuration.min + segment.behavior.sessionDuration.max) / 2;
  if (avgSessionDuration > 300) {
    score += 10;
  }

  const avgPageViews =
    (segment.behavior.pageViewsPerSession.min + segment.behavior.pageViewsPerSession.max) / 2;
  if (avgPageViews > 5) {
    score += 10;
  }

  const avgBounceRate =
    (segment.behavior.bounceRate.min + segment.behavior.bounceRate.max) / 2;
  if (avgBounceRate < 40) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate conversion rate for a segment
 */
export function calculateConversionRate(segment: AudienceSegment): number {
  let baseRate = 2; // Base 2% conversion rate

  // Traffic source impact
  const conversionBySource: Record<TrafficSource, number> = {
    organic: 3.5,
    social: 2.0,
    direct: 4.0,
    referral: 3.8,
    paid: 2.5,
    email: 4.5,
  };

  if (segment.trafficSources.length > 0) {
    const avgConversion =
      segment.trafficSources.reduce((sum, source) => sum + (conversionBySource[source] || 2), 0) /
      segment.trafficSources.length;
    baseRate = avgConversion;
  }

  // Behavioral impact
  const avgSessionDuration =
    (segment.behavior.sessionDuration.min + segment.behavior.sessionDuration.max) / 2;
  if (avgSessionDuration > 300) {
    baseRate *= 1.3;
  }

  const avgBounceRate =
    (segment.behavior.bounceRate.min + segment.behavior.bounceRate.max) / 2;
  if (avgBounceRate < 40) {
    baseRate *= 1.2;
  }

  // Device impact
  if (segment.devices.deviceTypes.includes("desktop")) {
    baseRate *= 1.15;
  }

  return Math.min(10, baseRate);
}

/**
 * Generate segment performance metrics
 */
export function generateSegmentPerformance(
  segment: AudienceSegment,
  visits: number
): SegmentPerformance {
  const conversionRate = calculateConversionRate(segment);
  const conversions = Math.round(visits * (conversionRate / 100));

  return {
    segmentId: segment.id,
    visits,
    conversions,
    conversionRate,
    avgSessionDuration: 240 + Math.random() * 300,
    bounceRate: 35 + Math.random() * 30,
    revenue: conversions * 50,
    roi: conversions > 0 ? ((conversions * 50) / (visits * 0.5)) * 100 : 0,
    period: "month",
    date: Date.now(),
  };
}

/**
 * Filter audience based on segment criteria
 */
export function matchesSegment(
  audience: Record<string, any>,
  segment: AudienceSegment
): boolean {
  // Check traffic source
  if (
    segment.trafficSources.length > 0 &&
    !segment.trafficSources.includes(audience.trafficSource)
  ) {
    return false;
  }

  // Check demographics
  if (
    segment.demographics.ageGroups.length > 0 &&
    !segment.demographics.ageGroups.includes(audience.ageGroup)
  ) {
    return false;
  }

  if (
    segment.demographics.genders.length > 0 &&
    !segment.demographics.genders.includes(audience.gender)
  ) {
    return false;
  }

  if (
    segment.demographics.countries.length > 0 &&
    !segment.demographics.countries.includes(audience.country)
  ) {
    return false;
  }

  // Check behavioral criteria
  if (
    audience.sessionDuration < segment.behavior.sessionDuration.min ||
    audience.sessionDuration > segment.behavior.sessionDuration.max
  ) {
    return false;
  }

  if (
    audience.pageViews < segment.behavior.pageViewsPerSession.min ||
    audience.pageViews > segment.behavior.pageViewsPerSession.max
  ) {
    return false;
  }

  if (
    audience.bounceRate < segment.behavior.bounceRate.min ||
    audience.bounceRate > segment.behavior.bounceRate.max
  ) {
    return false;
  }

  // Check device criteria
  if (
    segment.devices.deviceTypes.length > 0 &&
    !segment.devices.deviceTypes.includes(audience.deviceType)
  ) {
    return false;
  }

  if (
    segment.devices.browsers.length > 0 &&
    !segment.devices.browsers.includes(audience.browser)
  ) {
    return false;
  }

  return true;
}

/**
 * Suggest lookalike segments based on existing segment
 */
export function suggestLookalikeSegment(baseSegment: AudienceSegment): AudienceSegment {
  const lookalike = createSegment(
    `${baseSegment.name} - Lookalike`,
    `Lookalike audience based on ${baseSegment.name}`,
    baseSegment.trafficSources,
    {
      ...baseSegment.demographics,
      // Expand age groups slightly
      ageGroups: expandAgeGroups(baseSegment.demographics.ageGroups),
      // Add related interests
      interests: expandInterests(baseSegment.demographics.interests),
    },
    {
      ...baseSegment.behavior,
      // Relax behavioral constraints
      sessionDuration: {
        min: Math.max(0, baseSegment.behavior.sessionDuration.min - 60),
        max: baseSegment.behavior.sessionDuration.max + 120,
      },
      pageViewsPerSession: {
        min: Math.max(1, baseSegment.behavior.pageViewsPerSession.min - 1),
        max: baseSegment.behavior.pageViewsPerSession.max + 2,
      },
    },
    baseSegment.devices
  );

  return lookalike;
}

/**
 * Expand age groups for lookalike audiences
 */
function expandAgeGroups(ageGroups: AgeGroup[]): AgeGroup[] {
  const allAgeGroups: AgeGroup[] = [
    "13-17",
    "18-24",
    "25-34",
    "35-44",
    "45-54",
    "55-64",
    "65+",
  ];
  const expanded = new Set(ageGroups);

  for (const age of ageGroups) {
    const idx = allAgeGroups.indexOf(age);
    if (idx > 0) expanded.add(allAgeGroups[idx - 1]);
    if (idx < allAgeGroups.length - 1) expanded.add(allAgeGroups[idx + 1]);
  }

  return Array.from(expanded) as AgeGroup[];
}

/**
 * Expand interests for lookalike audiences
 */
function expandInterests(interests: InterestCategory[]): InterestCategory[] {
  const interestRelationships: Record<InterestCategory, InterestCategory[]> = {
    technology: ["business", "education"],
    business: ["technology", "finance", "education"],
    health: ["lifestyle", "education"],
    lifestyle: ["health", "entertainment"],
    entertainment: ["lifestyle", "sports"],
    sports: ["entertainment", "health"],
    education: ["technology", "business"],
    finance: ["business", "technology"],
  };

  const expanded = new Set(interests);

  for (const interest of interests) {
    const related = interestRelationships[interest] || [];
    related.forEach((rel) => expanded.add(rel));
  }

  return Array.from(expanded) as InterestCategory[];
}

/**
 * Compare two segments for similarity
 */
export function compareSegments(
  segment1: AudienceSegment,
  segment2: AudienceSegment
): number {
  let similarity = 0;
  let comparisons = 0;

  // Compare traffic sources
  const commonSources = segment1.trafficSources.filter((s) =>
    segment2.trafficSources.includes(s)
  ).length;
  if (segment1.trafficSources.length > 0 || segment2.trafficSources.length > 0) {
    const maxSources = Math.max(
      segment1.trafficSources.length,
      segment2.trafficSources.length
    );
    similarity += (commonSources / maxSources) * 100;
    comparisons++;
  }

  // Compare demographics
  const commonAges = segment1.demographics.ageGroups.filter((a) =>
    segment2.demographics.ageGroups.includes(a)
  ).length;
  if (
    segment1.demographics.ageGroups.length > 0 ||
    segment2.demographics.ageGroups.length > 0
  ) {
    const maxAges = Math.max(
      segment1.demographics.ageGroups.length,
      segment2.demographics.ageGroups.length
    );
    similarity += (commonAges / maxAges) * 100;
    comparisons++;
  }

  // Compare devices
  const commonDevices = segment1.devices.deviceTypes.filter((d) =>
    segment2.devices.deviceTypes.includes(d)
  ).length;
  if (
    segment1.devices.deviceTypes.length > 0 ||
    segment2.devices.deviceTypes.length > 0
  ) {
    const maxDevices = Math.max(
      segment1.devices.deviceTypes.length,
      segment2.devices.deviceTypes.length
    );
    similarity += (commonDevices / maxDevices) * 100;
    comparisons++;
  }

  return comparisons > 0 ? similarity / comparisons : 0;
}
