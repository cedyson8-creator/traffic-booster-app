import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { usePredictiveAnalytics } from "@/lib/predictive-analytics-context";
import { useCampaigns } from "@/lib/campaigns-context";
import { HistoricalDataPoint, PerformanceForecast, PredictiveInsight } from "@/lib/predictive-analytics-types";

export default function PredictiveAnalyticsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { campaignId } = useLocalSearchParams();
  const { campaigns } = useCampaigns();
  const { generateForecast, suggestLaunchTiming, getInsights, forecasts, launchTimings, insights } =
    usePredictiveAnalytics();

  const [loading, setLoading] = useState(true);
  const [selectedForecast, setSelectedForecast] = useState<PerformanceForecast | null>(null);

  const campaign = campaigns.find((c) => c.id === campaignId);

  // Generate mock historical data for demonstration
  const generateMockHistoricalData = (): HistoricalDataPoint[] => {
    const data: HistoricalDataPoint[] = [];
    const now = Date.now();
    const baseVisits = campaign?.targetVisits ? Math.floor(campaign.targetVisits / 30) : 100;

    for (let i = 30; i >= 0; i--) {
      const date = now - i * 86400000;
      const trend = (30 - i) * 5; // Upward trend
      const seasonalFactor = 1 + Math.sin((i % 7) / 7 * Math.PI) * 0.3;
      const randomFactor = 1 + (Math.random() - 0.5) * 0.2;

      data.push({
        date,
        visits: Math.round(baseVisits * seasonalFactor * randomFactor + trend),
        conversions: Math.round(baseVisits * seasonalFactor * randomFactor * 0.05 + trend * 0.1),
        bounceRate: 35 + Math.random() * 15,
        avgSessionDuration: 180 + Math.random() * 120,
        trafficSources: {
          organic: Math.round(baseVisits * 0.4),
          social: Math.round(baseVisits * 0.3),
          direct: Math.round(baseVisits * 0.2),
          referral: Math.round(baseVisits * 0.1),
        },
      });
    }

    return data;
  };

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true);
        if (!campaignId || !campaign) {
          Alert.alert("Error", "Campaign not found");
          router.back();
          return;
        }

        const historicalData = generateMockHistoricalData();

        // Generate forecasts
        await generateForecast(campaignId as string, historicalData, 30);

        // Get insights
        await getInsights(campaignId as string, historicalData);

        // Suggest launch timing
        await suggestLaunchTiming(campaignId as string, historicalData, campaign.budget || 1000);
      } catch (error) {
        console.error("Failed to load predictions:", error);
        Alert.alert("Error", "Failed to load predictions");
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, [campaignId, campaign]);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">Analyzing campaign data...</Text>
      </ScreenContainer>
    );
  }

  const campaignForecasts = forecasts[campaignId as string] || [];
  const campaignInsights = insights[campaignId as string] || [];
  const campaignTiming = launchTimings[campaignId as string];

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-1">
              Predictive Analytics
            </Text>
            <Text className="text-muted">{campaign?.name}</Text>
          </View>

          {/* Optimal Launch Timing */}
          {campaignTiming && (
            <View className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <MaterialIcons name="schedule" size={20} color={colors.primary} />
                <Text className="text-lg font-bold text-foreground">Optimal Launch Timing</Text>
              </View>
              <Text className="text-sm text-foreground mb-2">
                Recommended: {new Date(campaignTiming.recommendedDate).toLocaleDateString()}
              </Text>
              <View className="gap-2 bg-background rounded-lg p-3">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">Expected Visits</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {campaignTiming.expectedPerformance.visits.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">Expected Conversions</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {campaignTiming.expectedPerformance.conversions.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">Estimated ROI</Text>
                  <Text className="text-sm font-bold text-success">
                    {campaignTiming.expectedPerformance.roi.toFixed(0)}%
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted mt-3">{campaignTiming.reason}</Text>
            </View>
          )}

          {/* Performance Forecast Chart */}
          {campaignForecasts.length > 0 && (
            <View className="bg-surface border border-border rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <MaterialIcons name="trending-up" size={20} color={colors.primary} />
                <Text className="text-lg font-bold text-foreground">30-Day Forecast</Text>
              </View>

              {/* Simple bar chart representation */}
              <View className="h-40 bg-background rounded-lg p-3 mb-3">
                <View className="flex-1 flex-row items-end justify-between gap-1">
                  {campaignForecasts.slice(0, 15).map((forecast, idx) => {
                    const maxVisits = Math.max(...campaignForecasts.map((f) => f.predictedVisits));
                    const height = (forecast.predictedVisits / maxVisits) * 100;
                    return (
                      <View
                        key={idx}
                        className="flex-1 bg-primary rounded-t"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Forecast details */}
              <View className="gap-2">
                {campaignForecasts.slice(0, 3).map((forecast, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedForecast(forecast)}
                    className={`p-3 rounded-lg border ${
                      selectedForecast?.forecastDate === forecast.forecastDate
                        ? "bg-primary/10 border-primary/20"
                        : "bg-background border-border"
                    }`}
                  >
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-sm font-semibold text-foreground">
                          {new Date(forecast.forecastDate).toLocaleDateString()}
                        </Text>
                        <Text className="text-xs text-muted mt-1">
                          {forecast.predictedVisits.toLocaleString()} visits
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-muted">Confidence</Text>
                        <Text className="text-sm font-bold text-foreground">
                          {forecast.accuracy.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Predictive Insights */}
          {campaignInsights.length > 0 && (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
                <Text className="text-lg font-bold text-foreground">Insights</Text>
              </View>

              {campaignInsights.map((insight, idx) => (
                <View
                  key={idx}
                  className={`rounded-lg p-4 border ${
                    insight.impact === "high"
                      ? "bg-error/10 border-error/20"
                      : insight.impact === "medium"
                        ? "bg-warning/10 border-warning/20"
                        : "bg-success/10 border-success/20"
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    <MaterialIcons
                      name={
                        insight.type === "trend_acceleration"
                          ? "trending-up"
                          : insight.type === "trend_deceleration"
                            ? "trending-down"
                            : insight.type === "seasonal_peak"
                              ? "calendar-today"
                              : "star"
                      }
                      size={18}
                      color={
                        insight.impact === "high"
                          ? colors.error
                          : insight.impact === "medium"
                            ? colors.warning
                            : colors.success
                      }
                    />
                    <View className="flex-1">
                      <Text className="font-bold text-foreground">{insight.title}</Text>
                      <Text className="text-xs text-muted mt-1">{insight.description}</Text>
                      <Text className="text-xs text-foreground font-semibold mt-2">
                        💡 {insight.recommendation}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Alternative Launch Times */}
          {campaignTiming && campaignTiming.alternatives.length > 0 && (
            <View className="bg-surface border border-border rounded-xl p-4">
              <Text className="text-lg font-bold text-foreground mb-3">Alternative Timings</Text>
              {campaignTiming.alternatives.map((alt, idx) => (
                <View key={idx} className="mb-3 pb-3 border-b border-border last:border-b-0">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-sm font-semibold text-foreground">
                        {new Date(alt.date).toLocaleDateString()}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {alt.expectedPerformance.visits.toLocaleString()} visits expected
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-muted">Score</Text>
                      <Text className="text-sm font-bold text-primary">{alt.score}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
