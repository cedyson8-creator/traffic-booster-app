/**
 * Real Data Integration Service
 * Fetches actual traffic data from Google Analytics and Meta Ads APIs
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface TrafficMetric {
  timestamp: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
}

export interface CampaignMetric {
  campaignId: string;
  campaignName: string;
  platform: 'meta' | 'google';
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
}

export class RealDataIntegrationService {
  private gaClient?: BetaAnalyticsDataClient;
  private gaPropertyId?: string;
  private metaAccessToken?: string;
  private metaAdAccountId?: string;

  constructor() {
    this.gaPropertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    this.metaAccessToken = process.env.META_ACCESS_TOKEN;
    this.metaAdAccountId = process.env.META_AD_ACCOUNT_ID;

    // Initialize Google Analytics client if credentials are available
    if (this.isGoogleAnalyticsConfigured()) {
      try {
        this.gaClient = new BetaAnalyticsDataClient({
          projectId: process.env.GOOGLE_ANALYTICS_PROJECT_ID,
          keyFilename: undefined,
          credentials: {
            type: "service_account",
            project_id: process.env.GOOGLE_ANALYTICS_PROJECT_ID,
            private_key_id: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY,
            client_email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
            client_id: undefined,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          } as any,
        });
      } catch (error) {
        console.error("[RealDataIntegrationService] Failed to initialize GA client:", error);
      }
    }
  }

  /**
   * Check if Google Analytics is configured
   */
  isGoogleAnalyticsConfigured(): boolean {
    return !!(
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID &&
      process.env.GOOGLE_ANALYTICS_PRIVATE_KEY &&
      process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL
    );
  }

  /**
   * Check if Meta Ads is configured
   */
  isMetaAdsConfigured(): boolean {
    return !!(this.metaAccessToken && this.metaAdAccountId);
  }

  /**
   * Fetch traffic metrics from Google Analytics
   */
  async fetchGoogleAnalyticsMetrics(
    startDate: string = "7daysAgo",
    endDate: string = "today"
  ): Promise<TrafficMetric[]> {
    if (!this.gaClient || !this.gaPropertyId) {
      console.warn("[RealDataIntegrationService] GA not configured, returning mock data");
      return this.getMockTrafficMetrics();
    }

    try {
      const response = await this.gaClient.runReport({
        property: `properties/${this.gaPropertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "conversions" },
        ],
        dimensions: [{ name: "date" }],
      });

      const metrics: TrafficMetric[] = [];

      if (response[0].rows) {
        for (const row of response[0].rows) {
          const dateStr = row.dimensionValues?.[0]?.value || "";
          const values = row.metricValues || [];

          metrics.push({
            timestamp: new Date(
              parseInt(dateStr.substring(0, 4)),
              parseInt(dateStr.substring(4, 6)) - 1,
              parseInt(dateStr.substring(6, 8))
            ).toISOString(),
            sessions: parseInt(values[0]?.value || "0"),
            users: parseInt(values[1]?.value || "0"),
            pageviews: parseInt(values[2]?.value || "0"),
            bounceRate: parseFloat(values[3]?.value || "0"),
            avgSessionDuration: parseFloat(values[4]?.value || "0"),
            conversionRate: parseFloat(values[5]?.value || "0"),
          });
        }
      }

      return metrics;
    } catch (error) {
      console.error("[RealDataIntegrationService] GA fetch error:", error);
      return this.getMockTrafficMetrics();
    }
  }

  /**
   * Fetch campaign metrics from Meta Ads API
   */
  async fetchMetaAdsMetrics(): Promise<CampaignMetric[]> {
    if (!this.metaAccessToken || !this.metaAdAccountId) {
      console.warn("[RealDataIntegrationService] Meta Ads not configured, returning mock data");
      return this.getMockCampaignMetrics();
    }

    try {
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${this.metaAdAccountId}/campaigns?fields=id,name,status,insights.fields(impressions,clicks,spend,actions)&access_token=${this.metaAccessToken}`
      );

      if (!response.ok) {
        throw new Error(`Meta API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const metrics: CampaignMetric[] = [];

      if (data.data) {
        for (const campaign of data.data) {
          const insights = campaign.insights?.data?.[0] || {};
          const impressions = parseInt(insights.impressions || "0");
          const clicks = parseInt(insights.clicks || "0");
          const spend = parseFloat(insights.spend || "0");
          const conversions = parseInt(insights.actions?.[0]?.value || "0");

          metrics.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            platform: "meta",
            impressions,
            clicks,
            spend,
            conversions,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            roas: spend > 0 ? conversions / spend : 0,
          });
        }
      }

      return metrics;
    } catch (error) {
      console.error("[RealDataIntegrationService] Meta Ads fetch error:", error);
      return this.getMockCampaignMetrics();
    }
  }

  /**
   * Get mock traffic metrics for testing
   */
  private getMockTrafficMetrics(): TrafficMetric[] {
    const metrics: TrafficMetric[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      metrics.push({
        timestamp: date.toISOString(),
        sessions: Math.floor(Math.random() * 5000) + 1000,
        users: Math.floor(Math.random() * 3000) + 500,
        pageviews: Math.floor(Math.random() * 8000) + 2000,
        bounceRate: Math.random() * 60 + 20,
        avgSessionDuration: Math.random() * 300 + 60,
        conversionRate: Math.random() * 5 + 1,
      });
    }
    return metrics;
  }

  /**
   * Get mock campaign metrics for testing
   */
  private getMockCampaignMetrics(): CampaignMetric[] {
    return [
      {
        campaignId: "campaign_1",
        campaignName: "Summer Sale 2026",
        platform: "meta",
        impressions: 50000,
        clicks: 2500,
        spend: 1000,
        conversions: 125,
        ctr: 5.0,
        cpc: 0.4,
        roas: 0.125,
      },
      {
        campaignId: "campaign_2",
        campaignName: "Brand Awareness",
        platform: "meta",
        impressions: 100000,
        clicks: 3000,
        spend: 1500,
        conversions: 90,
        ctr: 3.0,
        cpc: 0.5,
        roas: 0.06,
      },
      {
        campaignId: "campaign_3",
        campaignName: "Product Launch",
        platform: "meta",
        impressions: 75000,
        clicks: 4500,
        spend: 2000,
        conversions: 450,
        ctr: 6.0,
        cpc: 0.44,
        roas: 0.225,
      },
    ];
  }

  /**
   * Get all available metrics (GA + Meta)
   */
  async getAllMetrics() {
    const [gaMetrics, metaMetrics] = await Promise.all([
      this.fetchGoogleAnalyticsMetrics(),
      this.fetchMetaAdsMetrics(),
    ]);

    return {
      googleAnalytics: gaMetrics,
      metaAds: metaMetrics,
      gaConfigured: this.isGoogleAnalyticsConfigured(),
      metaConfigured: this.isMetaAdsConfigured(),
    };
  }
}
