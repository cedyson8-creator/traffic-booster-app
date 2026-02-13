import axios from "axios";
import * as db from "../db";
import { IIntegrationService, SyncResult } from "./index";

/**
 * Fiverr Integration Service
 * Manages gigs and orders on Fiverr platform
 */
export class FiverrService implements IIntegrationService {
  private apiKey: string = "";
  private readonly API_BASE = "https://api.fiverr.com/v1";

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      if (!credentials.apiKey || !credentials.userId) {
        throw new Error("Missing required credentials: apiKey, userId");
      }

      this.apiKey = credentials.apiKey;

      const response = await axios.get(`${this.API_BASE}/users/${credentials.userId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error("[Fiverr] Authentication failed:", error);
      return false;
    }
  }

  async sync(userId: number, websiteId?: number): Promise<SyncResult> {
    try {
      if (!this.apiKey) {
        throw new Error("Not authenticated");
      }

      const integration = await db.getIntegrationByProvider(userId, "fiverr");
      if (!integration) {
        throw new Error("Integration not found");
      }

      const credentials = integration.credentialData as Record<string, string>;
      const fiverrUserId = credentials.userId;
      let recordsSync = 0;

      // Fetch orders
      const ordersResponse = await axios.get(`${this.API_BASE}/users/${fiverrUserId}/orders`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const orders = ordersResponse.data.orders || [];

      // Process orders and update campaign metrics
      for (const order of orders) {
        if (order.status === "completed") {
          const campaigns = await db.getUserCampaigns(userId);
          
          for (const campaign of campaigns) {
            if (campaign.name.toLowerCase().includes(order.gig_title?.toLowerCase() || "")) {
              const newVisits = campaign.currentVisits + (order.quantity || 1);
              await db.updateCampaign(campaign.id, {
                currentVisits: Math.min(newVisits, campaign.targetVisits),
                status: newVisits >= campaign.targetVisits ? "completed" : "active",
              });
              recordsSync++;
            }
          }
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
      console.error("[Fiverr] Sync failed:", error);
      return {
        success: false,
        recordsSync: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        lastSync: new Date(),
      };
    }
  }

  async disconnect(): Promise<void> {
    this.apiKey = "";
  }
}
