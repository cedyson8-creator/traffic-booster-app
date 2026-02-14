import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

/**
 * Pricing & Usage Screen
 * Displays real-time quota usage, billing information, and upgrade recommendations
 */
export default function PricingUsageScreen() {
  const colors = useColors();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');

  // Mock data - in production, fetch from API
  const quotaData = {
    currentPlan: 'pro',
    monthlyRequests: { used: 75000, limit: 100000 },
    webhooks: { used: 8500, limit: 10000 },
    exports: { used: 85, limit: 100 },
    alerts: { used: 950, limit: 1000 },
    overageCharges: 245.50,
    monthlyBill: 9900,
  };

  const plans = {
    free: {
      name: 'Free',
      price: '$0',
      requests: '10K',
      webhooks: '1K',
      exports: '10',
      alerts: '100',
      features: ['Basic API access', 'Email support', 'Community access'],
    },
    pro: {
      name: 'Pro',
      price: '$99',
      requests: '100K',
      webhooks: '10K',
      exports: '100',
      alerts: '1K',
      features: ['Advanced API', 'Priority support', 'Custom webhooks', 'Team management'],
    },
    enterprise: {
      name: 'Enterprise',
      price: '$499',
      requests: '1M',
      webhooks: '100K',
      exports: '1K',
      alerts: '10K',
      features: ['Unlimited API', '24/7 support', 'Custom integration', 'SLA guarantee'],
    },
  };

  const getUsagePercentage = (used: number, limit: number) => (used / limit) * 100;
  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return colors.error;
    if (percentage >= 90) return colors.warning;
    return colors.success;
  };

  const UsageBar = ({ label, used, limit }: { label: string; used: number; limit: number }) => {
    const percentage = getUsagePercentage(used, limit);
    const displayPercentage = Math.min(percentage, 100);

    return (
      <View className="mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm font-medium text-foreground">{label}</Text>
          <Text className="text-sm text-muted">
            {used.toLocaleString()} / {limit.toLocaleString()}
          </Text>
        </View>
        <View className="h-2 bg-surface rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${displayPercentage}%`,
              backgroundColor: getUsageColor(percentage),
            }}
          />
        </View>
        <Text className="text-xs text-muted mt-1">{displayPercentage.toFixed(1)}% used</Text>
      </View>
    );
  };

  const PlanCard = ({ planKey, plan }: { planKey: string; plan: (typeof plans)[keyof typeof plans] }) => {
    const isSelected = selectedPlan === planKey;

    return (
      <Pressable
        onPress={() => setSelectedPlan(planKey as any)}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: 2,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            backgroundColor: isSelected ? colors.surface : colors.background,
          },
        ]}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-lg font-bold text-foreground">{plan.name}</Text>
            <Text className="text-2xl font-bold text-primary mt-1">{plan.price}</Text>
            <Text className="text-xs text-muted">/month</Text>
          </View>
          {isSelected && (
            <View
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-center text-sm font-bold">✓</Text>
            </View>
          )}
        </View>

        <View className="border-t border-border pt-3 mt-3">
          <View className="mb-2">
            <Text className="text-sm text-muted">Requests/month</Text>
            <Text className="text-base font-semibold text-foreground">{plan.requests}</Text>
          </View>
          <View className="mb-2">
            <Text className="text-sm text-muted">Webhooks</Text>
            <Text className="text-base font-semibold text-foreground">{plan.webhooks}</Text>
          </View>
          <View className="mb-2">
            <Text className="text-sm text-muted">Exports</Text>
            <Text className="text-base font-semibold text-foreground">{plan.exports}</Text>
          </View>
          <View>
            <Text className="text-sm text-muted">Alerts</Text>
            <Text className="text-base font-semibold text-foreground">{plan.alerts}</Text>
          </View>
        </View>

        <View className="mt-3 pt-3 border-t border-border">
          {plan.features.map((feature, idx) => (
            <Text key={idx} className="text-sm text-muted mb-1">
              ✓ {feature}
            </Text>
          ))}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Current Usage */}
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">Current Usage</Text>

            <View className="bg-surface rounded-lg p-4 mb-4">
              <View className="flex-row justify-between mb-3">
                <Text className="text-base font-semibold text-foreground">Current Plan</Text>
                <Text className="text-base font-bold text-primary">Pro</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Monthly Bill</Text>
                <Text className="text-lg font-bold text-foreground">
                  ${(quotaData.monthlyBill / 100).toFixed(2)}
                </Text>
              </View>
              {quotaData.overageCharges > 0 && (
                <View className="flex-row justify-between mt-2 pt-2 border-t border-border">
                  <Text className="text-sm text-muted">Overage Charges</Text>
                  <Text className="text-base font-semibold text-warning">
                    ${(quotaData.overageCharges / 100).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <UsageBar
              label="API Requests"
              used={quotaData.monthlyRequests.used}
              limit={quotaData.monthlyRequests.limit}
            />
            <UsageBar
              label="Webhooks"
              used={quotaData.webhooks.used}
              limit={quotaData.webhooks.limit}
            />
            <UsageBar
              label="Exports"
              used={quotaData.exports.used}
              limit={quotaData.exports.limit}
            />
            <UsageBar
              label="Alerts"
              used={quotaData.alerts.used}
              limit={quotaData.alerts.limit}
            />
          </View>

          {/* Upgrade Recommendation */}
          {getUsagePercentage(quotaData.monthlyRequests.used, quotaData.monthlyRequests.limit) > 80 && (
            <View
              className="rounded-lg p-4 border-l-4"
              style={{ borderLeftColor: colors.warning, backgroundColor: colors.surface }}
            >
              <Text className="text-base font-bold text-foreground mb-2">Upgrade Recommended</Text>
              <Text className="text-sm text-muted mb-3">
                You're using {getUsagePercentage(quotaData.monthlyRequests.used, quotaData.monthlyRequests.limit).toFixed(0)}% of your monthly quota. Consider upgrading to Enterprise for unlimited access.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    padding: 10,
                    borderRadius: 6,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white text-center font-semibold">View Enterprise Plan</Text>
              </Pressable>
            </View>
          )}

          {/* Pricing Plans */}
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">Pricing Plans</Text>

            <PlanCard planKey="free" plan={plans.free} />
            <PlanCard planKey="pro" plan={plans.pro} />
            <PlanCard planKey="enterprise" plan={plans.enterprise} />
          </View>

          {/* Overage Pricing */}
          <View>
            <Text className="text-xl font-bold text-foreground mb-3">Overage Pricing</Text>

            <View className="bg-surface rounded-lg p-4">
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm text-muted">API Requests</Text>
                <Text className="text-sm font-semibold text-foreground">$0.001 per request</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm text-muted">Webhooks</Text>
                <Text className="text-sm font-semibold text-foreground">$0.01 per webhook</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm text-muted">Exports</Text>
                <Text className="text-sm font-semibold text-foreground">$1.00 per export</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Alerts</Text>
                <Text className="text-sm font-semibold text-foreground">$0.10 per alert</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 mb-4">
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  padding: 14,
                  borderRadius: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-white text-center font-semibold">Upgrade Plan</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 14,
                  borderRadius: 8,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text className="text-foreground text-center font-semibold">View Billing History</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
