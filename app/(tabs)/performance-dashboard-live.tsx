import { ScrollView, Text, View, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

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
  const [refreshing, setRefreshing] = useState(false);

  // WebSocket connection
  const { isConnected, error, subscribe } = useWebSocket(['performance'], (message: WebSocketMessage) => {
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force re-subscribe to get fresh data
      if (subscribe) {
        subscribe(['performance']);
      }
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    handleRefresh();
  };

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
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View className="p-4 gap-6">
          {/* Header */}
          <Animated.View entering={FadeIn} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-foreground">Performance</Text>
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
              {isConnected ? 'Real-time API monitoring' : 'Offline - last update: ' + (lastUpdate ? lastUpdate.toLocaleTimeString() : 'never')}
            </Text>
            {error && <Text className="text-xs text-error mt-1">{error}</Text>}
          </Animated.View>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={handleManualRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg items-center"
            style={{
              backgroundColor: colors.primary,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <Text className="text-background font-semibold">
              {refreshing ? '⟳ Refreshing...' : '⟳ Manual Refresh'}
            </Text>
          </TouchableOpacity>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Animated.View entering={SlideInRight} className="gap-3">
              <Text className="text-lg font-semibold text-foreground">⚠️ Active Alerts ({alerts.length})</Text>
              {alerts.map((alert, idx) => (
                <Animated.View
                  key={idx}
                  entering={FadeIn.delay(idx * 100)}
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
                </Animated.View>
              ))}
            </Animated.View>
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
                <Animated.View
                  key={idx}
                  entering={FadeIn.delay(idx * 50)}
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <TouchableOpacity onPress={() => setSelectedEndpoint(selectedEndpoint === metric.endpoint ? null : metric.endpoint)}>
                    <View className="gap-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">{metric.endpoint}</Text>
                          <Text className="text-xs text-muted mt-1">{getTrendIcon(metric.trend)} {metric.trend}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-lg font-bold text-primary">{metric.avgResponseTime}ms</Text>
                          <Text className="text-xs text-muted">avg response</Text>
                        </View>
                      </View>

                      {selectedEndpoint === metric.endpoint && (
                        <Animated.View entering={FadeIn} className="gap-2 pt-3 border-t" style={{ borderTopColor: colors.border }}>
                          <View className="flex-row justify-between">
                            <View>
                              <Text className="text-xs text-muted">P95</Text>
                              <Text className="font-semibold text-foreground">{metric.p95ResponseTime}ms</Text>
                            </View>
                            <View>
                              <Text className="text-xs text-muted">P99</Text>
                              <Text className="font-semibold text-foreground">{metric.p99ResponseTime}ms</Text>
                            </View>
                            <View>
                              <Text className="text-xs text-muted">Error Rate</Text>
                              <Text className="font-semibold text-foreground">{(metric.errorRate * 100).toFixed(2)}%</Text>
                            </View>
                          </View>
                        </Animated.View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </View>

          {/* Export Section */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Export Report</Text>
            <View className="flex-row gap-2">
              {(['csv', 'json', 'html'] as const).map(format => (
                <TouchableOpacity
                  key={format}
                  onPress={() => handleExport(format)}
                  disabled={isExporting || metrics.length === 0}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{
                    backgroundColor: colors.primary,
                    opacity: isExporting || metrics.length === 0 ? 0.5 : 1,
                  }}
                >
                  <Text className="text-background font-semibold text-sm">{format.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
