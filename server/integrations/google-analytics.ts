import axios from "axios";
import * as db from "../db";
import { IIntegrationService, SyncResult } from "./index";

/**
 * Google Analytics Integration Service
 * Syncs real traffic data from Google Analytics Reporting API v4
 */
export class GoogleAnalyticsService implements IIntegrationService {
  private accessToken: string = "";
  private readonly API_BASE = "https://analyticsreporting.googleapis.com/v4";

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      // Credentials should contain:
      // - accessToken: OAuth access token from Google
      // - refreshToken: For refreshing expired tokens
      // - propertyId: Google Analytics property ID

      if (!credentials.accessToken || !credentials.propertyId) {
        throw new Error("Missing required credentials: accessToken, propertyId");
      }

      this.accessToken = credentials.accessToken;

      // Test the connection by making a simple API call
      const response = await axios.post(
        `${this.API_BASE}/reports:batchGet`,
        {
          reportRequests: [
            {
              viewId: credentials.propertyId,
              dateRanges: [
                {
                  startDate: "7daysAgo",
                  endDate: "today",
                },
              ],
              metrics: [{ expression: "ga:users" }],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[GoogleAnalytics] Authentication failed:", error);
      return false;
    }
  }

  async sync(userId: number, websiteId?: number): Promise<SyncResult> {
    try {
      if (!this.accessToken) {
        throw new Error("Not authenticated");
      }

      const integration = await db.getIntegrationByProvider(userId, "google_analytics");
      if (!integration) {
        throw new Error("Integration not found");
      }

      const credentials = integration.credentialData as Record<string, string>;
      const propertyId = credentials.propertyId;

      // Fetch 30 days of traffic data
      const response = await axios.post(
        `${this.API_BASE}/reports:batchGet`,
        {
          reportRequests: [
            {
              viewId: propertyId,
              dateRanges: [
                {
                  startDate: "30daysAgo",
                  endDate: "today",
                },
              ],
              metrics: [
                { expression: "ga:users" },
                { expression: "ga:sessions" },
                { expression: "ga:bounceRate" },
                { expression: "ga:avgSessionDuration" },
              ],
              dimensions: [{ name: "ga:date" }, { name: "ga:source" }],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.reports || response.data.reports.length === 0) {
        return {
          success: false,
          recordsSync: 0,
          error: "No data returned from Google Analytics",
          lastSync: new Date(),
        };
      }

      const report = response.data.reports[0];
      const rows = report.data.rows || [];
      let recordsSync = 0;

      // Process each row of data
      for (const row of rows) {
        const dimensions = row.dimensions || [];
        const values = row.values || [];

        const date = dimensions[0]; // YYYYMMDD format
        const source = dimensions[1] || "direct";

        const uniqueVisitors = parseInt(values[0], 10) || 0;
        const visits = parseInt(values[1], 10) || 0;
        const bounceRate = parseInt(values[2], 10) || 0;
        const avgSessionDuration = parseInt(values[3], 10) || 0;

        // Convert date from YYYYMMDD to ISO format
        const dateObj = new Date(
          parseInt(date.substring(0, 4), 10),
          parseInt(date.substring(4, 6), 10) - 1,
          parseInt(date.substring(6, 8), 10)
        );

        if (websiteId) {
          // Store metric for specific website
          await db.createTrafficMetric({
            userId,
            websiteId,
            date: dateObj,
            visits,
            uniqueVisitors,
            bounceRate,
            avgSessionDuration,
            source: (source.toLowerCase() as any) || "direct",
          });

          recordsSync++;
        }
      }

      // Update integration last sync time
      await db.updateIntegration(integration.id, {
        lastSyncedAt: new Date(),
      });

      return {
        success: true,
        recordsSync,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[GoogleAnalytics] Sync failed:", error);
      return {
        success: false,
        recordsSync: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        lastSync: new Date(),
      };
    }
  }

  async disconnect(): Promise<void> {
    // Revoke the access token
    try {
      if (this.accessToken) {
        await axios.post("https://oauth2.googleapis.com/revoke", {
          token: this.accessToken,
        });
      }
    } catch (error) {
      console.warn("[GoogleAnalytics] Failed to revoke token:", error);
    }
    this.accessToken = "";
  }
}
