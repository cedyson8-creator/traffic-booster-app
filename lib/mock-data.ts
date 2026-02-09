import type { Website, Campaign, TrafficStats, TrafficSource, GeographicData, TopPage } from './types';

export const mockWebsites: Website[] = [
  {
    id: '1',
    name: 'Tech Blog',
    url: 'https://techblog.example.com',
    category: 'blog',
    verified: true,
    addedDate: '2026-01-15',
    totalVisits: 245680,
    monthlyVisits: 45230,
    weeklyGrowth: 12.5,
    activeCampaigns: 2,
  },
  {
    id: '2',
    name: 'Online Store',
    url: 'https://shop.example.com',
    category: 'ecommerce',
    verified: true,
    addedDate: '2026-01-20',
    totalVisits: 128450,
    monthlyVisits: 28900,
    weeklyGrowth: 8.3,
    activeCampaigns: 1,
  },
  {
    id: '3',
    name: 'Portfolio Site',
    url: 'https://portfolio.example.com',
    category: 'portfolio',
    verified: true,
    addedDate: '2026-02-01',
    totalVisits: 12340,
    monthlyVisits: 5600,
    weeklyGrowth: 15.7,
    activeCampaigns: 0,
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'c1',
    websiteId: '1',
    name: 'Social Media Boost',
    type: 'social',
    status: 'active',
    targetVisits: 50000,
    currentVisits: 32400,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    budget: 500,
  },
  {
    id: 'c2',
    websiteId: '1',
    name: 'SEO Optimization',
    type: 'seo',
    status: 'active',
    targetVisits: 30000,
    currentVisits: 18200,
    startDate: '2026-02-05',
    endDate: '2026-03-05',
    budget: 300,
  },
  {
    id: 'c3',
    websiteId: '2',
    name: 'Content Promotion',
    type: 'content',
    status: 'active',
    targetVisits: 25000,
    currentVisits: 15600,
    startDate: '2026-02-03',
    endDate: '2026-02-24',
    budget: 400,
  },
];

export const generateTrafficStats = (days: number): TrafficStats[] => {
  const stats: TrafficStats[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const baseVisits = 1000 + Math.random() * 500;
    const trend = (days - i) / days;
    const visits = Math.floor(baseVisits * (1 + trend * 0.3));
    
    stats.push({
      date: date.toISOString().split('T')[0],
      visits,
      uniqueVisitors: Math.floor(visits * 0.75),
      bounceRate: 35 + Math.random() * 20,
      avgSessionDuration: 120 + Math.random() * 180,
    });
  }
  
  return stats;
};

export const mockTrafficSources: TrafficSource[] = [
  { source: 'direct', visits: 12500, percentage: 35 },
  { source: 'social', visits: 10700, percentage: 30 },
  { source: 'search', visits: 8900, percentage: 25 },
  { source: 'referral', visits: 3570, percentage: 10 },
];

export const mockGeographicData: GeographicData[] = [
  { country: 'United States', visits: 15200, percentage: 42 },
  { country: 'United Kingdom', visits: 5800, percentage: 16 },
  { country: 'Canada', visits: 4300, percentage: 12 },
  { country: 'Germany', visits: 3600, percentage: 10 },
  { country: 'Australia', visits: 2900, percentage: 8 },
  { country: 'Others', visits: 4370, percentage: 12 },
];

export const mockTopPages: TopPage[] = [
  { url: '/blog/getting-started', visits: 5600, bounceRate: 32 },
  { url: '/products/featured', visits: 4800, bounceRate: 28 },
  { url: '/about', visits: 3200, bounceRate: 45 },
  { url: '/blog/advanced-tips', visits: 2900, bounceRate: 38 },
  { url: '/contact', visits: 2400, bounceRate: 52 },
];
