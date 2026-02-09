import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LineChart } from "react-native-gifted-charts";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { mockWebsites, mockCampaigns, generateTrafficStats } from "@/lib/mock-data";

export default function WebsiteDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const website = mockWebsites.find((w) => w.id === id);
  const campaigns = mockCampaigns.filter((c) => c.websiteId === id);
  const trafficData = generateTrafficStats(7);

  if (!website) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl text-muted">Website not found</Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-primary text-base">← Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const chartData = trafficData.map((stat) => ({
    value: stat.visits,
    label: new Date(stat.date).getDate().toString(),
  }));

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">{website.name}</Text>
          <Text className="text-sm text-muted mt-1" numberOfLines={1}>{website.url}</Text>
        </View>

        {/* Traffic Chart */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-base font-semibold text-foreground mb-4">7-Day Traffic</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 80}
            height={180}
            color={colors.primary}
            thickness={3}
            startFillColor={colors.primary}
            endFillColor={colors.background}
            startOpacity={0.3}
            endOpacity={0.1}
            areaChart
            hideDataPoints
            hideRules
            yAxisColor={colors.border}
            xAxisColor={colors.border}
            yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
            noOfSections={4}
          />
        </View>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-xs text-muted mb-1">Total Visits</Text>
            <Text className="text-xl font-bold text-foreground">{website.totalVisits.toLocaleString()}</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-xs text-muted mb-1">Monthly Visits</Text>
            <Text className="text-xl font-bold text-foreground">{website.monthlyVisits.toLocaleString()}</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-xs text-muted mb-1">Weekly Growth</Text>
            <Text className="text-xl font-bold text-success">+{website.weeklyGrowth}%</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-xs text-muted mb-1">Active Campaigns</Text>
            <Text className="text-xl font-bold text-foreground">{website.activeCampaigns}</Text>
          </View>
        </View>

        {/* Active Campaigns */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Active Campaigns</Text>
          {campaigns.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-sm text-muted text-center">
                No active campaigns. Start a campaign to boost traffic.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {campaigns.map((campaign) => (
                <View key={campaign.id} className="bg-surface rounded-2xl p-4 border border-border">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{campaign.name}</Text>
                      <Text className="text-xs text-muted mt-1 capitalize">{campaign.type} Campaign</Text>
                    </View>
                    <View className="bg-success/10 px-3 py-1 rounded-full">
                      <Text className="text-xs font-medium text-success capitalize">{campaign.status}</Text>
                    </View>
                  </View>
                  
                  <View className="mt-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-muted">Progress</Text>
                      <Text className="text-xs text-muted">
                        {campaign.currentVisits.toLocaleString()} / {campaign.targetVisits.toLocaleString()}
                      </Text>
                    </View>
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(campaign.currentVisits / campaign.targetVisits) * 100}%` }}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className="bg-primary rounded-full py-4 active:opacity-80"
            onPress={() => router.push(`/campaign/create?websiteId=${id}` as any)}
          >
            <Text className="text-white font-semibold text-base text-center">Start New Campaign</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-surface border border-border rounded-full py-4 active:opacity-70"
            onPress={() => {}}
          >
            <Text className="text-foreground font-semibold text-base text-center">View Detailed Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
