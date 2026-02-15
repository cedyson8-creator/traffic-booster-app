import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect } from 'react';

interface PerformanceMetric {
  endpoint: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface DegradationAlert {
  endpoint: string;
  metric: string;
  degradationPercent: number;
  severity: 'low' | 'medium' | 'high';
}

export default function PerformanceDashboard() {
  const colors = useColors();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      endpoint: '/api/users',
      avgResponseTime: 145,
      p95ResponseTime: 250,
      p99ResponseTime: 350,
      errorRate: 0.02,
      trend: 'stable',
    },
    {
      endpoint: '/api/posts',
      avgResponseTime: 210,
      p95ResponseTime: 380,
      p99ResponseTime: 500,
      errorRate: 0.05,
      trend: 'up',
    },
    {
      endpoint: '/api/comments',
      avgResponseTime: 95,
      p95ResponseTime: 150,
      p99ResponseTime: 200,
      errorRate: 0.01,
      trend: 'down',
    },
  ]);

  const [alerts, setAlerts] = useState<DegradationAlert[]>([
    {
      endpoint: '/api/posts',
      metric: 'responseTime',
      degradationPercent: 35,
      severity: 'high',
    },
  ]);

  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Performance Dashboard</Text>
            <Text className="text-sm text-muted">Monitor API performance and detect degradation</Text>
          </View>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">⚠️ Active Alerts</Text>
              {alerts.map((alert, idx) => (
                <View
                  key={idx}
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: getSeverityColor(alert.severity),
                    backgroundColor: colors.surface,
                  }}
                >
                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold text-foreground">{alert.endpoint}</Text>
                      <Text
                        className="text-sm font-bold px-3 py-1 rounded"
                        style={{
                          color: colors.background,
                          backgroundColor: getSeverityColor(alert.severity),
                        }}
                      >
                        {alert.severity.toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-sm text-muted">
                      {alert.metric}: {alert.degradationPercent.toFixed(1)}% degradation
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Metrics Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📊 Endpoint Performance</Text>
            {metrics.map((metric, idx) => (
              <Pressable
                key={idx}
                onPress={() => setSelectedEndpoint(selectedEndpoint === metric.endpoint ? null : metric.endpoint)}
              >
                <View
                  className="p-4 rounded-lg border border-border"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="gap-3">
                    {/* Header */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{metric.endpoint}</Text>
                        <Text className="text-xs text-muted mt-1">
                          {metric.avgResponseTime}ms avg • {(metric.errorRate * 100).toFixed(2)}% errors
                        </Text>
                      </View>
                      <Text className="text-2xl">{getTrendIcon(metric.trend)}</Text>
                    </View>

                    {/* Performance Bars */}
                    <View className="gap-2">
                      <View className="gap-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-muted">P50</Text>
                          <Text className="text-xs font-semibold text-foreground">
                            {metric.avgResponseTime}ms
                          </Text>
                        </View>
                        <View
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: colors.border,
                            width: `${Math.min((metric.avgResponseTime / 500) * 100, 100)}%`,
                          }}
                        />
                      </View>

                      <View className="gap-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-muted">P95</Text>
                          <Text className="text-xs font-semibold text-foreground">
                            {metric.p95ResponseTime}ms
                          </Text>
                        </View>
                        <View
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: colors.warning,
                            width: `${Math.min((metric.p95ResponseTime / 500) * 100, 100)}%`,
                          }}
                        />
                      </View>

                      <View className="gap-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-muted">P99</Text>
                          <Text className="text-xs font-semibold text-foreground">
                            {metric.p99ResponseTime}ms
                          </Text>
                        </View>
                        <View
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: colors.error,
                            width: `${Math.min((metric.p99ResponseTime / 500) * 100, 100)}%`,
                          }}
                        />
                      </View>
                    </View>

                    {/* Expanded Details */}
                    {selectedEndpoint === metric.endpoint && (
                      <View className="pt-3 border-t border-border gap-2">
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-muted">Error Rate</Text>
                          <Text className="text-xs font-semibold text-foreground">
                            {(metric.errorRate * 100).toFixed(2)}%
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-muted">Trend</Text>
                          <Text className="text-xs font-semibold text-foreground capitalize">
                            {metric.trend}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Summary Stats */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📈 Summary</Text>
            <View className="flex-row gap-3">
              <View
                className="flex-1 p-4 rounded-lg"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-xs text-muted mb-1">Avg Response Time</Text>
                <Text className="text-xl font-bold text-foreground">
                  {Math.round(metrics.reduce((a, b) => a + b.avgResponseTime, 0) / metrics.length)}ms
                </Text>
              </View>
              <View
                className="flex-1 p-4 rounded-lg"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-xs text-muted mb-1">Error Rate</Text>
                <Text className="text-xl font-bold text-foreground">
                  {(
                    (metrics.reduce((a, b) => a + b.errorRate, 0) / metrics.length) *
                    100
                  ).toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
