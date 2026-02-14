import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  percentage: number;
  icon: string;
  color: string;
}

interface BillingData {
  currentPlan: string;
  monthlySpend: number;
  nextBillingDate: string;
  usage: UsageMetric[];
  recentCharges: Array<{
    date: string;
    description: string;
    amount: number;
  }>;
}

export default function BillingDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      const mockData: BillingData = {
        currentPlan: "Pro",
        monthlySpend: 29,
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        usage: [
          {
            name: "Websites",
            used: 8,
            limit: 10,
            percentage: 80,
            icon: "globe",
            color: colors.primary,
          },
          {
            name: "Reports/Month",
            used: 42,
            limit: 50,
            percentage: 84,
            icon: "document.text.fill",
            color: colors.warning,
          },
          {
            name: "Emails/Month",
            used: 3200,
            limit: 5000,
            percentage: 64,
            icon: "envelope.fill",
            color: colors.success,
          },
          {
            name: "API Calls/Day",
            used: 850,
            limit: 1000,
            percentage: 85,
            icon: "network",
            color: colors.primary,
          },
        ],
        recentCharges: [
          {
            date: new Date().toLocaleDateString(),
            description: "Pro Plan - Monthly Subscription",
            amount: 29,
          },
          {
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            description: "Pro Plan - Monthly Subscription",
            amount: 29,
          },
          {
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            description: "Pro Plan - Monthly Subscription",
            amount: 29,
          },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Billing Dashboard</Text>
          <Text className="text-base text-muted mt-2">
            Track your usage and billing information
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : data ? (
          <>
            {/* Plan Overview */}
            <View className="bg-gradient-to-b from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">Current Plan</Text>
                <View style={{ backgroundColor: colors.primary }} className="rounded-full px-3 py-1">
                  <Text className="text-xs font-bold text-background">{data.currentPlan}</Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-4xl font-bold text-foreground">
                  ${data.monthlySpend}
                  <Text className="text-lg text-muted">/month</Text>
                </Text>
              </View>

              <Text className="text-sm text-muted">
                Next billing date: {data.nextBillingDate}
              </Text>
            </View>

            {/* Usage Metrics */}
            <View className="mb-8">
              <Text className="text-lg font-bold text-foreground mb-4">Usage This Month</Text>

              <View className="gap-4">
                {data.usage.map((metric, idx) => (
                  <View key={idx} className="bg-surface rounded-xl p-4 border border-border">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          style={{ backgroundColor: metric.color + "20" }}
                          className="w-10 h-10 rounded-lg items-center justify-center"
                        >
                          <IconSymbol
                            name={metric.icon as any}
                            size={20}
                            color={metric.color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">
                            {metric.name}
                          </Text>
                          <Text className="text-xs text-muted">
                            {metric.used} of {metric.limit}
                          </Text>
                        </View>
                      </View>
                      <Text className="font-bold text-foreground">{metric.percentage}%</Text>
                    </View>

                    {/* Progress Bar */}
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View
                        style={{
                          width: `${metric.percentage}%`,
                          backgroundColor: metric.color,
                        }}
                        className="h-full rounded-full"
                      />
                    </View>

                    {metric.percentage > 80 && (
                      <Text className="text-xs text-warning mt-2">
                        ⚠️ Approaching limit
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Upgrade Suggestion */}
              <View className="mt-6 bg-warning/10 rounded-xl p-4 border border-warning/30">
                <View className="flex-row items-start gap-3">
                  <Text className="text-xl">💡</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground mb-1">
                      Consider upgrading
                    </Text>
                    <Text className="text-sm text-muted">
                      You're using 85% of your API call limit. Upgrade to Enterprise for unlimited resources.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/pricing")}
                      className="mt-3"
                    >
                      <Text className="text-sm font-semibold text-primary">
                        View Plans →
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View className="mb-8">
              <Text className="text-lg font-bold text-foreground mb-4">Cost Breakdown</Text>

              <View className="bg-surface rounded-xl p-4 border border-border gap-3">
                <View className="flex-row justify-between items-center pb-3 border-b border-border">
                  <Text className="text-foreground">Base Plan (Pro)</Text>
                  <Text className="font-semibold text-foreground">$29.00</Text>
                </View>
                <View className="flex-row justify-between items-center pb-3 border-b border-border">
                  <Text className="text-foreground">Additional Features</Text>
                  <Text className="font-semibold text-foreground">$0.00</Text>
                </View>
                <View className="flex-row justify-between items-center pt-2">
                  <Text className="font-semibold text-foreground">Total This Month</Text>
                  <Text className="text-xl font-bold text-primary">$29.00</Text>
                </View>
              </View>
            </View>

            {/* Recent Charges */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-foreground">Recent Charges</Text>
                <TouchableOpacity onPress={() => router.push("/billing-settings")}>
                  <Text className="text-sm font-semibold text-primary">View All</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-3">
                {data.recentCharges.map((charge, idx) => (
                  <View
                    key={idx}
                    className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {charge.description}
                      </Text>
                      <Text className="text-sm text-muted mt-1">{charge.date}</Text>
                    </View>
                    <Text className="font-bold text-foreground">${charge.amount}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Help Section */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="font-semibold text-foreground mb-3">Need Help?</Text>
              <View className="gap-2">
                <TouchableOpacity className="py-2">
                  <Text className="text-sm font-semibold text-primary">
                    Download Invoice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="py-2">
                  <Text className="text-sm font-semibold text-primary">
                    Contact Billing Support
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View className="bg-surface rounded-xl p-6 border border-border items-center">
            <Text className="text-lg font-semibold text-foreground">
              Unable to load billing data
            </Text>
            <TouchableOpacity
              onPress={loadBillingData}
              className="mt-4 px-6 py-2 bg-primary rounded-lg"
            >
              <Text className="font-semibold text-background">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
