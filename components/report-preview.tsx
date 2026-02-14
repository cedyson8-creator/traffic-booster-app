import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import { AVAILABLE_METRICS } from './report-builder';

interface ReportPreviewProps {
  selectedMetrics: string[];
  websiteName?: string;
  dateRange?: { start: string; end: string };
}

interface MetricData {
  value: string | number;
  change?: string;
  unit?: string;
}

const MOCK_METRIC_DATA: Record<string, MetricData> = {
  total_visits: { value: '45,230', change: '+12.5%', unit: 'visits' },
  unique_visitors: { value: '28,900', change: '+8.3%', unit: 'visitors' },
  avg_session_duration: { value: '3m 42s', change: '+0.5m', unit: 'minutes' },
  bounce_rate: { value: '42.3%', change: '-2.1%', unit: 'percent' },
  growth_rate: { value: '+12.2%', change: 'week-over-week', unit: 'percent' },
  conversion_rate: { value: '3.8%', change: '+0.4%', unit: 'percent' },
  avg_pages_per_session: { value: '4.2', change: '+0.3', unit: 'pages' },
  return_visitor_rate: { value: '38.5%', change: '+5.2%', unit: 'percent' },
  organic_traffic: { value: '18,450', change: '+15.3%', unit: 'visits' },
  direct_traffic: { value: '12,340', change: '+8.1%', unit: 'visits' },
  referral_traffic: { value: '8,920', change: '+6.2%', unit: 'visits' },
  social_traffic: { value: '5,520', change: '+22.4%', unit: 'visits' },
  active_campaigns: { value: '3', change: 'campaigns', unit: '' },
  campaign_roi: { value: '245%', change: '+35%', unit: 'percent' },
  campaign_performance: { value: 'Strong', change: 'All campaigns performing above targets', unit: '' },
};

export function ReportPreview({
  selectedMetrics,
  websiteName = 'My Website',
  dateRange = { start: '2026-02-01', end: '2026-02-14' },
}: ReportPreviewProps) {
  const colors = useColors();

  const groupedMetrics = useMemo(() => {
    const groups: Record<string, typeof AVAILABLE_METRICS> = {};
    
    selectedMetrics.forEach((metricId) => {
      const metric = AVAILABLE_METRICS.find((m) => m.id === metricId);
      if (metric) {
        if (!groups[metric.category]) {
          groups[metric.category] = [];
        }
        groups[metric.category].push(metric);
      }
    });

    return groups;
  }, [selectedMetrics]);

  const categoryLabels = {
    overview: 'Overview Metrics',
    performance: 'Performance Metrics',
    sources: 'Traffic Sources',
    campaigns: 'Campaign Metrics',
  };

  if (selectedMetrics.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-muted">
          Select metrics to see a preview of your report
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {/* Report Header */}
      <View
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        className="p-4 rounded-lg border"
      >
        <Text className="text-2xl font-bold text-foreground">{websiteName}</Text>
        <Text className="text-sm text-muted mt-2">
          Report Period: {dateRange.start} to {dateRange.end}
        </Text>
        <Text className="text-sm text-muted mt-1">
          Generated on: {new Date().toLocaleDateString()}
        </Text>
      </View>

      {/* Metrics by Category */}
      {Object.entries(categoryLabels).map(([category, label]) => {
        const metrics = groupedMetrics[category as keyof typeof categoryLabels];
        if (!metrics || metrics.length === 0) return null;

        return (
          <View key={category} className="gap-3">
            <Text className="text-lg font-semibold text-foreground">{label}</Text>

            <View className="gap-2">
              {metrics.map((metric) => {
                const data = MOCK_METRIC_DATA[metric.id];
                return (
                  <View
                    key={metric.id}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    className="p-4 rounded-lg border"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-semibold text-foreground flex-1">
                        {metric.label}
                      </Text>
                      {data?.change && (
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            data.change.startsWith('+')
                              ? 'text-success'
                              : data.change.startsWith('-')
                                ? 'text-error'
                                : 'text-muted'
                          )}
                        >
                          {data.change}
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-2xl font-bold text-foreground">
                        {data?.value}
                      </Text>
                      {data?.unit && (
                        <Text className="text-sm text-muted">{data.unit}</Text>
                      )}
                    </View>

                    <Text className="text-xs text-muted mt-2">{metric.description}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Footer */}
      <View
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        className="p-4 rounded-lg border mt-4"
      >
        <Text className="text-xs text-muted text-center">
          This is a preview of your custom report. The actual exported report will include
          all selected metrics with real data from your website.
        </Text>
      </View>
    </ScrollView>
  );
}
