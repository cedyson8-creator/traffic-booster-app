import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Get started with basic traffic analytics",
    features: [
      "1 website",
      "5 scheduled reports/month",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "For growing businesses",
    features: [
      "10 websites",
      "50 scheduled reports/month",
      "Advanced analytics",
      "Webhooks & integrations",
      "Priority support",
      "Custom reports",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: "For large organizations",
    features: [
      "Unlimited websites",
      "Unlimited scheduled reports",
      "Advanced analytics",
      "Full API access",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export default function PricingScreen() {
  const router = useRouter();
  const colors = useColors();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSelectPlan = (planId: string) => {
    router.push({
      pathname: "/checkout",
      params: { planId, billingCycle },
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Pricing Plans</Text>
          <Text className="text-base text-muted mt-2">
            Choose the perfect plan for your business
          </Text>
        </View>

        {/* Billing Cycle Toggle */}
        <View className="flex-row gap-3 mb-8 bg-surface rounded-full p-1">
          <Pressable
            onPress={() => setBillingCycle("monthly")}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor:
                  billingCycle === "monthly" ? colors.primary : "transparent",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              className={cn(
                "text-center font-semibold",
                billingCycle === "monthly"
                  ? "text-background"
                  : "text-foreground"
              )}
            >
              Monthly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setBillingCycle("yearly")}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor:
                  billingCycle === "yearly" ? colors.primary : "transparent",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              className={cn(
                "text-center font-semibold",
                billingCycle === "yearly" ? "text-background" : "text-foreground"
              )}
            >
              Yearly
              <Text className="text-xs text-success"> Save 17%</Text>
            </Text>
          </Pressable>
        </View>

        {/* Plans */}
        <View className="gap-6">
          {PLANS.map((plan) => (
            <View
              key={plan.id}
              className={cn(
                "rounded-2xl p-6 border",
                plan.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface"
              )}
            >
              {plan.highlighted && (
                <View className="mb-4 flex-row items-center gap-2">
                  <View className="bg-primary rounded-full px-3 py-1">
                    <Text className="text-xs font-bold text-background">
                      MOST POPULAR
                    </Text>
                  </View>
                </View>
              )}

              {/* Plan Name & Description */}
              <Text className="text-2xl font-bold text-foreground mb-2">
                {plan.name}
              </Text>
              <Text className="text-sm text-muted mb-4">{plan.description}</Text>

              {/* Price */}
              <View className="mb-6">
                <Text className="text-4xl font-bold text-foreground">
                  ${billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  per {billingCycle === "monthly" ? "month" : "year"}
                </Text>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                onPress={() => handleSelectPlan(plan.id)}
                style={{
                  backgroundColor: plan.highlighted ? colors.primary : colors.border,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginBottom: 20,
                }}
                activeOpacity={0.8}
              >
                <Text
                  className={cn(
                    "text-center font-semibold",
                    plan.highlighted ? "text-background" : "text-foreground"
                  )}
                >
                  {plan.monthlyPrice === 0 ? "Get Started" : "Subscribe Now"}
                </Text>
              </TouchableOpacity>

              {/* Features */}
              <View className="gap-3">
                {plan.features.map((feature, idx) => (
                  <View key={idx} className="flex-row items-center gap-3">
                    <View className="w-5 h-5 rounded-full bg-success items-center justify-center">
                      <Text className="text-xs font-bold text-background">✓</Text>
                    </View>
                    <Text className="flex-1 text-sm text-foreground">{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <View className="mt-12 mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </Text>

          <View className="gap-4">
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="font-semibold text-foreground mb-2">
                Can I change my plan anytime?
              </Text>
              <Text className="text-sm text-muted">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </Text>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="font-semibold text-foreground mb-2">
                What payment methods do you accept?
              </Text>
              <Text className="text-sm text-muted">
                We accept all major credit cards, debit cards, and digital payment methods through Stripe.
              </Text>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="font-semibold text-foreground mb-2">
                Is there a free trial?
              </Text>
              <Text className="text-sm text-muted">
                Yes! Start with our Free plan and upgrade whenever you're ready. No credit card required.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
