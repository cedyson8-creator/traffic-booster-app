import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useWebsites } from "@/lib/websites-context";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { websites, isLoading } = useWebsites();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalVisits = websites.reduce((sum, site) => sum + site.monthlyVisits, 0);
  const activeCampaigns = websites.reduce((sum, site) => sum + site.activeCampaigns, 0);
  const avgGrowth = websites.length > 0 ? websites.reduce((sum, site) => sum + site.weeklyGrowth, 0) / websites.length : 0;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-base text-muted mt-1">Track your website traffic growth</Text>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted mb-1">Monthly Visits</Text>
            <Text className="text-2xl font-bold text-foreground">{totalVisits.toLocaleString()}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted mb-1">Active Campaigns</Text>
            <Text className="text-2xl font-bold text-foreground">{activeCampaigns}</Text>
          </View>
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
          <Text className="text-sm text-muted mb-1">Avg Weekly Growth</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-success">+{avgGrowth.toFixed(1)}%</Text>
            <IconSymbol name="arrow.up.right" size={20} color={colors.success} />
          </View>
        </View>

        {/* Add Website Button */}
        <TouchableOpacity
          className="bg-primary rounded-full py-4 mb-6 active:opacity-80"
          onPress={() => router.push('/add-website')}
        >
          <View className="flex-row items-center justify-center gap-2">
            <IconSymbol name="plus.circle.fill" size={24} color="#ffffff" />
            <Text className="text-white font-semibold text-base">Add New Website</Text>
          </View>
        </TouchableOpacity>

        {/* My Websites */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-foreground mb-3">My Websites</Text>
          
          {websites.length === 0 ? (
            <View className="bg-surface rounded-2xl p-8 border border-border items-center">
              <IconSymbol name="globe" size={48} color={colors.muted} />
              <Text className="text-base text-muted mt-4 text-center">
                No websites yet. Add your first website to start tracking traffic.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {websites.map((website) => (
                <TouchableOpacity
                  key={website.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                  onPress={() => router.push(`/website/${website.id}`)}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground mb-1">
                        {website.name}
                      </Text>
                      <Text className="text-sm text-muted" numberOfLines={1}>
                        {website.url}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                  </View>

                  <View className="flex-row items-center gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted mb-1">Monthly Visits</Text>
                      <Text className="text-base font-semibold text-foreground">
                        {website.monthlyVisits.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted mb-1">Weekly Growth</Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-base font-semibold text-success">
                          +{website.weeklyGrowth}%
                        </Text>
                        <IconSymbol name="arrow.up.right" size={14} color={colors.success} />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted mb-1">Campaigns</Text>
                      <Text className="text-base font-semibold text-foreground">
                        {website.activeCampaigns}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
