import axios from "axios";
import * as db from "../db";
import { IIntegrationService, SyncResult } from "./index";

/**
 * Facebook Integration Service
 */
export class FacebookService implements IIntegrationService {
  private accessToken: string = "";
  private readonly API_BASE = "https://graph.facebook.com/v18.0";

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.accessToken || !credentials.pageId) {
        throw new Error("Missing required credentials: accessToken, pageId");
      }

      this.accessToken = credentials.accessToken;

      const response = await axios.get(`${this.API_BASE}/${credentials.pageId}`, {
        params: { access_token: this.accessToken },
      });

      return response.status === 200;
    } catch (error) {
      console.error("[Facebook] Authentication failed:", error);
      return false;
    }
  }

  async sync(userId: number, websiteId?: number): Promise<SyncResult> {
    try {
      if (!this.accessToken) throw new Error("Not authenticated");

      const integration = await db.getIntegrationByProvider(userId, "facebook");
      if (!integration) throw new Error("Integration not found");

      const credentials = integration.credentialData as Record<string, string>;
      const pageId = credentials.pageId;

      // Fetch page insights
      const response = await axios.get(`${this.API_BASE}/${pageId}/insights`, {
        params: {
          metric: "page_views,page_fans,page_engaged_users",
          access_token: this.accessToken,
        },
      });

      const insights = response.data.data || [];
      let recordsSync = 0;

      for (const metric of insights) {
        if (metric.values && metric.values.length > 0) {
          recordsSync++;
        }
      }

      await db.updateIntegration(integration.id, {
        lastSyncedAt: new Date(),
      });

      return {
        success: true,
        recordsSync,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[Facebook] Sync failed:", error);
      return {
        success: false,
        recordsSync: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        lastSync: new Date(),
      };
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = "";
  }
}

/**
 * Twitter Integration Service
 */
export class TwitterService implements IIntegrationService {
  private bearerToken: string = "";
  private readonly API_BASE = "https://api.twitter.com/2";

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.bearerToken) {
        throw new Error("Missing required credentials: bearerToken");
      }

      this.bearerToken = credentials.bearerToken;

      const response = await axios.get(`${this.API_BASE}/tweets/search/recent`, {
        params: { query: "from:twitter", max_results: 10 },
        headers: { Authorization: `Bearer ${this.bearerToken}` },
      });

      return response.status === 200;
    } catch (error) {
      console.error("[Twitter] Authentication failed:", error);
      return false;
    }
  }

  async sync(userId: number, websiteId?: number): Promise<SyncResult> {
    try {
      if (!this.bearerToken) throw new Error("Not authenticated");

      const integration = await db.getIntegrationByProvider(userId, "twitter");
      if (!integration) throw new Error("Integration not found");

      // Fetch user tweets and engagement metrics
      const response = await axios.get(`${this.API_BASE}/tweets/search/recent`, {
        params: {
          query: "from:twitter",
          "tweet.fields": "public_metrics",
          max_results: 100,
        },
        headers: { Authorization: `Bearer ${this.bearerToken}` },
      });

      const tweets = response.data.data || [];
      let recordsSync = 0;

      for (const tweet of tweets) {
        if (tweet.public_metrics) {
          recordsSync++;
        }
      }

      await db.updateIntegration(integration.id, {
        lastSyncedAt: new Date(),
      });

      return {
        success: true,
        recordsSync,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[Twitter] Sync failed:", error);
      return {
        success: false,
        recordsSync: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        lastSync: new Date(),
      };
    }
  }

  async disconnect(): Promise<void> {
    this.bearerToken = "";
  }
}

/**
 * Instagram Integration Service
 */
export class InstagramService implements IIntegrationService {
  private accessToken: string = "";
  private readonly API_BASE = "https://graph.instagram.com/v18.0";

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.accessToken || !credentials.businessAccountId) {
        throw new Error("Missing required credentials: accessToken, businessAccountId");
      }

      this.accessToken = credentials.accessToken;

      const response = await axios.get(
        `${this.API_BASE}/${credentials.businessAccountId}`,
        {
          params: { access_token: this.accessToken },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("[Instagram] Authentication failed:", error);
      return false;
    }
  }

  async sync(userId: number, websiteId?: number): Promise<SyncResult> {
    try {
      if (!this.accessToken) throw new Error("Not authenticated");

      const integration = await db.getIntegrationByProvider(userId, "instagram");
      if (!integration) throw new Error("Integration not found");

      const credentials = integration.credentialData as Record<string, string>;
      const businessAccountId = credentials.businessAccountId;

      // Fetch business account insights
      const response = await axios.get(
        `${this.API_BASE}/${businessAccountId}/insights`,
        {
          params: {
            metric: "impressions,reach,profile_views",
            access_token: this.accessToken,
          },
        }
      );

      const insights = response.data.data || [];
      let recordsSync = 0;

      for (const metric of insights) {
        if (metric.values && metric.values.length > 0) {
          recordsSync++;
        }
      }

      await db.updateIntegration(integration.id, {
        lastSyncedAt: new Date(),
      });

      return {
        success: true,
        recordsSync,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error("[Instagram] Sync failed:", error);
      return {
        success: false,
        recordsSync: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        lastSync: new Date(),
      };
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = "";
  }
}
