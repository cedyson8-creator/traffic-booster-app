import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Dimensions } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { AlertsNotification } from '@/components/alerts-notification';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { useWebsites } from '@/lib/websites-context';

interface DeliverySummary {
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  successRate: number;
  failureRate: number;
  bounceRate: number;
}

interface ScheduleStats {
  scheduleId: number;
  email: string;
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  successRate: number;
}

interface TimelineEntry {
  date: string;
  sent: number;
  failed: number;
  bounced: number;
  total: number;
}

interface FailureLog {
  id: number;
  email: string;
  scheduleId: number;
  errorMessage: string;
  sentAt: string;
}

type DeliveryStatus = 'all' | 'sent' | 'failed' | 'bounced';

export default function DeliveryAnalyticsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { websites } = useWebsites();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [scheduleStats, setScheduleStats] = useState<ScheduleStats[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [failures, setFailures] = useState<FailureLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus>('all');
  const [showAlerts, setShowAlerts] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics();
    }
  }, [user?.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryRes = await fetch(`/api/delivery-analytics/summary?userId=${user?.id}`);
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }

      // Fetch schedule stats
      const scheduleRes = await fetch(`/api/delivery-analytics/by-schedule?userId=${user?.id}`);
      if (scheduleRes.ok) {
        setScheduleStats(await scheduleRes.json());
      }

      // Fetch timeline
      const timelineRes = await fetch(`/api/delivery-analytics/timeline?userId=${user?.id}`);
      if (timelineRes.ok) {
        setTimeline(await timelineRes.json());
      }

      // Fetch recent failures
      const failuresRes = await fetch(`/api/delivery-analytics/recent-failures?userId=${user?.id}&limit=5`);
      if (failuresRes.ok) {
        setFailures(await failuresRes.json());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      Alert.alert('Error', 'Failed to load delivery analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">Loading analytics...</Text>
      </ScreenContainer>
    );
  }

  // Prepare timeline chart data
  const timelineChartData = timeline.map((entry) => ({
    value: entry.sent,
    label: new Date(entry.date).getDate().toString(),
    labelWidth: 30,
    labelTextStyle: { color: colors.muted, fontSize: 12 },
  }));

  // Prepare schedule stats chart data
  const scheduleChartData = scheduleStats.slice(0, 5).map((stat, index) => ({
    value: stat.successRate,
    label: `Schedule ${index + 1}`,
    labelWidth: 50,
    labelTextStyle: { color: colors.muted, fontSize: 10 },
  }));

  // Handle resend failed email
  const handleResend = async (logId: number) => {
    setResendingId(logId);
    try {
      const response = await fetch(`/api/delivery-analytics/resend/${logId}?userId=${user?.id}`, {
        method: 'POST',
      });
      if (response.ok) {
        // Remove from failures list
        setFailures(failures.filter(f => f.id !== logId));
      }
    } catch (error) {
      console.error('Error resending email:', error);
    } finally {
      setResendingId(null);
    }
  };

  // Filter failures based on status
  const filteredFailures = statusFilter === 'all' 
    ? failures 
    : failures.filter(f => {
        if (statusFilter === 'failed') return true;
        if (statusFilter === 'bounced') return f.errorMessage?.includes('bounce');
        return false;
      });

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">Delivery Analytics</Text>
              <Text className="text-base text-muted mt-1">Email delivery performance</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAlerts(true)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: colors.primary,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Filters */}
        <View className="flex-row gap-2 mb-6">
          {(['all', 'sent', 'failed', 'bounced'] as DeliveryStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: statusFilter === status ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: statusFilter === status ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  color: statusFilter === status ? colors.background : colors.foreground,
                  fontSize: 12,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Stats */}
        {summary && (
          <View className="gap-3 mb-6">
            {/* Success Rate Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm text-muted font-medium">Success Rate</Text>
                  <Text className="text-3xl font-bold text-foreground mt-2">{summary.successRate}%</Text>
                  <Text className="text-xs text-muted mt-1">{summary.sent} of {summary.total} sent</Text>
                </View>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-2xl font-bold text-primary">✓</Text>
                </View>
              </View>
            </View>

            {/* Failure & Bounce Stats */}
            <View className="flex-row gap-3">
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-xs text-muted font-medium">Failed</Text>
                <Text className="text-2xl font-bold text-error mt-2">{summary.failed}</Text>
                <Text className="text-xs text-muted mt-1">{summary.failureRate}% rate</Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-xs text-muted font-medium">Bounced</Text>
                <Text className="text-2xl font-bold text-warning mt-2">{summary.bounced}</Text>
                <Text className="text-xs text-muted mt-1">{summary.bounceRate}% rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Timeline Chart */}
        {timeline.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="text-base font-semibold text-foreground mb-4">Delivery Timeline (30 Days)</Text>
            <LineChart
              data={timelineChartData}
              width={screenWidth - 80}
              height={200}
              color={colors.primary}
              thickness={2}
              hideDataPoints={false}
              dataPointsColor={colors.primary}
              startFillColor={colors.primary}
              endFillColor={colors.primary}
              startOpacity={0.3}
              endOpacity={0}
              xAxisColor={colors.border}
              yAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.muted, fontSize: 12 }}
            />
          </View>
        )}

        {/* Schedule Performance */}
        {scheduleStats.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="text-base font-semibold text-foreground mb-4">Schedule Performance</Text>
            <View className="gap-3">
              {scheduleStats.map((stat, index) => (
                <View
                  key={stat.scheduleId}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-foreground flex-1" numberOfLines={1}>
                      {stat.email}
                    </Text>
                    <Text className="text-sm font-bold text-primary">{stat.successRate}%</Text>
                  </View>
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View
                      style={{
                        height: '100%',
                        width: `${stat.successRate}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 1,
                      }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-muted">✓ {stat.sent}</Text>
                    <Text className="text-xs text-muted">✗ {stat.failed}</Text>
                    <Text className="text-xs text-muted">⚠ {stat.bounced}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Failures */}
        {filteredFailures.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="text-base font-semibold text-foreground mb-4">Recent Failures</Text>
            <View className="gap-2">
              {failures.map((failure) => (
                <View
                  key={failure.id}
                  style={{
                    backgroundColor: colors.error + '10',
                    borderRadius: 8,
                    padding: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.error,
                  }}
                >
                  <View className="flex-row items-start justify-between mb-1">
                    <Text className="text-sm font-medium text-foreground flex-1" numberOfLines={1}>
                      {failure.email}
                    </Text>
                    <Text className="text-xs text-muted">
                      {new Date(failure.sentAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="text-xs text-error mt-1">{failure.errorMessage}</Text>
                  <TouchableOpacity
                    onPress={() => handleResend(failure.id)}
                    disabled={resendingId === failure.id}
                    style={{
                      marginTop: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                      opacity: resendingId === failure.id ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: colors.background, fontSize: 11, fontWeight: '600' }}>
                      {resendingId === failure.id ? 'Resending...' : 'Resend'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!summary || summary.total === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="text-4xl mb-4">📊</Text>
            <Text className="text-base font-semibold text-foreground mb-2">No Delivery Data Yet</Text>
            <Text className="text-sm text-muted text-center">
              Create and run scheduled reports to see delivery analytics here.
            </Text>
          </View>
        ) : null}

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={fetchAnalytics}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: 12,
            marginTop: 24,
          }}
        >
          <Text className="text-center font-semibold text-background">🔄 Refresh Analytics</Text>
        </TouchableOpacity>
      </ScrollView>
      <AlertsNotification visible={showAlerts} onClose={() => setShowAlerts(false)} />
    </ScreenContainer>
  );
}
