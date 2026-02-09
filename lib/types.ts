export interface Website {
  id: string;
  name: string;
  url: string;
  category: 'blog' | 'ecommerce' | 'portfolio' | 'business' | 'other';
  verified: boolean;
  addedDate: string;
  totalVisits: number;
  monthlyVisits: number;
  weeklyGrowth: number;
  activeCampaigns: number;
}

export interface Campaign {
  id: string;
  websiteId: string;
  name: string;
  type: 'social' | 'content' | 'seo';
  status: 'active' | 'paused' | 'completed';
  targetVisits: number;
  currentVisits: number;
  startDate: string;
  endDate: string;
  budget: number;
}

export interface TrafficStats {
  date: string;
  visits: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface TrafficSource {
  source: 'direct' | 'social' | 'referral' | 'search';
  visits: number;
  percentage: number;
}

export interface GeographicData {
  country: string;
  visits: number;
  percentage: number;
}

export interface TopPage {
  url: string;
  visits: number;
  bounceRate: number;
}
