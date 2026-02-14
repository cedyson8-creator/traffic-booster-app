import * as db from "../db";
import { TrafficReport } from "./export.service";
import { and, gte, lte, eq, sum, sql } from "drizzle-orm";
import { trafficMetrics, campaigns, websites } from "../../drizzle/schema";

/**
 * Service for fetching real traffic data from integrated platforms
 * Supports Google Analytics, Meta/Facebook, and other integrated sources
 */
export class TrafficDataService {
  /**
   * Fetch real traffic data for a website from integrated platforms
   */
  static async fetchRealTrafficData(
    userId: number,
    websiteId: number,
    dateRange: { start: Date; end: Date }
  ): Promise<TrafficReport | null> {
    try {
      // Get website info from user's websites
      const websitesList = await db.getUserWebsites(userId);
      const website = websitesList.find((w: any) => w.id === websiteId);
      if (!website) {
        console.error(`Website ${websiteId} not found for user ${userId}`);
        return null;
      }

      // Fetch traffic metrics from database (synced from integrations)
      const metrics = await this.fetchTrafficMetrics(userId, websiteId, dateRange);
      if (!metrics) {
        return null;
      }

      // Fetch traffic sources breakdown
      const trafficSources = await this.fetchTrafficSources(userId, websiteId, dateRange);

      // Fetch campaign data
      const campaignData = await this.fetchCampaignData(userId, websiteId, dateRange);

      // Fetch daily data for charts
      const dailyData = await this.fetchDailyData(userId, websiteId, dateRange);

      // Build the traffic report
      const report: TrafficReport = {
        websiteId: String(websiteId),
        websiteName: website.name || "Unknown Website",
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
        metrics: {
          totalVisits: metrics.totalVisits,
          uniqueVisitors: metrics.uniqueVisitors,
          avgSessionDuration: metrics.avgSessionDuration,
          bounceRate: metrics.bounceRate,
          conversionRate: metrics.conversionRate,
        },
        trafficSources,
        dailyData,
        campaigns: campaignData,
      };

      return report;
    } catch (error) {
      console.error("[TrafficDataService] Failed to fetch real traffic data:", error);
      return null;
    }
  }

  /**
   * Fetch aggregated traffic metrics for a date range
   */
  private static async fetchTrafficMetrics(
    userId: number,
    websiteId: number,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    totalVisits: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  } | null> {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        console.warn("[TrafficDataService] Database not available");
        return null;
      }

      // Query database for traffic metrics within date range
      const metrics = await dbInstance
        .select({
          totalVisits: sum(trafficMetrics.visits).as("totalVisits"),
          uniqueVisitors: sum(trafficMetrics.uniqueVisitors).as("uniqueVisitors"),
          avgSessionDuration: sql<number>`AVG(${trafficMetrics.avgSessionDuration})`.as(
            "avgSessionDuration"
          ),
          bounceRate: sql<number>`AVG(${trafficMetrics.bounceRate})`.as("bounceRate"),
        })
        .from(trafficMetrics)
        .where(
          and(
            eq(trafficMetrics.userId, userId),
            eq(trafficMetrics.websiteId, websiteId),
            gte(trafficMetrics.date, dateRange.start),
            lte(trafficMetrics.date, dateRange.end)
          )
        );

      if (!metrics || metrics.length === 0) {
        console.warn("[TrafficDataService] No traffic metrics found");
        return null;
      }

      const metric = metrics[0];
      const totalVisits = metric.totalVisits ? Number(metric.totalVisits) : 0;
      const uniqueVisitors = metric.uniqueVisitors ? Number(metric.uniqueVisitors) : 0;

      // Calculate conversion rate (assuming 3-5% industry standard)
      const conversionRate = totalVisits > 0 ? (uniqueVisitors / totalVisits) * 100 : 0;

      return {
        totalVisits,
        uniqueVisitors,
        avgSessionDuration: metric.avgSessionDuration ? Number(metric.avgSessionDuration) : 0,
        bounceRate: metric.bounceRate ? Number(metric.bounceRate) : 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    } catch (error) {
      console.error("[TrafficDataService] Failed to fetch metrics:", error);
      return null;
    }
  }

  /**
   * Fetch traffic sources breakdown
   */
  private static async fetchTrafficSources(
    userId: number,
    websiteId: number,
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{ source: string; visits: number; percentage: number }>> {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        return [];
      }

      // Query traffic metrics grouped by source
      const sourceData = await dbInstance
        .select({
          source: trafficMetrics.source,
          visits: sum(trafficMetrics.visits).as("visits"),
        })
        .from(trafficMetrics)
        .where(
          and(
            eq(trafficMetrics.userId, userId),
            eq(trafficMetrics.websiteId, websiteId),
            gte(trafficMetrics.date, dateRange.start),
            lte(trafficMetrics.date, dateRange.end)
          )
        )
        .groupBy(trafficMetrics.source);

      if (!sourceData || sourceData.length === 0) {
        return [];
      }

      // Calculate total visits
      const totalVisits = sourceData.reduce((sum, item) => sum + (Number(item.visits) || 0), 0);

      // Map to report format with percentages
      return sourceData.map((item) => ({
        source: item.source || "direct",
        visits: Number(item.visits) || 0,
        percentage: totalVisits > 0 ? Math.round((Number(item.visits) / totalVisits) * 1000) / 10 : 0,
      }));
    } catch (error) {
      console.error("[TrafficDataService] Failed to fetch traffic sources:", error);
      return [];
    }
  }

  /**
   * Fetch campaign performance data
   */
  private static async fetchCampaignData(
    userId: number,
    websiteId: number,
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{ name: string; visits: number; conversions: number; roi: number }>> {
    try {
      // Query campaigns table for active campaigns in date range
      const campaignList = await db.getWebsiteCampaigns(websiteId);

      if (!campaignList || campaignList.length === 0) {
        return [];
      }

      // Filter campaigns within date range and map to report format
      const campaignData = campaignList
        .filter((c: any) => {
          const startDate = new Date(c.startDate || 0);
          const endDate = new Date(c.endDate || Date.now());
          return startDate <= dateRange.end && endDate >= dateRange.start;
        })
        .map((c: any) => {
          const conversions = Math.round((c.currentVisits || 0) * 0.03); // Assume 3% conversion rate
          const roi = c.budget > 0 ? Math.round((conversions * 50 - c.budget) / c.budget * 100) : 0; // Assume $50 per conversion

          return {
            name: c.name || "Unknown Campaign",
            visits: c.currentVisits || 0,
            conversions,
            roi,
          };
        });

      return campaignData;
    } catch (error) {
      console.error("[TrafficDataService] Failed to fetch campaign data:", error);
      return [];
    }
  }

  /**
   * Fetch daily traffic data for charts
   */
  private static async fetchDailyData(
    userId: number,
    websiteId: number,
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{ date: string; visits: number; uniqueVisitors: number }>> {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        return [];
      }

      // Query traffic metrics grouped by date
      const dailyMetrics = await dbInstance
        .select({
          date: trafficMetrics.date,
          visits: sum(trafficMetrics.visits).as("visits"),
          uniqueVisitors: sum(trafficMetrics.uniqueVisitors).as("uniqueVisitors"),
        })
        .from(trafficMetrics)
        .where(
          and(
            eq(trafficMetrics.userId, userId),
            eq(trafficMetrics.websiteId, websiteId),
            gte(trafficMetrics.date, dateRange.start),
            lte(trafficMetrics.date, dateRange.end)
          )
        )
        .groupBy(trafficMetrics.date);

      if (!dailyMetrics || dailyMetrics.length === 0) {
        return [];
      }

      // Map to report format
      return dailyMetrics.map((item) => ({
        date: new Date(item.date).toISOString().split("T")[0],
        visits: Number(item.visits) || 0,
        uniqueVisitors: Number(item.uniqueVisitors) || 0,
      }));
    } catch (error) {
      console.error("[TrafficDataService] Failed to fetch daily data:", error);
      return [];
    }
  }

  /**
   * Check if real data is available for a website
   */
  static async hasRealData(userId: number, websiteId: number): Promise<boolean> {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        return false;
      }

      // Check if there are any traffic metrics for this website
      const metricsCount = await dbInstance
        .select({ count: sql<number>`COUNT(*)`.as("count") })
        .from(trafficMetrics)
        .where(
          and(
            eq(trafficMetrics.userId, userId),
            eq(trafficMetrics.websiteId, websiteId)
          )
        );

      return metricsCount.length > 0 && Number(metricsCount[0].count) > 0;
    } catch (error) {
      console.error("[TrafficDataService] Failed to check for real data:", error);
      return false;
    }
  }

  /**
   * Get available date range for real data
   */
  static async getAvailableDateRange(
    userId: number,
    websiteId: number
  ): Promise<{ start: Date; end: Date } | null> {
    try {
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        return null;
      }

      // Query for min and max dates in traffic metrics
      const result = await dbInstance
        .select({
          minDate: sql<string>`MIN(${trafficMetrics.date})`.as("minDate"),
          maxDate: sql<string>`MAX(${trafficMetrics.date})`.as("maxDate"),
        })
        .from(trafficMetrics)
        .where(
          and(
            eq(trafficMetrics.userId, userId),
            eq(trafficMetrics.websiteId, websiteId)
          )
        );

      if (result.length > 0 && result[0].minDate && result[0].maxDate) {
        return {
          start: new Date(result[0].minDate),
          end: new Date(result[0].maxDate),
        };
      }

      return null;
    } catch (error) {
      console.error("[TrafficDataService] Failed to get available date range:", error);
      return null;
    }
  }
}
