import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

/**
 * Usage Analytics Dashboard Screen
 * Displays API usage trends, error rates, and payment history
 */
export default function UsageAnalyticsScreen() {
  const colors = useColors();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'errors' | 'payments'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock analytics data
  const analyticsData = {
    totalApiCalls: 125430,
    totalWebhooks: 8920,
    successRate: 99.87,
    errorRate: 0.13,
    avgResponseTime: 145,
    peakHour: '14:00',
    activeApiKeys: 12,
    failedWebhooks: 12,
  };

  const trendData = [
    { day: 'Mon', calls: 18500, webhooks: 1200, errors: 5 },
    { day: 'Tue', calls: 19200, webhooks: 1350, errors: 8 },
    { day: 'Wed', calls: 17800, webhooks: 1100, errors: 3 },
    { day: 'Thu', calls: 21300, webhooks: 1500, errors: 12 },
    { day: 'Fri', calls: 22100, webhooks: 1600, errors: 6 },
    { day: 'Sat', calls: 15600, webhooks: 900, errors: 2 },
    { day: 'Sun', calls: 10900, webhooks: 770, errors: 1 },
  ];

  const errorData = [
    { code: '500', description: 'Internal Server Error', count: 8, percentage: 42 },
    { code: '429', description: 'Rate Limited', count: 5, percentage: 26 },
    { code: '401', description: 'Unauthorized', count: 4, percentage: 21 },
    { code: '400', description: 'Bad Request', count: 2, percentage: 11 },
  ];

  const paymentData = [
    { date: '2026-02-10', amount: 99.00, status: 'completed', type: 'subscription' },
    { date: '2026-02-09', amount: 49.99, status: 'completed', type: 'overage' },
    { date: '2026-02-08', amount: 99.00, status: 'completed', type: 'subscription' },
    { date: '2026-02-07', amount: 0.00, status: 'refunded', type: 'refund' },
    { date: '2026-02-06', amount: 99.00, status: 'completed', type: 'subscription' },
  ];

  const OverviewTab = () => (
    <View className="gap-4">
      <View className="grid grid-cols-2 gap-3">
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Total API Calls</Text>
          <Text className="text-2xl font-bold text-foreground">
            {(analyticsData.totalApiCalls / 1000).toFixed(1)}K
          </Text>
          <Text className="text-xs text-success mt-1">+12.5% vs last month</Text>
        </View>

        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Total Webhooks</Text>
          <Text className="text-2xl font-bold text-foreground">
            {(analyticsData.totalWebhooks / 1000).toFixed(1)}K
          </Text>
          <Text className="text-xs text-success mt-1">+8.3% vs last month</Text>
        </View>

        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Success Rate</Text>
          <Text className="text-2xl font-bold text-success">
            {analyticsData.successRate}%
          </Text>
          <Text className="text-xs text-muted mt-1">Excellent</Text>
        </View>

        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Avg Response Time</Text>
          <Text className="text-2xl font-bold text-foreground">
            {analyticsData.avgResponseTime}ms
          </Text>
          <Text className="text-xs text-success mt-1">Fast</Text>
        </View>
      </View>

      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-sm font-semibold text-foreground mb-3">Key Metrics</Text>
        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Peak Hour</Text>
            <Text className="text-sm font-semibold text-foreground">
              {analyticsData.peakHour}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Active API Keys</Text>
            <Text className="text-sm font-semibold text-foreground">
              {analyticsData.activeApiKeys}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Failed Webhooks</Text>
            <Text className="text-sm font-semibold text-error">
              {analyticsData.failedWebhooks}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const TrendsTab = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-sm font-semibold text-foreground mb-3">API Calls Trend</Text>
        <View className="gap-2">
          {trendData.map((data, index) => {
            const maxCalls = Math.max(...trendData.map((d) => d.calls));
            const percentage = (data.calls / maxCalls) * 100;
            return (
              <View key={index}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-muted">{data.day}</Text>
                  <Text className="text-xs font-semibold text-foreground">
                    {(data.calls / 1000).toFixed(1)}K
                  </Text>
                </View>
                <View
                  className="h-2 rounded-full"
                  style={{ backgroundColor: colors.border }}
                >
                  <View
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: colors.primary,
                      width: `${percentage}%`,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-sm font-semibold text-foreground mb-3">Webhook Deliveries</Text>
        <View className="gap-2">
          {trendData.map((data, index) => {
            const maxWebhooks = Math.max(...trendData.map((d) => d.webhooks));
            const percentage = (data.webhooks / maxWebhooks) * 100;
            return (
              <View key={index}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-muted">{data.day}</Text>
                  <Text className="text-xs font-semibold text-foreground">
                    {data.webhooks}
                  </Text>
                </View>
                <View
                  className="h-2 rounded-full"
                  style={{ backgroundColor: colors.border }}
                >
                  <View
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: colors.success,
                      width: `${percentage}%`,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const ErrorsTab = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-sm font-semibold text-foreground mb-3">Error Distribution</Text>
        <View className="gap-3">
          {errorData.map((error, index) => (
            <View key={index}>
              <View className="flex-row justify-between items-center mb-1">
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {error.code} - {error.description}
                  </Text>
                  <Text className="text-xs text-muted">{error.count} errors</Text>
                </View>
                <Text className="text-sm font-bold text-error">{error.percentage}%</Text>
              </View>
              <View
                className="h-3 rounded-full"
                style={{ backgroundColor: colors.border }}
              >
                <View
                  className="h-3 rounded-full"
                  style={{
                    backgroundColor: colors.error,
                    width: `${error.percentage}%`,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-sm font-semibold text-foreground mb-3">Error Timeline</Text>
        <View className="gap-2">
          {trendData.map((data, index) => (
            <View key={index} className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">{data.day}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {data.errors}
                </Text>
                {data.errors > 0 && (
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.error }}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const PaymentsTab = () => (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-foreground mb-2">Recent Payments</Text>

      {paymentData.map((payment, index) => (
        <View key={index} className="bg-surface rounded-lg p-4 border border-border">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                {payment.type === 'subscription' && 'Monthly Subscription'}
                {payment.type === 'overage' && 'Overage Charges'}
                {payment.type === 'refund' && 'Refund'}
              </Text>
              <Text className="text-xs text-muted mt-1">{payment.date}</Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor:
                  payment.status === 'completed'
                    ? colors.success
                    : payment.status === 'refunded'
                      ? colors.warning
                      : colors.border,
              }}
            >
              <Text className="text-xs font-semibold text-white capitalize">
                {payment.status}
              </Text>
            </View>
          </View>

          <View className="border-t border-border pt-2 mt-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Amount</Text>
              <Text
                className="text-base font-bold"
                style={{
                  color:
                    payment.type === 'refund'
                      ? colors.error
                      : colors.foreground,
                }}
              >
                {payment.type === 'refund' ? '-' : '+'}$
                {payment.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">Usage Analytics</Text>

            {/* Date Range Selector */}
            <View className="flex-row gap-2 mb-4">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Pressable
                  key={range}
                  onPress={() => setDateRange(range)}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                      backgroundColor:
                        dateRange === range ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      dateRange === range
                        ? 'text-white'
                        : 'text-foreground'
                    }`}
                  >
                    {range === '7d' && 'Last 7 Days'}
                    {range === '30d' && 'Last 30 Days'}
                    {range === '90d' && 'Last 90 Days'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tab Navigation */}
            <View className="flex-row gap-2 mb-4">
              {(['overview', 'trends', 'errors', 'payments'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: 8,
                      backgroundColor:
                        selectedTab === tab ? colors.primary : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    className={`text-center font-semibold text-xs ${
                      selectedTab === tab ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'trends' && 'Trends'}
                    {tab === 'errors' && 'Errors'}
                    {tab === 'payments' && 'Payments'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tab Content */}
            {selectedTab === 'overview' && <OverviewTab />}
            {selectedTab === 'trends' && <TrendsTab />}
            {selectedTab === 'errors' && <ErrorsTab />}
            {selectedTab === 'payments' && <PaymentsTab />}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
