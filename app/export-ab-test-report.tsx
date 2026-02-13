import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useABTesting } from "@/lib/ab-testing-context";
import { getABTestMetrics, getWinnerRecommendation } from "@/lib/ab-testing-service";
import { exportABTestAsCSV, exportABTestAsPDF } from "@/lib/export-service";

export default function ExportABTestReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { testId } = useLocalSearchParams();
  const { tests } = useABTesting();
  const [exporting, setExporting] = useState<string | null>(null);

  const test = tests.find((t) => t.id === testId);

  if (!test) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground text-lg font-semibold">Test not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const metrics = getABTestMetrics(test);
  const recommendation = getWinnerRecommendation(test);

  const handleExportCSV = async () => {
    try {
      setExporting("csv");
      await exportABTestAsCSV(test, metrics, recommendation);
      Alert.alert("Success", "A/B test report exported as CSV");
    } catch (error) {
      Alert.alert("Error", "Failed to export A/B test report");
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting("pdf");
      await exportABTestAsPDF(test, metrics, recommendation);
      Alert.alert("Success", "A/B test report exported as PDF");
    } catch (error) {
      Alert.alert("Error", "Failed to export A/B test report");
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
            <Text className="text-muted">{test.name}</Text>
          </View>

          {/* Test Summary */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-sm text-muted">Test Name</Text>
                <Text className="text-lg font-bold text-foreground mt-1">
                  {test.name}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted">Status</Text>
                <Text className="text-lg font-bold text-primary mt-1">
                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-muted">Total Visits</Text>
                <Text className="text-base font-semibold text-foreground mt-1">
                  {metrics.totalVisits.toLocaleString()}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted">Conversions</Text>
                <Text className="text-base font-semibold text-foreground mt-1">
                  {metrics.totalConversions.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-muted">Significance</Text>
                <Text className="text-base font-semibold text-success mt-1">
                  {metrics.statisticalSignificance.toFixed(1)}%
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
                  Test overview and configuration
                </Text>
              </View>
              <View className="flex-row items-center gap-3 bg-surface rounded-lg p-3 border border-border">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">
                  Variation performance comparison
                </Text>
              </View>
              <View className="flex-row items-center gap-3 bg-surface rounded-lg p-3 border border-border">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">
                  Statistical significance analysis
                </Text>
              </View>
              <View className="flex-row items-center gap-3 bg-surface rounded-lg p-3 border border-border">
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">
                  Winner recommendation and insights
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
                  Reports include comprehensive test metrics, variation performance
                  comparison, statistical analysis, and actionable recommendations for
                  implementing the winning variation.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
