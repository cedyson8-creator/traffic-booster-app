export type NotificationType =
  | "campaign_milestone"
  | "traffic_spike"
  | "recommendation"
  | "campaign_completed"
  | "campaign_paused"
  | "ab_test_winner"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  campaignId?: string;
  testId?: string;
  websiteId?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: number;
  expiresAt?: number;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  campaignMilestones: boolean;
  trafficSpikes: boolean;
  recommendations: boolean;
  campaignCompletion: boolean;
  abTestResults: boolean;
  systemUpdates: boolean;
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

export interface NotificationEvent {
  type: NotificationType;
  campaignId?: string;
  testId?: string;
  websiteId?: string;
  data: Record<string, any>;
}

export interface CampaignMilestoneData {
  campaignName: string;
  websiteName: string;
  milestone: number; // percentage (25, 50, 75, 100)
  currentVisits: number;
  targetVisits: number;
}

export interface TrafficSpikeData {
  campaignName: string;
  websiteName: string;
  spikePercentage: number; // increase percentage
  currentVisits: number;
  previousVisits: number;
  timeWindow: string; // e.g., "last 24 hours"
}

export interface RecommendationData {
  campaignName: string;
  recommendationType: "budget" | "duration" | "targeting" | "timing" | "content";
  title: string;
  estimatedImprovement: number; // percentage
}

export interface ABTestWinnerData {
  testName: string;
  winnerVariation: string;
  improvementPercentage: number;
  significanceLevel: number; // percentage
}
