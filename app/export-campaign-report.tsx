import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useWebsites } from "@/lib/websites-context";
import { useCampaigns } from "@/lib/campaigns-context";
import { useRecommendations } from "@/lib/recommendations-context";
import { calculateCampaignMetrics } from "@/lib/recommendations-service";
import {
  exportCampaignAsCSV,
  exportCampaignAsPDF,
} from "@/lib/export-service";

export default function ExportCampaignReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { campaignId } = useLocalSearchParams();
  const { websites } = useWebsites();
  const { campaigns } = useCampaigns();
  const { getRecommendationsForCampaign } = useRecommendations();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const campaign = campaigns.find((c) => c.id === campaignId);
  const website = campaign ? websites.find((w) => w.id === campaign.websiteId) : null;
  const recommendations = campaign
    ? getRecommendationsForCampaign(campaign.id)
    : [];

  if (!campaign || !website) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground text-lg font-semibold">Campaign not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const metrics = calculateCampaignMetrics(campaign);
  const recommendationTexts = recommendations.map((r) => r.suggestion);

  const handleExportCSV = async () => {
    try {
      setExporting("csv");
      await exportCampaignAsCSV(campaign, website, metrics, recommendationTexts);
      Alert.alert("Success", "Campaign report exported as CSV");
    } catch (error) {
      Alert.alert("Error", "Failed to export campaign report");
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting("pdf");
      await exportCampaignAsPDF(campaign, website, metrics, recommendationTexts);
      Alert.alert("Success", "Campaign report exported as PDF");
    } catch (error) {
      Alert.alert("Error", "Failed to export campaign report");
      console.error(error);
    } finally {
      setExporting(null);
    }
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
            <Text className="text-3xl font-bold text-foreground mb-1">
              Export Report
            </Text>
            <Text className="text-muted">{campaign.name}</Text>
          </View>

          {/* Campaign Summary */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-sm text-muted">Campaign</Text>
                <Text className="text-lg font-bold text-foreground mt-1">
                  {campaign.name}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted">Website</Text>
                <Text className="text-lg font-bold text-foreground mt-1">
                  {website.name}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-muted">Progress</Text>
                <Text className="text-base font-semibold text-primary mt-1">
                  {campaign.currentVisits.toLocaleString()} /{" "}
                  {campaign.targetVisits.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-muted">ROI</Text>
                <Text className="text-base font-semibold text-success mt-1">
                  {metrics.roi.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Report Contents */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Report Contents
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-3 bg-surface rounded-lg p-3 border border-border">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">
                  Campaign performance metrics
                </Text>
              </View>
              <View className="flex-row items-center gap-3 bg-surface rounded-lg p-3 border border-border">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">
                  Daily traffic breakdown
                </Text>
              </View>
              <View className="flex-row items-center gap-3 bg-surface rounded-lg p-3 border border-border">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">
                  ROI and cost analysis
                </Text>
              </View>
              <View className="flex-row items-center gap-3 bg-surface rounded-lg p-3 border border-border">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">
                  Optimization recommendations ({recommendations.length})
                </Text>
              </View>
            </View>
          </View>

          {/* Export Options */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Export Format
            </Text>
            <View className="gap-2">
              {/* CSV Export */}
              <TouchableOpacity
                onPress={handleExportCSV}
                disabled={exporting !== null}
                className={`rounded-2xl p-4 border flex-row items-center justify-between ${
                  exporting === "csv"
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="w-12 h-12 rounded-lg items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <MaterialIcons
                      name="table-chart"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">
                      CSV Format
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Spreadsheet compatible
                    </Text>
                  </View>
                </View>
                {exporting === "csv" ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="download" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* PDF Export */}
              <TouchableOpacity
                onPress={handleExportPDF}
                disabled={exporting !== null}
                className={`rounded-2xl p-4 border flex-row items-center justify-between ${
                  exporting === "pdf"
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="w-12 h-12 rounded-lg items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <MaterialIcons
                      name="picture-as-pdf"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">
                      PDF Format
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Professional document
                    </Text>
                  </View>
                </View>
                {exporting === "pdf" ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="download" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <View className="flex-row gap-3">
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  Report Details
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Reports include comprehensive metrics, daily performance data, ROI
                  analysis, and personalized recommendations for campaign optimization.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
