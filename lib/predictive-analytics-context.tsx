import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  HistoricalDataPoint,
  PerformanceForecast,
  OptimalLaunchTiming,
  PredictiveInsight,
} from "./predictive-analytics-types";
import {
  forecastPerformance,
  suggestOptimalLaunchTiming,
  generatePredictiveInsights,
  analyzeTrend,
  detectSeasonalPattern,
} from "./predictive-analytics-service";

interface PredictiveAnalyticsContextType {
  forecasts: Record<string, PerformanceForecast[]>;
  launchTimings: Record<string, OptimalLaunchTiming>;
  insights: Record<string, PredictiveInsight[]>;
  generateForecast: (
    campaignId: string,
    historicalData: HistoricalDataPoint[],
    daysAhead?: number
  ) => Promise<PerformanceForecast[]>;
  suggestLaunchTiming: (
    campaignId: string,
    historicalData: HistoricalDataPoint[],
    budget: number
  ) => Promise<OptimalLaunchTiming>;
  getInsights: (
    campaignId: string,
    historicalData: HistoricalDataPoint[]
  ) => Promise<PredictiveInsight[]>;
  clearForecasts: (campaignId: string) => Promise<void>;
}

const PredictiveAnalyticsContext = createContext<PredictiveAnalyticsContextType | undefined>(
  undefined
);

export function PredictiveAnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [forecasts, setForecasts] = useState<Record<string, PerformanceForecast[]>>({});
  const [launchTimings, setLaunchTimings] = useState<Record<string, OptimalLaunchTiming>>({});
  const [insights, setInsights] = useState<Record<string, PredictiveInsight[]>>({});

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedForecasts = await AsyncStorage.getItem("predictive_forecasts");
        const cachedTimings = await AsyncStorage.getItem("predictive_timings");
        const cachedInsights = await AsyncStorage.getItem("predictive_insights");

        if (cachedForecasts) setForecasts(JSON.parse(cachedForecasts));
        if (cachedTimings) setLaunchTimings(JSON.parse(cachedTimings));
        if (cachedInsights) setInsights(JSON.parse(cachedInsights));
      } catch (error) {
        console.error("Failed to load cached predictive data:", error);
      }
    };

    loadCachedData();
  }, []);

  const generateForecast = useCallback(
    async (
      campaignId: string,
      historicalData: HistoricalDataPoint[],
      daysAhead: number = 30
    ): Promise<PerformanceForecast[]> => {
      try {
        const newForecasts = forecastPerformance(campaignId, historicalData, daysAhead);

        setForecasts((prev) => {
          const updated = { ...prev, [campaignId]: newForecasts };
          AsyncStorage.setItem("predictive_forecasts", JSON.stringify(updated)).catch(
            console.error
          );
          return updated;
        });

        return newForecasts;
      } catch (error) {
        console.error("Failed to generate forecast:", error);
        return [];
      }
    },
    []
  );

  const suggestLaunchTiming = useCallback(
    async (
      campaignId: string,
      historicalData: HistoricalDataPoint[],
      budget: number
    ): Promise<OptimalLaunchTiming> => {
      try {
        const newForecasts = forecastPerformance(campaignId, historicalData, 30);
        const timing = suggestOptimalLaunchTiming(campaignId, newForecasts, budget);

        setLaunchTimings((prev) => {
          const updated = { ...prev, [campaignId]: timing };
          AsyncStorage.setItem("predictive_timings", JSON.stringify(updated)).catch(
            console.error
          );
          return updated;
        });

        return timing;
      } catch (error) {
        console.error("Failed to suggest launch timing:", error);
        return {
          campaignId,
          recommendedDate: Date.now(),
          expectedPerformance: { visits: 0, conversions: 0, roi: 0 },
          reason: "Error generating suggestion",
          alternatives: [],
        };
      }
    },
    []
  );

  const getInsights = useCallback(
    async (
      campaignId: string,
      historicalData: HistoricalDataPoint[]
    ): Promise<PredictiveInsight[]> => {
      try {
        const trend = analyzeTrend(historicalData);
        const seasonality = detectSeasonalPattern(historicalData);
        const newForecasts = forecastPerformance(campaignId, historicalData, 30);
        const newInsights = generatePredictiveInsights(
          campaignId,
          trend,
          seasonality,
          newForecasts
        );

        setInsights((prev) => {
          const updated = { ...prev, [campaignId]: newInsights };
          AsyncStorage.setItem("predictive_insights", JSON.stringify(updated)).catch(
            console.error
          );
          return updated;
        });

        return newInsights;
      } catch (error) {
        console.error("Failed to generate insights:", error);
        return [];
      }
    },
    []
  );

  const clearForecasts = useCallback(async (campaignId: string) => {
    setForecasts((prev) => {
      const updated = { ...prev };
      delete updated[campaignId];
      AsyncStorage.setItem("predictive_forecasts", JSON.stringify(updated)).catch(
        console.error
      );
      return updated;
    });

    setLaunchTimings((prev) => {
      const updated = { ...prev };
      delete updated[campaignId];
      AsyncStorage.setItem("predictive_timings", JSON.stringify(updated)).catch(
        console.error
      );
      return updated;
    });

    setInsights((prev) => {
      const updated = { ...prev };
      delete updated[campaignId];
      AsyncStorage.setItem("predictive_insights", JSON.stringify(updated)).catch(
        console.error
      );
      return updated;
    });
  }, []);

  return (
    <PredictiveAnalyticsContext.Provider
      value={{
        forecasts,
        launchTimings,
        insights,
        generateForecast,
        suggestLaunchTiming,
        getInsights,
        clearForecasts,
      }}
    >
      {children}
    </PredictiveAnalyticsContext.Provider>
  );
}

export function usePredictiveAnalytics() {
  const context = useContext(PredictiveAnalyticsContext);
  if (!context) {
    throw new Error(
      "usePredictiveAnalytics must be used within PredictiveAnalyticsProvider"
    );
  }
  return context;
}
