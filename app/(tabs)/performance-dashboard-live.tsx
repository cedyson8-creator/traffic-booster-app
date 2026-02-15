import { ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';

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

export default function PerformanceDashboardLive() {
  const colors = useColors();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<DegradationAlert[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // WebSocket connection
  const { isConnected, error } = useWebSocket(['performance'], (message: WebSocketMessage) => {
    if (message.type === 'performance') {
      const perfData = message as any;
      if (perfData.metrics && Array.isArray(perfData.metrics)) {
        setMetrics(perfData.metrics);
      }
      if (perfData.alerts && Array.isArray(perfData.alerts)) {
        setAlerts(perfData.alerts);
      }
      setLastUpdate(new Date());
    }
  });

  const handleExport = async (format: 'csv' | 'json' | 'html') => {
    setIsExporting(true);
    try {
      const data = {
        title: 'Performance Dashboard Report',
        type: 'performance',
        generatedAt: new Date().toISOString(),
        metrics,
        alerts,
      };

      let content = '';
      let filename = `performance_report_${Date.now()}`;

      if (format === 'csv') {
        content = 'Endpoint,Avg Response Time (ms),P95 (ms),P99 (ms),Error Rate (%),Trend\n';
        metrics.forEach(m => {
          content += `${m.endpoint},${m.avgResponseTime},${m.p95ResponseTime},${m.p99ResponseTime},${(m.errorRate * 100).toFixed(2)},${m.trend}\n`;
        });
        filename += '.csv';
      } else if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename += '.json';
      } else if (format === 'html') {
        content = `<!DOCTYPE html>
<html>
<head>
  <title>Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Performance Dashboard Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <table>
    <tr><th>Endpoint</th><th>Avg Response Time</th><th>P95</th><th>P99</th><th>Error Rate</th><th>Trend</th></tr>
    ${metrics.map(m => `<tr><td>${m.endpoint}</td><td>${m.avgResponseTime}ms</td><td>${m.p95ResponseTime}ms</td><td>${m.p99ResponseTime}ms</td><td>${(m.errorRate * 100).toFixed(2)}%</td><td>${m.trend}</td></tr>`).join('')}
  </table>
</body>
</html>`;
        filename += '.html';
      }

      Alert.alert('Export Ready', `${filename} ready to download. Format: ${format.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Export Error', 'Could not prepare export. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

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
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-foreground">Performance Dashboard</Text>
              <View
                className="px-2 py-1 rounded"
                style={{
                  backgroundColor: isConnected ? colors.success : colors.error,
                }}
              >
                <Text className="text-xs font-bold text-background">
                  {isConnected ? '🔴 LIVE' : '⚪ OFFLINE'}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-muted">
              {isConnected ? 'Real-time API performance monitoring' : 'Offline mode - last update: ' + (lastUpdate ? lastUpdate.toLocaleTimeString() : 'never')}
            </Text>
            {error && <Text className="text-xs text-error mt-1">{error}</Text>}
          </View>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">⚠️ Active Alerts ({alerts.length})</Text>
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
            <Text className="text-lg font-semibold text-foreground">
              📊 Endpoint Performance ({metrics.length} endpoints)
            </Text>
            {metrics.length === 0 ? (
              <View
                className="p-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-muted text-center">
                  {isConnected ? 'Waiting for metrics...' : 'Offline - no real-time data'}
                </Text>
              </View>
            ) : (
              metrics.map((metric, idx) => (
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
                            {metric.avgResponseTime.toFixed(0)}ms avg • {(metric.errorRate * 100).toFixed(2)}% errors
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
                              {metric.avgResponseTime.toFixed(0)}ms
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
                              {metric.p95ResponseTime.toFixed(0)}ms
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
                              {metric.p99ResponseTime.toFixed(0)}ms
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
              ))
            )}
          </View>

          {/* Summary Stats */}
          {metrics.length > 0 && (
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
          )}

          {/* Export Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📥 Export Report</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleExport('csv')}
                disabled={isExporting}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: isExporting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  CSV
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleExport('json')}
                disabled={isExporting}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: isExporting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  JSON
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleExport('html')}
                disabled={isExporting}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: isExporting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  HTML
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
