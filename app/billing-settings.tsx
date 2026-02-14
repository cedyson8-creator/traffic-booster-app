import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  planName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  monthlyPrice: number;
  features: string[];
}

export default function BillingSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:3000/api/payments/subscription", {
        headers: {
          "Content-Type": "application/json",
          // In production, add auth token
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    router.push("/pricing");
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You'll lose access to premium features.",
      [
        { text: "Keep Subscription", onPress: () => {}, style: "cancel" },
        {
          text: "Cancel Subscription",
          onPress: async () => {
            try {
              setCancelLoading(true);
              const response = await fetch("http://127.0.0.1:3000/api/payments/cancel", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ atPeriodEnd: true }),
              });

              if (response.ok) {
                Alert.alert("Success", "Your subscription will be cancelled at the end of the billing period.");
                loadSubscription();
              } else {
                Alert.alert("Error", "Failed to cancel subscription. Please try again.");
              }
            } catch (error) {
              Alert.alert("Error", "An error occurred. Please try again.");
            } finally {
              setCancelLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Billing & Subscription</Text>
          <Text className="text-base text-muted mt-2">
            Manage your subscription and billing information
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : subscription ? (
          <>
            {/* Current Plan Card */}
            <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-foreground">Current Plan</Text>
                <View
                  style={{ backgroundColor: colors.primary }}
                  className="rounded-full px-3 py-1"
                >
                  <Text className="text-xs font-bold text-background">
                    {subscription.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text className="text-3xl font-bold text-foreground mb-2">
                {subscription.planName}
              </Text>

              <Text className="text-base text-foreground mb-6">
                ${subscription.monthlyPrice}
                <Text className="text-sm text-muted">/month</Text>
              </Text>

              {/* Billing Period */}
              <View className="bg-background rounded-lg p-4 mb-6">
                <Text className="text-xs text-muted uppercase font-semibold mb-2">
                  Billing Period
                </Text>
                <Text className="text-sm text-foreground">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Text>
              </View>

              {/* Features */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Included Features
                </Text>
                <View className="gap-2">
                  {subscription.features.map((feature, idx) => (
                    <View key={idx} className="flex-row items-center gap-2">
                      <View className="w-4 h-4 rounded-full bg-success items-center justify-center">
                        <Text className="text-xs text-background">✓</Text>
                      </View>
                      <Text className="text-sm text-foreground flex-1">{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-3">
                <TouchableOpacity
                  onPress={handleUpgradePlan}
                  style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12 }}
                  activeOpacity={0.8}
                >
                  <Text className="text-center font-semibold text-background">
                    Upgrade Plan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancelSubscription}
                  disabled={cancelLoading}
                  style={{
                    backgroundColor: colors.error,
                    paddingVertical: 12,
                    borderRadius: 12,
                    opacity: cancelLoading ? 0.6 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {cancelLoading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text className="text-center font-semibold text-background">
                      Cancel Subscription
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Method Section */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-4">Payment Method</Text>

              <View className="bg-surface rounded-2xl p-6 border border-border">
                <View className="flex-row items-center gap-4 mb-4">
                  <View
                    style={{ backgroundColor: colors.primary }}
                    className="w-12 h-12 rounded-lg items-center justify-center"
                  >
                    <Text className="text-xl">💳</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">Visa ending in 4242</Text>
                    <Text className="text-sm text-muted">Expires 12/25</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{ paddingVertical: 10 }}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-semibold text-primary">Update Payment Method</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Billing History */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-4">Billing History</Text>

              <View className="gap-3">
                {[1, 2, 3].map((idx) => (
                  <View key={idx} className="bg-surface rounded-lg p-4 border border-border flex-row items-center justify-between">
                    <View>
                      <Text className="font-semibold text-foreground">
                        Monthly Subscription
                      </Text>
                      <Text className="text-sm text-muted">
                        {new Date(Date.now() - idx * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-semibold text-foreground">
                        ${subscription.monthlyPrice}
                      </Text>
                      <Text className="text-xs text-success">Paid</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => router.push("/billing-history")}
                className="mt-4 py-3 items-center"
              >
                <Text className="text-sm font-semibold text-primary">View All Invoices</Text>
              </TouchableOpacity>
            </View>

            {/* Support Section */}
            <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
              <Text className="font-semibold text-foreground mb-3">Need Help?</Text>
              <Text className="text-sm text-muted mb-4">
                Have questions about your subscription or need to make changes?
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-sm font-semibold text-primary">Contact Support</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View className="bg-surface rounded-2xl p-6 border border-border items-center">
            <Text className="text-lg font-semibold text-foreground mb-2">
              No Active Subscription
            </Text>
            <Text className="text-sm text-muted text-center mb-4">
              Upgrade to a paid plan to unlock premium features
            </Text>
            <TouchableOpacity
              onPress={handleUpgradePlan}
              style={{ backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-background">View Plans</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
