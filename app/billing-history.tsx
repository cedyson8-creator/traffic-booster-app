import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  pdfUrl?: string;
}

export default function BillingHistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Mock data - in production, fetch from API
      const mockInvoices: Invoice[] = [
        {
          id: "inv_001",
          date: new Date().toLocaleDateString(),
          description: "Pro Plan - Monthly Subscription",
          amount: 29,
          status: "paid",
          pdfUrl: "#",
        },
        {
          id: "inv_002",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          description: "Pro Plan - Monthly Subscription",
          amount: 29,
          status: "paid",
          pdfUrl: "#",
        },
        {
          id: "inv_003",
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          description: "Pro Plan - Monthly Subscription",
          amount: 29,
          status: "paid",
          pdfUrl: "#",
        },
        {
          id: "inv_004",
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          description: "Pro Plan - Monthly Subscription",
          amount: 29,
          status: "paid",
          pdfUrl: "#",
        },
        {
          id: "inv_005",
          date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          description: "Free Plan",
          amount: 0,
          status: "paid",
          pdfUrl: "#",
        },
      ];

      setInvoices(mockInvoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
      Alert.alert("Error", "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      // In production, trigger actual PDF download
      Alert.alert("Success", `Invoice ${invoice.id} downloaded successfully`);
    } catch (error) {
      Alert.alert("Error", "Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return colors.success;
      case "pending":
        return colors.warning;
      case "failed":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return "checkmark.circle.fill";
      case "pending":
        return "clock.fill";
      case "failed":
        return "xmark.circle.fill";
      default:
        return "circle.fill";
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
          <Text className="text-3xl font-bold text-foreground">Billing History</Text>
          <Text className="text-base text-muted mt-2">
            View and download your invoices
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : invoices.length > 0 ? (
          <>
            {/* Invoices List */}
            <View className="gap-3">
              {invoices.map((invoice) => (
                <View
                  key={invoice.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        style={{ backgroundColor: colors.primary + "20" }}
                        className="w-10 h-10 rounded-lg items-center justify-center"
                      >
                        <IconSymbol
                          name="doc.text.fill"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">
                          {invoice.description}
                        </Text>
                        <Text className="text-sm text-muted">{invoice.date}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-foreground">
                        ${invoice.amount}
                      </Text>
                      <View className="flex-row items-center gap-1 mt-1">
                        <IconSymbol
                          name={getStatusIcon(invoice.status) as any}
                          size={14}
                          color={getStatusColor(invoice.status)}
                        />
                        <Text
                          className="text-xs font-semibold capitalize"
                          style={{ color: getStatusColor(invoice.status) }}
                        >
                          {invoice.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-2 pt-3 border-t border-border">
                    <TouchableOpacity
                      onPress={() => handleDownloadInvoice(invoice)}
                      disabled={downloadingId === invoice.id}
                      className="flex-1 py-2 px-3 bg-primary/10 rounded-lg items-center justify-center"
                      activeOpacity={0.7}
                    >
                      {downloadingId === invoice.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <View className="flex-row items-center gap-2">
                          <IconSymbol
                            name="arrow.down.doc.fill"
                            size={14}
                            color={colors.primary}
                          />
                          <Text className="text-xs font-semibold text-primary">
                            Download
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 py-2 px-3 bg-border rounded-lg items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-2">
                        <IconSymbol
                          name="envelope.fill"
                          size={14}
                          color={colors.foreground}
                        />
                        <Text className="text-xs font-semibold text-foreground">
                          Email
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Export All */}
            <TouchableOpacity
              className="mt-8 py-3 px-4 border-2 border-primary rounded-lg items-center"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-2">
                <IconSymbol name="arrow.down.doc.fill" size={16} color={colors.primary} />
                <Text className="font-semibold text-primary">Export All Invoices</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View className="bg-surface rounded-xl p-6 border border-border items-center">
            <IconSymbol name="doc.text.fill" size={40} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4 mb-2">
              No Invoices Yet
            </Text>
            <Text className="text-sm text-muted text-center mb-4">
              Your invoices will appear here once you have an active subscription
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/pricing")}
              style={{ backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
            >
              <Text className="font-semibold text-background">View Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Section */}
        {invoices.length > 0 && (
          <View className="mt-8 bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Need Help?</Text>
            <Text className="text-sm text-muted mb-3">
              Can't find an invoice or have questions about your billing?
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-sm font-semibold text-primary">
                Contact Billing Support →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
