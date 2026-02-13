import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useIntegrations } from "@/lib/integrations-context";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";

export default function IntegrationsDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { integrations, syncIntegration } = useIntegrations();
  const [refreshing, setRefreshing] = useState(false);

  const connectedCount = integrations.filter((i) => i.isConnected).length;

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Mock data for demonstration
  const metricsData = {
    googleAnalytics: {
      totalVisitors: 45230,
      pageViews: 128450,
      bounceRate: 32.5,
      avgSessionDuration: 3.2,
      topSources: [
        { name: "Organic Search", visitors: 18230, percentage: 40 },
        { name: "Direct", visitors: 13569, percentage: 30 },
        { name: "Social Media", visitors: 9092, percentage: 20 },
        { name: "Referral", visitors: 4339, percentage: 10 },
      ],
    },
    fiverr: {
      activeGigs: 5,
      completedOrders: 127,
      totalEarnings: 3450.75,
      pendingEarnings: 285.5,
      responseRate: 98,
    },
    socialMedia: {
      facebook: {
        followers: 12450,
        engagement: 3.2,
        reach: 45000,
      },
      twitter: {
        followers: 8320,
        engagement: 2.1,
        reach: 28000,
      },
      instagram: {
        followers: 15680,
        engagement: 5.4,
        reach: 52000,
      },
    },
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-2">Integration Metrics</Text>
            <Text className="text-muted">
              {connectedCount} of {integrations.length} accounts connected
            </Text>
          </View>

          {/* Quick Stats */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-sm text-muted mb-1">Total Visitors</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {metricsData.googleAnalytics.totalVisitors.toLocaleString()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-muted mb-1">Bounce Rate</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {metricsData.googleAnalytics.bounceRate}%
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-muted mb-1">Avg Session</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {metricsData.googleAnalytics.avgSessionDuration}m
                </Text>
              </View>
            </View>
          </View>

          {/* Google Analytics Section */}
          {integrations.find((i) => i.provider === "google_analytics")?.isConnected && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Google Analytics</Text>

              {/* Traffic Sources */}
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-base font-semibold text-foreground mb-3">Traffic Sources</Text>
                {metricsData.googleAnalytics.topSources.map((source, idx) => (
                  <View key={idx} className="mb-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-foreground">{source.name}</Text>
                      <Text className="text-sm font-semibold text-primary">{source.percentage}%</Text>
                    </View>
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </View>
                    <Text className="text-xs text-muted mt-1">
                      {source.visitors.toLocaleString()} visitors
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Fiverr Section */}
          {integrations.find((i) => i.provider === "fiverr")?.isConnected && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Fiverr Performance</Text>

              <View className="flex-row gap-2">
                <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-xs text-muted mb-1">Active Gigs</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {metricsData.fiverr.activeGigs}
                  </Text>
                </View>
                <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-xs text-muted mb-1">Completed Orders</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {metricsData.fiverr.completedOrders}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-xs text-muted mb-1">Total Earnings</Text>
                  <Text className="text-2xl font-bold text-success">
                    ${metricsData.fiverr.totalEarnings.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-xs text-muted mb-1">Response Rate</Text>
                  <Text className="text-2xl font-bold text-primary">
                    {metricsData.fiverr.responseRate}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Social Media Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Social Media</Text>

            {integrations.find((i) => i.provider === "facebook")?.isConnected && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                    <MaterialIcons name="thumb-up" size={20} color={colors.background} />
                  </View>
                  <Text className="text-base font-semibold text-foreground flex-1">Facebook</Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-xs text-muted mb-1">Followers</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {metricsData.socialMedia.facebook.followers.toLocaleString()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted mb-1">Engagement</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {metricsData.socialMedia.facebook.engagement}%
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted mb-1">Reach</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {(metricsData.socialMedia.facebook.reach / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {integrations.find((i) => i.provider === "twitter")?.isConnected && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                    <MaterialIcons name="share" size={20} color={colors.background} />
                  </View>
                  <Text className="text-base font-semibold text-foreground flex-1">Twitter</Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-xs text-muted mb-1">Followers</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {metricsData.socialMedia.twitter.followers.toLocaleString()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted mb-1">Engagement</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {metricsData.socialMedia.twitter.engagement}%
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted mb-1">Reach</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {(metricsData.socialMedia.twitter.reach / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {integrations.find((i) => i.provider === "instagram")?.isConnected && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                    <MaterialIcons name="photo-camera" size={20} color={colors.background} />
                  </View>
                  <Text className="text-base font-semibold text-foreground flex-1">Instagram</Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-xs text-muted mb-1">Followers</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {metricsData.socialMedia.instagram.followers.toLocaleString()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted mb-1">Engagement</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {metricsData.socialMedia.instagram.engagement}%
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted mb-1">Reach</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {(metricsData.socialMedia.instagram.reach / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* No Connections Message */}
          {connectedCount === 0 && (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <MaterialIcons name="info" size={40} color={colors.muted} />
              <Text className="text-base font-semibold text-foreground mt-3 text-center">
                No Integrations Connected
              </Text>
              <Text className="text-sm text-muted text-center mt-2 mb-4">
                Connect your accounts to see real-time metrics from all platforms
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/integrations")}
                className="bg-primary rounded-lg px-6 py-2"
              >
                <Text className="text-background font-semibold">Connect Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
