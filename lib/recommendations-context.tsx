import React, { createContext, useContext, useState, useCallback } from "react";
import { Campaign } from "./types";
import { Recommendation, CampaignMetrics, analyzeCampaignPerformance, calculateCampaignMetrics } from "./recommendations-service";

interface RecommendationsContextType {
  recommendations: Recommendation[];
  generateRecommendations: (campaign: Campaign, metrics?: CampaignMetrics) => Promise<void>;
  dismissRecommendation: (id: string) => void;
  clearRecommendations: () => void;
  getRecommendationsForCampaign: (campaignId: string) => Recommendation[];
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export function RecommendationsProvider({ children }: { children: React.ReactNode }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const generateRecommendations = useCallback(
    async (campaign: Campaign, metrics?: CampaignMetrics) => {
      try {
        // Calculate metrics if not provided
        const campaignMetrics = metrics || calculateCampaignMetrics(campaign);

        // Generate recommendations
        const newRecommendations = analyzeCampaignPerformance(campaign, campaignMetrics);

        // Filter out dismissed recommendations
        const activeRecommendations = newRecommendations.filter((r) => !dismissedIds.has(r.id));

        // Update recommendations, removing old ones for this campaign
        setRecommendations((prev) => {
          const otherCampaignRecs = prev.filter((r) => r.campaignId !== campaign.id);
          return [...otherCampaignRecs, ...activeRecommendations];
        });
      } catch (error) {
        console.error("[RecommendationsContext] Failed to generate recommendations:", error);
      }
    },
    [dismissedIds]
  );

  const dismissRecommendation = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setDismissedIds(new Set());
  }, []);

  const getRecommendationsForCampaign = useCallback(
    (campaignId: string) => {
      return recommendations.filter((r) => r.campaignId === campaignId);
    },
    [recommendations]
  );

  const value: RecommendationsContextType = {
    recommendations,
    generateRecommendations,
    dismissRecommendation,
    clearRecommendations,
    getRecommendationsForCampaign,
  };

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations() {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error("useRecommendations must be used within RecommendationsProvider");
  }
  return context;
}
