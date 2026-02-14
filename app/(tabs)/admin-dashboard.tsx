import { ScrollView, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect } from 'react';

/**
 * Admin Dashboard Screen
 * Real-time monitoring of errors, webhooks, and API usage
 */

interface DashboardMetrics {
  errorRate: number;
  totalErrors: number;
  webhookSuccessRate: number;
  totalWebhooks: number;
  apiKeysActive: number;
  rateLimitHits: number;
}

export default function AdminDashboardScreen() {
  const colors = useColors();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    errorRate: 2.5,
    totalErrors: 45,
    webhookSuccessRate: 98.7,
    totalWebhooks: 12,
    apiKeysActive: 8,
    rateLimitHits: 3,
  });
  const [selectedTab, setSelectedTab] = useState<'overview' | 'errors' | 'webhooks' | 'alerts'>('overview');

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.5),
        totalErrors: prev.totalErrors + Math.floor(Math.random() * 3),
        webhookSuccessRate: Math.min(100, Math.max(90, prev.webhookSuccessRate + (Math.random() - 0.5) * 2)),
        rateLimitHits: prev.rateLimitHits + Math.floor(Math.random() * 2),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) => (
    <View className="flex-1 bg-surface rounded-lg p-4 m-2 border border-border">
      <Text className="text-muted text-sm mb-2">{label}</Text>
      <Text className="text-2xl font-bold" style={{ color }}>
        {value.toFixed(1)}
      </Text>
      <Text className="text-muted text-xs mt-1">{unit}</Text>
    </View>
  );

  const TabButton = ({ tab, label }: { tab: typeof selectedTab; label: string }) => (
    <TouchableOpacity
      onPress={() => setSelectedTab(tab)}
      className={`flex-1 py-3 px-4 rounded-lg mx-1 ${
        selectedTab === tab ? 'bg-primary' : 'bg-surface border border-border'
      }`}
    >
      <Text
        className={`text-center font-semibold ${selectedTab === tab ? 'text-background' : 'text-foreground'}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Admin Dashboard</Text>
            <Text className="text-muted">Real-time monitoring and analytics</Text>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-1 mb-4">
            <TabButton tab="overview" label="Overview" />
            <TabButton tab="errors" label="Errors" />
            <TabButton tab="webhooks" label="Webhooks" />
            <TabButton tab="alerts" label="Alerts" />
          </View>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <View className="gap-4">
              {/* Key Metrics */}
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">Key Metrics</Text>

                <View className="flex-row flex-wrap">
                  <MetricCard
                    label="Error Rate"
                    value={metrics.errorRate}
                    unit="%"
                    color={metrics.errorRate > 5 ? colors.error : colors.success}
                  />
                  <MetricCard
                    label="Total Errors"
                    value={metrics.totalErrors}
                    unit="errors"
                    color={colors.warning}
                  />
                </View>

                <View className="flex-row flex-wrap">
                  <MetricCard
                    label="Webhook Success"
                    value={metrics.webhookSuccessRate}
                    unit="%"
                    color={metrics.webhookSuccessRate > 95 ? colors.success : colors.warning}
                  />
                  <MetricCard
                    label="Active Webhooks"
                    value={metrics.totalWebhooks}
                    unit="webhooks"
                    color={colors.primary}
                  />
                </View>
              </View>

              {/* System Health */}
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">System Health</Text>

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">API Keys Active</Text>
                    <Text className="font-semibold text-primary">{metrics.apiKeysActive}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">Rate Limit Hits (24h)</Text>
                    <Text className={`font-semibold ${metrics.rateLimitHits > 5 ? 'text-error' : 'text-success'}`}>
                      {metrics.rateLimitHits}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">Database Status</Text>
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-success" />
                      <Text className="text-success font-semibold">Connected</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">Cache Status</Text>
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-success" />
                      <Text className="text-success font-semibold">Active</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Errors Tab */}
          {selectedTab === 'errors' && (
            <View className="gap-4">
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">Recent Errors</Text>

                <View className="gap-3">
                  <View className="border-l-4 border-error pl-3 py-2">
                    <Text className="font-semibold text-foreground">Database Connection Failed</Text>
                    <Text className="text-muted text-sm">5 minutes ago</Text>
                  </View>

                  <View className="border-l-4 border-warning pl-3 py-2">
                    <Text className="font-semibold text-foreground">High Memory Usage</Text>
                    <Text className="text-muted text-sm">15 minutes ago</Text>
                  </View>

                  <View className="border-l-4 border-success pl-3 py-2">
                    <Text className="font-semibold text-foreground">API Response Time Degraded</Text>
                    <Text className="text-muted text-sm">1 hour ago</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity className="bg-primary rounded-lg p-4">
                <Text className="text-background font-semibold text-center">View All Errors</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Webhooks Tab */}
          {selectedTab === 'webhooks' && (
            <View className="gap-4">
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">Webhook Status</Text>

                <View className="gap-3">
                  <View className="flex-row items-center justify-between pb-3 border-b border-border">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">https://api.example.com/webhook</Text>
                      <Text className="text-muted text-sm">Success Rate: 99.2%</Text>
                    </View>
                    <View className="w-3 h-3 rounded-full bg-success" />
                  </View>

                  <View className="flex-row items-center justify-between pb-3 border-b border-border">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">https://alerts.example.com/events</Text>
                      <Text className="text-muted text-sm">Success Rate: 97.5%</Text>
                    </View>
                    <View className="w-3 h-3 rounded-full bg-success" />
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">https://backup.example.com/sync</Text>
                      <Text className="text-muted text-sm">Success Rate: 95.1%</Text>
                    </View>
                    <View className="w-3 h-3 rounded-full bg-warning" />
                  </View>
                </View>
              </View>

              <TouchableOpacity className="bg-primary rounded-lg p-4">
                <Text className="text-background font-semibold text-center">Manage Webhooks</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Alerts Tab */}
          {selectedTab === 'alerts' && (
            <View className="gap-4">
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">Alert Subscriptions</Text>

                <View className="gap-3">
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-foreground">Error Rate Threshold</Text>
                    <Text className="text-primary font-semibold">5%</Text>
                  </View>

                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-foreground">Webhook Failures</Text>
                    <Text className="text-primary font-semibold">3 attempts</Text>
                  </View>

                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-foreground">Rate Limit Exceeded</Text>
                    <Text className="text-primary font-semibold">Enabled</Text>
                  </View>

                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-foreground">API Key Rotated</Text>
                    <Text className="text-primary font-semibold">Enabled</Text>
                  </View>
                </View>
              </View>

              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-4">Alert Recipients</Text>

                <View className="gap-2">
                  <Text className="text-foreground">admin@example.com</Text>
                  <Text className="text-foreground">ops@example.com</Text>
                </View>
              </View>

              <TouchableOpacity className="bg-primary rounded-lg p-4">
                <Text className="text-background font-semibold text-center">Configure Alerts</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View className="py-4 border-t border-border mt-4">
            <Text className="text-muted text-xs text-center">Last updated: {new Date().toLocaleTimeString()}</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
