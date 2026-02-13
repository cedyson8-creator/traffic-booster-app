import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useReporting } from "@/lib/reporting-context";
import { useCampaigns } from "@/lib/campaigns-context";
import { useWebsites } from "@/lib/websites-context";

export default function ReportingDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { kpis, metrics, dashboards, generateMetrics } = useReporting();
  const { campaigns } = useCampaigns();
  const { websites } = useWebsites();

  useEffect(() => {
    const campaignsData = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      visits: Math.floor(Math.random() * 10000),
      conversions: Math.floor(Math.random() * 500),
      revenue: Math.floor(Math.random() * 50000),
    }));

    const segmentsData = [
      { name: "Organic Search", performance: 85 },
      { name: "Social Media", performance: 72 },
      { name: "Direct Traffic", performance: 90 },
    ];

    generateMetrics(campaignsData, segmentsData);
  }, [campaigns, generateMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return colors.success;
      case "at_risk":
        return colors.warning;
      case "off_track":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "remove";
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
            <Text className="text-3xl font-bold text-foreground mb-1">Reporting Dashboard</Text>
            <Text className="text-muted">Advanced KPI tracking and analytics</Text>
          </View>

          {/* KPI Cards */}
          <View>
            <Text className="text-sm font-bold text-foreground mb-3 uppercase">Key Performance Indicators</Text>
            <FlatList
              data={kpis}
              renderItem={({ item }) => (
                <View className="bg-surface border border-border rounded-xl p-4 mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">{item.name}</Text>
                      <Text className="text-xs text-muted mt-1">{item.description}</Text>
                    </View>
                    <View
                      className="rounded-full px-3 py-1"
                      style={{
                        backgroundColor: `${getStatusColor(item.status)}20`,
                      }}
                    >
                      <Text
                        className="text-xs font-bold capitalize"
                        style={{ color: getStatusColor(item.status) }}
                      >
                        {item.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-baseline gap-2 mb-3">
                    <Text className="text-2xl font-bold text-foreground">
                      {item.currentValue.toLocaleString()}
                    </Text>
                    <Text className="text-sm text-muted">{item.unit}</Text>
                    <View className="flex-row items-center gap-1 ml-auto">
                      <MaterialIcons
                        name={getTrendIcon(item.trend) as any}
                        size={16}
                        color={item.trend === "up" ? colors.success : colors.error}
                      />
                      <Text
                        style={{
                          color: item.trend === "up" ? colors.success : colors.error,
                        }}
                        className="text-sm font-bold"
                      >
                        {Math.abs(item.trendPercentage).toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View className="bg-background rounded-full h-2 overflow-hidden">
                    <View
                      className="h-full"
                      style={{
                        width: `${Math.min(100, (item.currentValue / item.targetValue) * 100)}%`,
                        backgroundColor: getStatusColor(item.status),
                      }}
                    />
                  </View>
                  <Text className="text-xs text-muted mt-2">
                    Target: {item.targetValue.toLocaleString()} {item.unit}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* Executive Summary */}
          {metrics && (
            <View className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <MaterialIcons name="summarize" size={20} color={colors.primary} />
                <Text className="text-base font-bold text-foreground">Executive Summary</Text>
              </View>

              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Total Visits</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {metrics.executiveSummary.totalVisits.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Total Conversions</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {metrics.executiveSummary.totalConversions.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Average ROI</Text>
                  <Text className="text-sm font-bold text-success">
                    {metrics.executiveSummary.averageROI.toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Key Insights */}
              <View className="mt-4 pt-4 border-t border-primary/20">
                <Text className="text-xs font-bold text-foreground mb-2">Key Insights</Text>
                {metrics.executiveSummary.keyInsights.slice(0, 2).map((insight, idx) => (
                  <View key={idx} className="flex-row gap-2 mb-2">
                    <MaterialIcons name="check-circle" size={14} color={colors.success} />
                    <Text className="text-xs text-muted flex-1">{insight}</Text>
                  </View>
                ))}
              </View>

              {/* Recommendations */}
              <View className="mt-3 pt-3 border-t border-primary/20">
                <Text className="text-xs font-bold text-foreground mb-2">Recommendations</Text>
                {metrics.executiveSummary.recommendations.slice(0, 2).map((rec, idx) => (
                  <View key={idx} className="flex-row gap-2 mb-2">
                    <MaterialIcons name="lightbulb" size={14} color={colors.primary} />
                    <Text className="text-xs text-muted flex-1">{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Dashboards */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-bold text-foreground uppercase">Custom Dashboards</Text>
              <TouchableOpacity
                onPress={() => Alert.alert("Info", "Dashboard creation coming soon!")}
                className="bg-primary/10 rounded-lg p-2"
              >
                <MaterialIcons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={dashboards}
              renderItem={({ item }) => (
                <TouchableOpacity className="bg-surface border border-border rounded-xl p-4 mb-3">
                  <Text className="text-base font-bold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted mt-1">{item.description}</Text>
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {item.metrics.slice(0, 3).map((metric, idx) => (
                      <View key={idx} className="bg-background rounded-full px-2 py-1">
                        <Text className="text-xs text-muted capitalize">{metric}</Text>
                      </View>
                    ))}
                    {item.metrics.length > 3 && (
                      <View className="bg-background rounded-full px-2 py-1">
                        <Text className="text-xs text-muted">+{item.metrics.length - 3} more</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* Tips */}
          <View className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <View className="flex-row gap-3">
              <MaterialIcons name="info" size={20} color={colors.warning} />
              <View className="flex-1">
                <Text className="font-bold text-foreground">Pro Tip</Text>
                <Text className="text-xs text-muted mt-1">
                  Monitor KPI trends regularly and adjust campaigns based on insights and recommendations to maximize
                  ROI.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
