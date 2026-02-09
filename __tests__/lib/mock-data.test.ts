import { describe, it, expect } from 'vitest';
import { 
  mockWebsites, 
  mockCampaigns, 
  generateTrafficStats, 
  mockTrafficSources,
  mockGeographicData,
  mockTopPages 
} from '../../lib/mock-data';

describe('Mock Data', () => {
  describe('mockWebsites', () => {
    it('should have valid website data', () => {
      expect(mockWebsites).toBeDefined();
      expect(mockWebsites.length).toBeGreaterThan(0);
      
      mockWebsites.forEach(website => {
        expect(website.id).toBeDefined();
        expect(website.name).toBeDefined();
        expect(website.url).toMatch(/^https?:\/\//);
        expect(website.verified).toBe(true);
        expect(website.totalVisits).toBeGreaterThan(0);
        expect(website.monthlyVisits).toBeGreaterThan(0);
        expect(website.weeklyGrowth).toBeGreaterThan(0);
        expect(website.activeCampaigns).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('mockCampaigns', () => {
    it('should have valid campaign data', () => {
      expect(mockCampaigns).toBeDefined();
      expect(mockCampaigns.length).toBeGreaterThan(0);
      
      mockCampaigns.forEach(campaign => {
        expect(campaign.id).toBeDefined();
        expect(campaign.websiteId).toBeDefined();
        expect(campaign.name).toBeDefined();
        expect(['social', 'content', 'seo']).toContain(campaign.type);
        expect(['active', 'paused', 'completed']).toContain(campaign.status);
        expect(campaign.targetVisits).toBeGreaterThan(0);
        expect(campaign.currentVisits).toBeGreaterThanOrEqual(0);
        expect(campaign.currentVisits).toBeLessThanOrEqual(campaign.targetVisits);
        expect(campaign.budget).toBeGreaterThan(0);
      });
    });
  });

  describe('generateTrafficStats', () => {
    it('should generate correct number of days', () => {
      const stats7 = generateTrafficStats(7);
      const stats30 = generateTrafficStats(30);
      
      expect(stats7.length).toBe(7);
      expect(stats30.length).toBe(30);
    });

    it('should have valid traffic data', () => {
      const stats = generateTrafficStats(7);
      
      stats.forEach(stat => {
        expect(stat.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(stat.visits).toBeGreaterThan(0);
        expect(stat.uniqueVisitors).toBeGreaterThan(0);
        expect(stat.uniqueVisitors).toBeLessThanOrEqual(stat.visits);
        expect(stat.bounceRate).toBeGreaterThan(0);
        expect(stat.bounceRate).toBeLessThan(100);
        expect(stat.avgSessionDuration).toBeGreaterThan(0);
      });
    });

    it('should show growth trend', () => {
      const stats = generateTrafficStats(30);
      const firstWeek = stats.slice(0, 7).reduce((sum, s) => sum + s.visits, 0) / 7;
      const lastWeek = stats.slice(-7).reduce((sum, s) => sum + s.visits, 0) / 7;
      
      expect(lastWeek).toBeGreaterThan(firstWeek);
    });
  });

  describe('mockTrafficSources', () => {
    it('should have valid traffic sources', () => {
      expect(mockTrafficSources).toBeDefined();
      expect(mockTrafficSources.length).toBeGreaterThan(0);
      
      const totalPercentage = mockTrafficSources.reduce((sum, s) => sum + s.percentage, 0);
      expect(totalPercentage).toBe(100);
      
      mockTrafficSources.forEach(source => {
        expect(['direct', 'social', 'referral', 'search']).toContain(source.source);
        expect(source.visits).toBeGreaterThan(0);
        expect(source.percentage).toBeGreaterThan(0);
        expect(source.percentage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('mockGeographicData', () => {
    it('should have valid geographic data', () => {
      expect(mockGeographicData).toBeDefined();
      expect(mockGeographicData.length).toBeGreaterThan(0);
      
      const totalPercentage = mockGeographicData.reduce((sum, g) => sum + g.percentage, 0);
      expect(totalPercentage).toBe(100);
      
      mockGeographicData.forEach(geo => {
        expect(geo.country).toBeDefined();
        expect(geo.visits).toBeGreaterThan(0);
        expect(geo.percentage).toBeGreaterThan(0);
        expect(geo.percentage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('mockTopPages', () => {
    it('should have valid top pages data', () => {
      expect(mockTopPages).toBeDefined();
      expect(mockTopPages.length).toBeGreaterThan(0);
      
      mockTopPages.forEach(page => {
        expect(page.url).toMatch(/^\//);
        expect(page.visits).toBeGreaterThan(0);
        expect(page.bounceRate).toBeGreaterThan(0);
        expect(page.bounceRate).toBeLessThan(100);
      });
    });

    it('should be sorted by visits descending', () => {
      for (let i = 0; i < mockTopPages.length - 1; i++) {
        expect(mockTopPages[i].visits).toBeGreaterThanOrEqual(mockTopPages[i + 1].visits);
      }
    });
  });
});
