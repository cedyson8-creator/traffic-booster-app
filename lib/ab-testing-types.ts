export type TestVariationType = 'headline' | 'image' | 'copy' | 'cta' | 'landing_page';

export interface TestVariation {
  id: string;
  testId: string;
  name: string; // e.g., "Variation A", "Variation B"
  type: TestVariationType;
  description: string;
  content: {
    headline?: string;
    subheadline?: string;
    imageUrl?: string;
    copyText?: string;
    ctaText?: string;
    ctaColor?: string;
  };
  trafficAllocation: number; // percentage (e.g., 50)
  visits: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  createdAt: number;
}

export interface ABTest {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  type: TestVariationType;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variations: TestVariation[];
  startDate: number;
  endDate?: number;
  minimumSampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
  winnerDetermined: boolean;
  winnerId?: string;
  statisticalSignificance: number; // percentage
  createdAt: number;
  updatedAt: number;
}

export interface TestResult {
  testId: string;
  variationId: string;
  winner: boolean;
  conversionRate: number;
  confidence: number; // 0-100
  pValue: number; // statistical p-value
  improvement: number; // percentage improvement over baseline
  recommendation: string;
}

export interface ABTestMetrics {
  testId: string;
  totalVisits: number;
  totalConversions: number;
  overallConversionRate: number;
  bestVariation: {
    id: string;
    name: string;
    conversionRate: number;
    improvement: number;
  };
  worstVariation: {
    id: string;
    name: string;
    conversionRate: number;
  };
  statisticalSignificance: number;
  recommendedAction: 'continue' | 'stop' | 'declare_winner' | 'increase_sample';
}
