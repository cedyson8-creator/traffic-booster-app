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
import { useABTesting } from "@/lib/ab-testing-context";
import { getABTestMetrics, analyzeABTest, getWinnerRecommendation } from "@/lib/ab-testing-service";
import { ABTest } from "@/lib/ab-testing-types";

export default function ABTestResultsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { testId } = useLocalSearchParams();
  const { tests } = useABTesting();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<ABTest | null>(null);

  useEffect(() => {
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const foundTest = tests.find((t) => t.id === testId);
      setTest(foundTest || null);
    } catch (error) {
      console.error("Failed to load test:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-2">Loading test results...</Text>
      </ScreenContainer>
    );
  }

  if (!test) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground text-lg font-semibold">Test not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const metrics = getABTestMetrics(test);
  const results = analyzeABTest(test);
  const recommendation = getWinnerRecommendation(test);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return colors.primary;
      case "completed":
        return colors.success;
      case "paused":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground mb-1">
                  {test.name}
                </Text>
                <Text className="text-muted">{test.description}</Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${getStatusColor(test.status)}20` }}
              >
                <Text
                  className="text-xs font-semibold uppercase"
                  style={{ color: getStatusColor(test.status) }}
                >
                  {test.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Key Metrics */}
          <View className="gap-2">
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row justify-between mb-3">
                <View>
                  <Text className="text-sm text-muted">Total Visits</Text>
                  <Text className="text-2xl font-bold text-foreground mt-1">
                    {metrics.totalVisits.toLocaleString()}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-muted">Conversions</Text>
                  <Text className="text-2xl font-bold text-primary mt-1">
                    {metrics.totalConversions.toLocaleString()}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-muted">Conv. Rate</Text>
                  <Text className="text-2xl font-bold text-success mt-1">
                    {metrics.overallConversionRate.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Confidence Level */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-foreground">
                  Statistical Significance
                </Text>
                <Text className="text-lg font-bold text-primary">
                  {metrics.statisticalSignificance.toFixed(1)}%
                </Text>
              </View>
              <View className="bg-background rounded-lg h-2 overflow-hidden">
                <View
                  className="bg-primary h-full"
                  style={{
                    width: `${Math.min(metrics.statisticalSignificance, 100)}%`,
                  }}
                />
              </View>
              <Text className="text-xs text-muted mt-2">
                {metrics.statisticalSignificance >= 95
                  ? "✓ Statistically significant"
                  : "Continue testing for significance"}
              </Text>
            </View>
          </View>

          {/* Variations Performance */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Variation Performance
            </Text>
            <View className="gap-2">
              {test.variations.map((variation, index) => {
                const result = results.find((r) => r.variationId === variation.id);
                const isWinner = result?.winner;

                return (
                  <View
                    key={variation.id}
                    className={`rounded-2xl p-4 border ${
                      isWinner
                        ? "bg-success/10 border-success"
                        : "bg-surface border-border"
                    }`}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base font-bold text-foreground">
                            {variation.name}
                          </Text>
                          {isWinner && (
                            <View className="bg-success/20 rounded-full px-2 py-1">
                              <Text className="text-xs font-semibold text-success">
                                WINNER
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm text-muted mt-1">
                          {variation.description}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-sm text-muted">Traffic</Text>
                        <Text className="text-lg font-bold text-foreground">
                          {variation.trafficAllocation}%
                        </Text>
                      </View>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row gap-2 mb-3">
                      <View className="flex-1 bg-background rounded-lg p-2">
                        <Text className="text-xs text-muted">Visits</Text>
                        <Text className="text-sm font-bold text-foreground mt-1">
                          {variation.visits.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-1 bg-background rounded-lg p-2">
                        <Text className="text-xs text-muted">Conversions</Text>
                        <Text className="text-sm font-bold text-foreground mt-1">
                          {variation.conversions.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-1 bg-background rounded-lg p-2">
                        <Text className="text-xs text-muted">Conv. Rate</Text>
                        <Text className="text-sm font-bold text-foreground mt-1">
                          {variation.conversionRate.toFixed(2)}%
                        </Text>
                      </View>
                    </View>

                    {/* Improvement */}
                    {result && (
                      <View className="flex-row items-center gap-2">
                        <MaterialIcons
                          name={result.improvement >= 0 ? "trending-up" : "trending-down"}
                          size={16}
                          color={result.improvement >= 0 ? colors.success : colors.error}
                        />
                        <Text
                          style={{
                            color:
                              result.improvement >= 0 ? colors.success : colors.error,
                          }}
                          className="text-sm font-semibold"
                        >
                          {result.improvement >= 0 ? "+" : ""}
                          {result.improvement.toFixed(1)}% vs baseline
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recommendation */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <View className="flex-row gap-3">
              <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-1">
                  Recommendation
                </Text>
                <Text className="text-sm text-muted">{recommendation}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            {test.status === "running" && (
              <>
                <TouchableOpacity className="flex-1 bg-warning rounded-lg py-3 items-center">
                  <Text className="text-background text-sm font-semibold">
                    Pause Test
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-primary rounded-lg py-3 items-center">
                  <Text className="text-background text-sm font-semibold">
                    End & Implement
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {test.status === "completed" && (
              <TouchableOpacity className="flex-1 bg-primary rounded-lg py-3 items-center">
                <Text className="text-background text-sm font-semibold">
                  Start New Test
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
