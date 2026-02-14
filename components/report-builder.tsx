import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';

export interface ReportMetric {
  id: string;
  label: string;
  description: string;
  category: 'overview' | 'performance' | 'sources' | 'campaigns';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  metrics: string[];
}

export const AVAILABLE_METRICS: ReportMetric[] = [
  // Overview metrics
  { id: 'total_visits', label: 'Total Visits', description: 'Total number of website visits', category: 'overview' },
  { id: 'unique_visitors', label: 'Unique Visitors', description: 'Number of unique visitors', category: 'overview' },
  { id: 'avg_session_duration', label: 'Avg Session Duration', description: 'Average session duration in minutes', category: 'overview' },
  { id: 'bounce_rate', label: 'Bounce Rate', description: 'Percentage of sessions that bounced', category: 'overview' },
  
  // Performance metrics
  { id: 'growth_rate', label: 'Growth Rate', description: 'Week-over-week growth percentage', category: 'performance' },
  { id: 'conversion_rate', label: 'Conversion Rate', description: 'Percentage of visitors who converted', category: 'performance' },
  { id: 'avg_pages_per_session', label: 'Pages Per Session', description: 'Average pages viewed per session', category: 'performance' },
  { id: 'return_visitor_rate', label: 'Return Visitor Rate', description: 'Percentage of returning visitors', category: 'performance' },
  
  // Traffic sources
  { id: 'organic_traffic', label: 'Organic Traffic', description: 'Traffic from search engines', category: 'sources' },
  { id: 'direct_traffic', label: 'Direct Traffic', description: 'Direct visits to website', category: 'sources' },
  { id: 'referral_traffic', label: 'Referral Traffic', description: 'Traffic from other websites', category: 'sources' },
  { id: 'social_traffic', label: 'Social Traffic', description: 'Traffic from social media', category: 'sources' },
  
  // Campaign metrics
  { id: 'active_campaigns', label: 'Active Campaigns', description: 'Number of active campaigns', category: 'campaigns' },
  { id: 'campaign_roi', label: 'Campaign ROI', description: 'Return on investment for campaigns', category: 'campaigns' },
  { id: 'campaign_performance', label: 'Campaign Performance', description: 'Individual campaign metrics', category: 'campaigns' },
];

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'High-level overview for stakeholders',
    metrics: ['total_visits', 'growth_rate', 'conversion_rate', 'active_campaigns', 'campaign_roi'],
  },
  {
    id: 'detailed_analysis',
    name: 'Detailed Analysis',
    description: 'Comprehensive traffic and performance analysis',
    metrics: [
      'total_visits', 'unique_visitors', 'growth_rate', 'bounce_rate',
      'organic_traffic', 'direct_traffic', 'referral_traffic', 'social_traffic',
      'conversion_rate', 'avg_session_duration',
    ],
  },
  {
    id: 'campaign_performance',
    name: 'Campaign Performance',
    description: 'Focus on campaign metrics and ROI',
    metrics: ['active_campaigns', 'campaign_roi', 'campaign_performance', 'conversion_rate', 'growth_rate'],
  },
  {
    id: 'traffic_sources',
    name: 'Traffic Sources',
    description: 'Detailed breakdown of traffic sources',
    metrics: ['organic_traffic', 'direct_traffic', 'referral_traffic', 'social_traffic', 'total_visits'],
  },
];

interface ReportBuilderProps {
  onMetricsSelected?: (metrics: string[]) => void;
  onTemplateSelected?: (template: ReportTemplate) => void;
  defaultMetrics?: string[];
}

export function ReportBuilder({
  onMetricsSelected,
  onTemplateSelected,
  defaultMetrics = [],
}: ReportBuilderProps) {
  const colors = useColors();
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(defaultMetrics)
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleMetricToggle = (metricId: string) => {
    const newMetrics = new Set(selectedMetrics);
    if (newMetrics.has(metricId)) {
      newMetrics.delete(metricId);
    } else {
      newMetrics.add(metricId);
    }
    setSelectedMetrics(newMetrics);
    onMetricsSelected?.(Array.from(newMetrics));
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template.id);
    setSelectedMetrics(new Set(template.metrics));
    onTemplateSelected?.(template);
    onMetricsSelected?.(template.metrics);
  };

  const groupedMetrics = useMemo(() => {
    return AVAILABLE_METRICS.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, ReportMetric[]>);
  }, []);

  const categoryLabels = {
    overview: 'Overview Metrics',
    performance: 'Performance Metrics',
    sources: 'Traffic Sources',
    campaigns: 'Campaign Metrics',
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-4 gap-6">
        {/* Template Presets */}
        <View className="gap-3">
          <Text className="text-lg font-semibold text-foreground">Report Templates</Text>
          <Text className="text-sm text-muted">Quick-select common report types</Text>
          
          <View className="gap-2">
            {REPORT_TEMPLATES.map((template) => (
              <Pressable
                key={template.id}
                onPress={() => handleTemplateSelect(template)}
                style={({ pressed }) => [
                  {
                    backgroundColor: selectedTemplate === template.id ? colors.primary : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="p-4 rounded-lg border border-border"
              >
                <Text
                  className={cn(
                    'font-semibold',
                    selectedTemplate === template.id ? 'text-background' : 'text-foreground'
                  )}
                >
                  {template.name}
                </Text>
                <Text
                  className={cn(
                    'text-sm mt-1',
                    selectedTemplate === template.id ? 'text-background opacity-90' : 'text-muted'
                  )}
                >
                  {template.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Metric Selection */}
        <View className="gap-3">
          <Text className="text-lg font-semibold text-foreground">Custom Metrics</Text>
          <Text className="text-sm text-muted">Select metrics to include in your report</Text>

          {Object.entries(categoryLabels).map(([category, label]) => (
            <View key={category} className="gap-2">
              <Text className="text-sm font-semibold text-foreground mt-2">{label}</Text>
              
              {groupedMetrics[category as keyof typeof categoryLabels]?.map((metric) => (
                <View
                  key={metric.id}
                  className="flex-row items-center justify-between p-3 bg-surface rounded-lg border border-border"
                >
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">{metric.label}</Text>
                    <Text className="text-xs text-muted mt-1">{metric.description}</Text>
                  </View>
                  <Switch
                    value={selectedMetrics.has(metric.id)}
                    onValueChange={() => handleMetricToggle(metric.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Selected Metrics Summary */}
        <View className="gap-2 p-3 bg-surface rounded-lg border border-border">
          <Text className="font-semibold text-foreground">
            Selected Metrics: {selectedMetrics.size}
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {Array.from(selectedMetrics).map((metricId) => {
              const metric = AVAILABLE_METRICS.find((m) => m.id === metricId);
              return metric ? (
                <View
                  key={metricId}
                  className="bg-primary rounded-full px-3 py-1"
                >
                  <Text className="text-xs font-medium text-background">{metric.label}</Text>
                </View>
              ) : null;
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
