import { View, Text, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface SchedulePreviewProps {
  email: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  metrics: string[];
}

const METRIC_DESCRIPTIONS: Record<string, { label: string; value: string }> = {
  totalVisits: { label: 'Total Visits', value: '12,450' },
  uniqueVisitors: { label: 'Unique Visitors', value: '8,320' },
  pageViews: { label: 'Page Views', value: '34,890' },
  avgSessionDuration: { label: 'Avg Session Duration', value: '3m 24s' },
  bounceRate: { label: 'Bounce Rate', value: '42.5%' },
  conversionRate: { label: 'Conversion Rate', value: '3.2%' },
  trafficGrowth: { label: 'Traffic Growth', value: '+12.3%' },
  topPage: { label: 'Top Page', value: '/products' },
  topSource: { label: 'Top Source', value: 'Organic Search' },
  directTraffic: { label: 'Direct Traffic', value: '2,340' },
  socialTraffic: { label: 'Social Traffic', value: '1,890' },
  referralTraffic: { label: 'Referral Traffic', value: '945' },
  activeCampaigns: { label: 'Active Campaigns', value: '3' },
  campaignROI: { label: 'Campaign ROI', value: '245%' },
  emailClicks: { label: 'Email Clicks', value: '567' },
};

export function SchedulePreview({
  email,
  frequency,
  dayOfWeek,
  dayOfMonth,
  metrics,
}: SchedulePreviewProps) {
  const colors = useColors();

  const getFrequencyText = () => {
    if (frequency === 'weekly') {
      return `Every ${dayOfWeek}`;
    } else if (frequency === 'biweekly') {
      return `Every 2 weeks on ${dayOfWeek}`;
    } else {
      return `Monthly on day ${dayOfMonth}`;
    }
  };

  const getNextSendDate = () => {
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (frequency === 'weekly') {
      const targetDay = daysOfWeek.indexOf(dayOfWeek || 'Monday');
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysUntil);
      return nextDate.toLocaleDateString();
    } else if (frequency === 'biweekly') {
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 14);
      return nextDate.toLocaleDateString();
    } else {
      const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth || 1);
      return nextDate.toLocaleDateString();
    }
  };

  return (
    <ScrollView
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginTop: 16,
        padding: 16,
      }}
    >
      <View className="gap-4">
        {/* Preview Header */}
        <View className="gap-2">
          <Text className="text-lg font-bold text-foreground">📊 Report Preview</Text>
          <Text className="text-sm text-muted">This is how your report will look</Text>
        </View>

        {/* Email Info */}
        <View className="bg-background rounded-lg p-3 gap-2">
          <Text className="text-xs font-semibold text-muted uppercase">Delivery Details</Text>
          <Text className="text-sm text-foreground">
            <Text className="font-semibold">To:</Text> {email}
          </Text>
          <Text className="text-sm text-foreground">
            <Text className="font-semibold">Frequency:</Text> {getFrequencyText()}
          </Text>
          <Text className="text-sm text-foreground">
            <Text className="font-semibold">Next Send:</Text> {getNextSendDate()}
          </Text>
        </View>

        {/* Report Header */}
        <View className="bg-primary/10 rounded-lg p-4 gap-2">
          <Text className="text-xl font-bold text-foreground">Traffic Booster Report</Text>
          <Text className="text-sm text-muted">Generated on {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Selected Metrics Preview */}
        {metrics.length > 0 ? (
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Included Metrics ({metrics.length})</Text>
            <View className="gap-2">
              {metrics.slice(0, 6).map((metric) => {
                const metricData = METRIC_DESCRIPTIONS[metric];
                return (
                  <View
                    key={metric}
                    className="flex-row items-center justify-between bg-background rounded-lg p-3"
                  >
                    <Text className="text-sm text-foreground flex-1">{metricData?.label || metric}</Text>
                    <Text className="text-sm font-semibold text-primary">{metricData?.value || 'N/A'}</Text>
                  </View>
                );
              })}
              {metrics.length > 6 && (
                <View className="bg-background rounded-lg p-3">
                  <Text className="text-sm text-muted text-center">
                    +{metrics.length - 6} more metrics
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="bg-warning/10 rounded-lg p-3">
            <Text className="text-sm text-warning text-center">⚠️ No metrics selected</Text>
          </View>
        )}

        {/* Sample Chart */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Traffic Trend</Text>
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 12,
              height: 100,
              justifyContent: 'flex-end',
            }}
          >
            <View className="flex-row items-flex-end gap-1 h-full justify-around">
              {[30, 45, 35, 60, 50, 70, 65].map((height, i) => (
                <View
                  key={i}
                  style={{
                    height: `${(height / 70) * 100}%`,
                    width: '12%',
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                    opacity: 0.8,
                  }}
                />
              ))}
            </View>
          </View>
          <Text className="text-xs text-muted text-center">Last 7 days</Text>
        </View>

        {/* Footer */}
        <View className="bg-background rounded-lg p-3 gap-1">
          <Text className="text-xs text-muted">
            This preview shows sample data. Your actual report will contain real metrics from your integrated platforms.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
