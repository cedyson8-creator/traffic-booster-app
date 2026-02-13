import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRecommendations } from "@/lib/recommendations-context";
import { useCampaigns } from "@/lib/campaigns-context";
import { calculateCampaignMetrics } from "@/lib/recommendations-service";

export default function RecommendationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { campaignId } = useLocalSearchParams();
  const { recommendations, generateRecommendations, dismissRecommendation } = useRecommendations();
  const { campaigns } = useCampaigns();
  const [loading, setLoading] = useState(true);

  const campaign = campaigns.find((c) => c.id === campaignId);
  const campaignRecommendations = recommendations.filter((r) => r.campaignId === campaignId);

  useEffect(() => {
    loadRecommendations();
  }, [campaignId]);

  const loadRecommendations = async () => {
    if (!campaign) return;

    try {
      setLoading(true);
      const metrics = calculateCampaignMetrics(campaign);
      await generateRecommendations(campaign, metrics);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "budget":
        return "attach-money";
      case "duration":
        return "schedule";
      case "targeting":
        return "target";
      case "timing":
        return "access-time";
      case "content":
        return "article";
      default:
        return "lightbulb";
    }
  };

  if (!campaign) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground text-lg font-semibold">Campaign not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-2">
              Campaign Recommendations
            </Text>
            <Text className="text-muted">{campaign.name}</Text>
          </View>

          {/* Campaign Summary */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-sm text-muted">Current Progress</Text>
                <Text className="text-2xl font-bold text-foreground mt-1">
                  {campaign.currentVisits.toLocaleString()} / {campaign.targetVisits.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted">Completion</Text>
                <Text className="text-2xl font-bold text-primary mt-1">
                  {((campaign.currentVisits / campaign.targetVisits) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <View className="bg-background rounded-lg h-2 overflow-hidden">
              <View
                className="bg-primary h-full"
                style={{
                  width: `${Math.min(
                    (campaign.currentVisits / campaign.targetVisits) * 100,
                    100
                  )}%`,
                }}
              />
            </View>
          </View>

          {/* Loading State */}
          {loading && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-2">Analyzing campaign performance...</Text>
            </View>
          )}

          {/* Recommendations List */}
          {!loading && campaignRecommendations.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">
                {campaignRecommendations.length} Recommendations
              </Text>
              {campaignRecommendations.map((rec) => (
                <View
                  key={rec.id}
                  className="bg-surface rounded-2xl p-4 border border-border"
                >
                  {/* Header */}
                  <View className="flex-row items-start gap-3 mb-3">
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center"
                      style={{ backgroundColor: `${getImpactColor(rec.impact)}20` }}
                    >
                      <MaterialIcons
                        name={getTypeIcon(rec.type) as any}
                        size={20}
                        color={getImpactColor(rec.impact)}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">
                        {rec.title}
                      </Text>
                      <View className="flex-row gap-2 mt-1">
                        <View
                          className="rounded-full px-2 py-1"
                          style={{ backgroundColor: `${getImpactColor(rec.impact)}20` }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: getImpactColor(rec.impact) }}
                          >
                            {rec.impact.toUpperCase()} IMPACT
                          </Text>
                        </View>
                        <View className="bg-primary/10 rounded-full px-2 py-1">
                          <Text className="text-xs font-semibold text-primary">
                            +{rec.estimatedImprovement}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <Text className="text-sm text-muted mb-3">{rec.description}</Text>

                  {/* Suggestion */}
                  <View className="bg-primary/5 rounded-lg p-3 mb-3">
                    <Text className="text-xs font-semibold text-foreground mb-1">
                      Suggestion
                    </Text>
                    <Text className="text-sm text-muted">{rec.suggestion}</Text>
                  </View>

                  {/* Priority */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs text-muted">Priority</Text>
                    <View className="flex-row gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <View
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < rec.priority ? "bg-primary" : "bg-border"
                          }`}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="flex-1 bg-primary rounded-lg py-2 items-center">
                      <Text className="text-background text-sm font-semibold">
                        Apply
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => dismissRecommendation(rec.id)}
                      className="flex-1 bg-border rounded-lg py-2 items-center"
                    >
                      <Text className="text-foreground text-sm font-semibold">
                        Dismiss
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : !loading ? (
            <View className="items-center justify-center py-8">
              <MaterialIcons name="check-circle" size={48} color={colors.success} />
              <Text className="text-foreground text-lg font-semibold mt-3">
                Campaign Optimized
              </Text>
              <Text className="text-muted text-center mt-2">
                Your campaign is performing well. No recommendations at this time.
              </Text>
            </View>
          ) : null}

          {/* Info Box */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <View className="flex-row gap-3">
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  How Recommendations Work
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Recommendations are generated based on your campaign performance data,
                  ROI analysis, and industry benchmarks. Apply suggestions to optimize
                  your campaigns for better results.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
