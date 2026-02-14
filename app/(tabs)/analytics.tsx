import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LineChart, PieChart } from "react-native-gifted-charts";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { generateTrafficStats, mockTrafficSources, mockGeographicData, mockTopPages } from "@/lib/mock-data";
import { ReportCustomizationModal } from "@/components/report-customization-modal";

type TimeRange = '7d' | '30d' | 'all';

export default function AnalyticsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [showReportCustomizer, setShowReportCustomizer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const trafficData = generateTrafficStats(days);

  const chartData = trafficData.map((stat, index) => ({
    value: stat.visits,
    label: index % Math.floor(days / 7) === 0 ? new Date(stat.date).getDate().toString() : '',
  }));

  const pieData = mockTrafficSources.map((source, index) => ({
    value: source.percentage,
    color: [colors.primary, colors.success, colors.warning, colors.error][index],
    text: `${source.percentage}%`,
  }));

  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
          {/* Header */}
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">Analytics</Text>
              <Text className="text-base text-muted mt-1">Comprehensive traffic insights</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/integrations-dashboard")}
              className="bg-primary rounded-lg px-3 py-2 ml-2"
            >
              <Text className="text-background text-xs font-semibold">Integrations</Text>
            </TouchableOpacity>
          </View>

          {/* Time Range Selector */}
          <View className="flex-row gap-2 mb-6">
            {[
              { id: '7d' as TimeRange, label: '7 Days' },
              { id: '30d' as TimeRange, label: '30 Days' },
              { id: 'all' as TimeRange, label: 'All Time' },
            ].map((range) => (
              <TouchableOpacity
                key={range.id}
                className={`flex-1 py-3 rounded-full border ${
                  timeRange === range.id
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
                onPress={() => setTimeRange(range.id)}
              >
                <Text
                  className={`text-sm font-semibold text-center ${
                    timeRange === range.id ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Traffic Chart */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <Text className="text-base font-semibold text-foreground mb-4">Traffic Trend</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 80}
              height={200}
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

          {/* Traffic Sources */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <Text className="text-base font-semibold text-foreground mb-4">Traffic Sources</Text>
            
            <View className="items-center mb-4">
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={50}
                centerLabelComponent={() => (
                  <View>
                    <Text className="text-xl font-bold text-foreground text-center">100%</Text>
                    <Text className="text-xs text-muted text-center">Total</Text>
                  </View>
                )}
              />
            </View>

            <View className="gap-2">
              {mockTrafficSources.map((source, index) => (
                <View key={source.source} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: [colors.primary, colors.success, colors.warning, colors.error][index] }}
                    />
                    <Text className="text-sm text-foreground capitalize">{source.source}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm text-muted">{source.visits.toLocaleString()}</Text>
                    <Text className="text-sm font-semibold text-foreground">{source.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Geographic Distribution */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <Text className="text-base font-semibold text-foreground mb-3">Geographic Distribution</Text>
            <View className="gap-2">
              {mockGeographicData.map((geo) => (
                <View key={geo.country}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm text-foreground">{geo.country}</Text>
                    <Text className="text-sm text-muted">{geo.visits.toLocaleString()} ({geo.percentage}%)</Text>
                  </View>
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${geo.percentage}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Top Pages */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-6">
            <Text className="text-base font-semibold text-foreground mb-3">Top Pages</Text>
            <View className="gap-3">
              {mockTopPages.map((page, index) => (
                <View key={page.url} className="flex-row items-start gap-3">
                  <View className="w-6 h-6 bg-primary/10 rounded-full items-center justify-center">
                    <Text className="text-xs font-bold text-primary">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {page.url}
                    </Text>
                    <View className="flex-row items-center gap-3 mt-1">
                      <Text className="text-xs text-muted">{page.visits.toLocaleString()} visits</Text>
                      <Text className="text-xs text-muted">{page.bounceRate}% bounce</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            className="bg-primary rounded-full py-4 active:opacity-70"
            onPress={() => setShowReportCustomizer(true)}
          >
            <Text className="text-background font-semibold text-base text-center">📊 Customize & Export Report</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>

      {/* Report Customization Modal */}
      <ReportCustomizationModal
        visible={showReportCustomizer}
        onClose={() => setShowReportCustomizer(false)}
        userId={1}
        websiteId={1}
        onExport={async (metrics, format, useRealData = false) => {
          setIsExporting(true);
          try {
            if (useRealData) {
              const endpoint = `/api/export/${format}-real`;
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: 1,
                  websiteId: 1,
                  metrics,
                  dateRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString(),
                  },
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to export real data');
              }

              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `traffic-report-${new Date().toISOString().split('T')[0]}.${format}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } else {
              console.log('Exporting mock report with metrics:', metrics, 'format:', format);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error('Export failed:', error);
          } finally {
            setIsExporting(false);
          }
        }}
        isLoading={isExporting}
      />
    </>
  );
}
