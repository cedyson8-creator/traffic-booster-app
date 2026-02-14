import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
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
}

export default function CheckoutScreen() {
  const router = useRouter();
  const colors = useColors();
  const { planId, billingCycle } = useLocalSearchParams();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    // Load plan details
    const plans: Record<string, Plan> = {
      free: {
        id: "free",
        name: "Free",
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: "Get started with basic traffic analytics",
      },
      pro: {
        id: "pro",
        name: "Pro",
        monthlyPrice: 29,
        yearlyPrice: 290,
        description: "For growing businesses",
      },
      enterprise: {
        id: "enterprise",
        name: "Enterprise",
        monthlyPrice: 99,
        yearlyPrice: 990,
        description: "For large organizations",
      },
    };

    setPlan(plans[planId as string] || null);
  }, [planId]);

  const handlePayment = async () => {
    if (!plan) return;

    // Validation
    if (plan.monthlyPrice > 0) {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        Alert.alert("Error", "Please fill in all card details");
        return;
      }

      if (cardNumber.length < 13) {
        Alert.alert("Error", "Invalid card number");
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch("http://127.0.0.1:3000/api/payments/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethodId: "pm_test", // In production, use Stripe Elements
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Subscription created successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)/profile");
            },
          },
        ]);
      } else {
        const error = await response.json();
        Alert.alert("Error", error.error || "Failed to process payment");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const isFree = price === 0;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Checkout</Text>
          <Text className="text-base text-muted mt-2">
            Complete your subscription
          </Text>
        </View>

        {/* Order Summary */}
        <View className="bg-surface rounded-2xl p-6 border border-border mb-8">
          <Text className="text-lg font-bold text-foreground mb-4">Order Summary</Text>

          <View className="gap-3 mb-4 pb-4 border-b border-border">
            <View className="flex-row justify-between">
              <Text className="text-foreground">{plan.name} Plan</Text>
              <Text className="font-semibold text-foreground">${price}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted text-sm">
                Billed {billingCycle === "yearly" ? "yearly" : "monthly"}
              </Text>
              <Text className="text-muted text-sm">
                {billingCycle === "yearly" ? "12 months" : "1 month"}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-foreground">Total</Text>
            <Text className="text-2xl font-bold text-primary">${price}</Text>
          </View>
        </View>

        {!isFree && (
          <>
            {/* Payment Details */}
            <View className="mb-8">
              <Text className="text-lg font-bold text-foreground mb-4">Payment Details</Text>

              {/* Cardholder Name */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Cardholder Name
                </Text>
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor={colors.muted}
                  value={cardName}
                  onChangeText={setCardName}
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                  }}
                />
              </View>

              {/* Card Number */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Card Number
                </Text>
                <TextInput
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor={colors.muted}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={19}
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                  }}
                />
                <Text className="text-xs text-muted mt-2">
                  Test card: 4242 4242 4242 4242
                </Text>
              </View>

              {/* Expiry & CVV */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Expiry Date
                  </Text>
                  <TextInput
                    placeholder="MM/YY"
                    placeholderTextColor={colors.muted}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    keyboardType="numeric"
                    maxLength={5}
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: colors.foreground,
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    CVV
                  </Text>
                  <TextInput
                    placeholder="123"
                    placeholderTextColor={colors.muted}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: colors.foreground,
                    }}
                  />
                </View>
              </View>

              {/* Security Notice */}
              <View className="flex-row items-center gap-2 bg-success/10 rounded-lg p-3 mb-6">
                <IconSymbol name="lock.fill" size={16} color={colors.success} />
                <Text className="text-xs text-success flex-1">
                  Your payment information is secure and encrypted
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Terms & Conditions */}
        <View className="mb-8 p-4 bg-surface rounded-lg border border-border">
          <Text className="text-xs text-muted leading-relaxed">
            By clicking "Complete Purchase", you agree to our Terms of Service and authorize us to charge your payment method. Your subscription will renew automatically at the end of each billing period.
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            opacity: loading ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text className="text-center font-bold text-background text-base">
              {isFree ? "Get Started" : "Complete Purchase"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
          style={{ paddingVertical: 12, marginTop: 12 }}
        >
          <Text className="text-center font-semibold text-primary">Back to Plans</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
