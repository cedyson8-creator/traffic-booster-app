import type { Campaign } from "./types";

export interface Recommendation {
  id: string;
  campaignId: string;
  type: "budget" | "duration" | "targeting" | "timing" | "content";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  suggestion: string;
  estimatedImprovement: number; // percentage
  priority: number; // 1-10
  createdAt: number;
}

export interface CampaignMetrics {
  campaignId: string;
  totalVisits: number;
  targetVisits: number;
  totalCost: number;
  costPerVisit: number;
  roi: number; // percentage
  conversionRate: number;
  trafficSources: Record<string, number>;
  dailyProgress: number[];
  completionPercentage: number;
}

/**
 * Analyze campaign performance and generate recommendations
 */
export function analyzeCampaignPerformance(
  campaign: Campaign,
  metrics: CampaignMetrics
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Budget Recommendations
  const dailyBudget = campaign.budget / campaign.duration;
  if (metrics.roi < 50) {
    recommendations.push({
      id: `rec-${campaign.id}-budget-reduce`,
      campaignId: campaign.id,
      type: "budget",
      title: "Reduce Campaign Budget",
      description: `Current ROI is ${metrics.roi.toFixed(1)}%, which is below target. Consider reducing budget allocation.`,
      impact: "high",
      suggestion: `Reduce daily budget from $${dailyBudget.toFixed(2)} to $${(
        dailyBudget * 0.7
      ).toFixed(2)} and monitor performance.`,
      estimatedImprovement: 15,
      priority: 9,
      createdAt: Date.now(),
    });
  } else if (metrics.roi > 150 && metrics.completionPercentage < 80) {
    recommendations.push({
      id: `rec-${campaign.id}-budget-increase`,
      campaignId: campaign.id,
      type: "budget",
      title: "Increase Campaign Budget",
      description: `High ROI (${metrics.roi.toFixed(1)}%) suggests room for budget increase to reach target faster.`,
      impact: "high",
      suggestion: `Increase daily budget from $${dailyBudget.toFixed(2)} to $${(
        dailyBudget * 1.3
      ).toFixed(2)} to accelerate campaign.`,
      estimatedImprovement: 25,
      priority: 8,
      createdAt: Date.now(),
    });
  }

  // Duration Recommendations
  const startDate = new Date(campaign.startDate).getTime();
  const daysElapsed = Math.ceil((Date.now() - startDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = campaign.duration - daysElapsed;
  const dailyTarget = (campaign.targetVisits - metrics.totalVisits) / Math.max(daysRemaining, 1);
  const currentDailyRate = metrics.totalVisits / Math.max(daysElapsed, 1);

  if (currentDailyRate < dailyTarget * 0.7) {
    recommendations.push({
      id: `rec-${campaign.id}-duration-extend`,
      campaignId: campaign.id,
      type: "duration",
      title: "Extend Campaign Duration",
      description: `Current daily traffic rate (${currentDailyRate.toFixed(0)}/day) is below target (${dailyTarget.toFixed(0)}/day).`,
      impact: "medium",
      suggestion: `Extend campaign duration by ${Math.ceil((campaign.duration * 0.3) / 7)} weeks to maintain sustainable daily budget.`,
      estimatedImprovement: 20,
      priority: 7,
      createdAt: Date.now(),
    });
  } else if (currentDailyRate > dailyTarget * 1.3 && daysRemaining > 7) {
    recommendations.push({
      id: `rec-${campaign.id}-duration-reduce`,
      campaignId: campaign.id,
      type: "duration",
      title: "Reduce Campaign Duration",
      description: `Campaign is progressing faster than planned. Target can be reached earlier.`,
      impact: "medium",
      suggestion: `Reduce campaign duration by ${Math.ceil((campaign.duration * 0.2) / 7)} weeks to save budget.`,
      estimatedImprovement: 15,
      priority: 6,
      createdAt: Date.now(),
    });
  }

  // Targeting Recommendations
  const topSource = Object.entries(metrics.trafficSources).sort(([, a], [, b]) => b - a)[0];
  if (topSource && topSource[1] > metrics.totalVisits * 0.5) {
    recommendations.push({
      id: `rec-${campaign.id}-targeting-focus`,
      campaignId: campaign.id,
      type: "targeting",
      title: "Focus on Top Traffic Source",
      description: `${topSource[0]} accounts for ${(
        (topSource[1] / metrics.totalVisits) *
        100
      ).toFixed(1)}% of traffic. This is your most effective channel.`,
      impact: "high",
      suggestion: `Allocate 60-70% of budget to ${topSource[0]} and test other channels with remaining budget.`,
      estimatedImprovement: 30,
      priority: 9,
      createdAt: Date.now(),
    });
  }

  // Timing Recommendations
  const startDate2 = new Date(campaign.startDate).getTime();
  const daysElapsed2 = Math.ceil((Date.now() - startDate2) / (1000 * 60 * 60 * 24));
  const avgDailyVisits = metrics.totalVisits / Math.max(daysElapsed2, 1);
  const variance = calculateVariance(metrics.dailyProgress);

  if (variance > avgDailyVisits * 0.5) {
    recommendations.push({
      id: `rec-${campaign.id}-timing-optimize`,
      campaignId: campaign.id,
      type: "timing",
      title: "Optimize Campaign Timing",
      description: `High variance in daily traffic (${variance.toFixed(0)}) suggests inconsistent scheduling.`,
      impact: "medium",
      suggestion: `Distribute budget evenly across peak hours (9AM-5PM) and test different time slots.`,
      estimatedImprovement: 12,
      priority: 5,
      createdAt: Date.now(),
    });
  }

  // Content Recommendations
  if (metrics.conversionRate < 2) {
    recommendations.push({
      id: `rec-${campaign.id}-content-improve`,
      campaignId: campaign.id,
      type: "content",
      title: "Improve Content Quality",
      description: `Conversion rate is ${metrics.conversionRate.toFixed(2)}%, below industry average of 2-3%.`,
      impact: "high",
      suggestion: `Review landing page copy, add social proof, improve call-to-action, and test different headlines.`,
      estimatedImprovement: 35,
      priority: 8,
      createdAt: Date.now(),
    });
  }

  // Sort by priority
  return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate campaign metrics from raw data
 */
export function calculateCampaignMetrics(
  campaign: Campaign,
  trafficData: number[] = [],
  costData: number[] = []
): CampaignMetrics {
  const totalVisits = trafficData.length > 0 ? trafficData.reduce((a, b) => a + b, 0) : campaign.currentVisits;
  const totalCost = costData.length > 0 ? costData.reduce((a, b) => a + b, 0) : campaign.budget;
  const costPerVisit = totalVisits > 0 ? totalCost / totalVisits : 0;
  const roi = totalCost > 0 ? ((totalVisits * 10 - totalCost) / totalCost) * 100 : 0; // Assuming $10 per visit value
  const completionPercentage = (totalVisits / campaign.targetVisits) * 100;

  return {
    campaignId: campaign.id,
    totalVisits,
    targetVisits: campaign.targetVisits,
    totalCost,
    costPerVisit,
    roi,
    conversionRate: totalVisits > 0 ? (totalVisits * 0.02) : 0, // Simulate 2% conversion
    trafficSources: {
      organic: totalVisits * 0.3,
      social: totalVisits * 0.4,
      paid: totalVisits * 0.2,
      direct: totalVisits * 0.1,
    },
    dailyProgress: trafficData,
    completionPercentage,
  };
}

/**
 * Calculate variance of daily progress
 */
function calculateVariance(data: number[]): number {
  if (data.length === 0) return 0;

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;

  return Math.sqrt(variance);
}

/**
 * Get recommendation action items
 */
export function getRecommendationActions(recommendation: Recommendation): string[] {
  const actions: string[] = [];

  switch (recommendation.type) {
    case "budget":
      actions.push("Review current budget allocation");
      actions.push("Analyze cost per visit trends");
      actions.push("Compare with industry benchmarks");
      break;

    case "duration":
      actions.push("Calculate new campaign timeline");
      actions.push("Adjust daily budget accordingly");
      actions.push("Update campaign end date");
      break;

    case "targeting":
      actions.push("Segment audience by traffic source");
      actions.push("Create source-specific campaigns");
      actions.push("Test new targeting parameters");
      break;

    case "timing":
      actions.push("Analyze hourly traffic patterns");
      actions.push("Identify peak performance times");
      actions.push("Schedule budget distribution");
      break;

    case "content":
      actions.push("A/B test different headlines");
      actions.push("Improve landing page design");
      actions.push("Add customer testimonials");
      break;
  }

  return actions;
}

/**
 * Calculate potential ROI improvement
 */
export function calculateProjectedROI(
  currentMetrics: CampaignMetrics,
  recommendation: Recommendation
): number {
  const improvementFactor = 1 + recommendation.estimatedImprovement / 100;
  const projectedVisits = currentMetrics.totalVisits * improvementFactor;
  const projectedROI = ((projectedVisits * 10 - currentMetrics.totalCost) / currentMetrics.totalCost) * 100;

  return projectedROI;
}
