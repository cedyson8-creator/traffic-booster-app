import { Modal, View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { DateRangePicker } from './date-range-picker';
import { SchedulePreview } from './schedule-preview';

interface CreateScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduleCreated?: () => void;
  userId: string;
  websiteId: string;
  websiteName: string;
  preselectedMetrics?: string[];
}

const FREQUENCIES = ['weekly', 'biweekly', 'monthly'] as const;
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function CreateScheduleModal({
  visible,
  onClose,
  onScheduleCreated,
  userId,
  websiteId,
  websiteName,
  preselectedMetrics = [],
}: CreateScheduleModalProps) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(preselectedMetrics);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const AVAILABLE_METRICS = [
    { id: 'totalVisits', label: 'Total Visits', category: 'Overview' },
    { id: 'uniqueVisitors', label: 'Unique Visitors', category: 'Overview' },
    { id: 'pageViews', label: 'Page Views', category: 'Overview' },
    { id: 'avgSessionDuration', label: 'Avg Session Duration', category: 'Performance' },
    { id: 'bounceRate', label: 'Bounce Rate', category: 'Performance' },
    { id: 'conversionRate', label: 'Conversion Rate', category: 'Performance' },
    { id: 'trafficGrowth', label: 'Traffic Growth', category: 'Performance' },
    { id: 'topPage', label: 'Top Page', category: 'Sources' },
    { id: 'topSource', label: 'Top Source', category: 'Sources' },
    { id: 'directTraffic', label: 'Direct Traffic', category: 'Sources' },
    { id: 'socialTraffic', label: 'Social Traffic', category: 'Sources' },
    { id: 'referralTraffic', label: 'Referral Traffic', category: 'Sources' },
    { id: 'activeCampaigns', label: 'Active Campaigns', category: 'Campaigns' },
    { id: 'campaignROI', label: 'Campaign ROI', category: 'Campaigns' },
    { id: 'emailClicks', label: 'Email Clicks', category: 'Campaigns' },
  ];

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId]
    );
  };

  const handleCreate = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (selectedMetrics.length === 0) {
      Alert.alert('Error', 'Please select at least one metric');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/email-scheduler/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
          websiteId: parseInt(websiteId),
          email,
          metrics: selectedMetrics,
          frequency,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek.toLowerCase() : undefined,
          dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }

      Alert.alert('Success', 'Schedule created successfully!');
      onScheduleCreated?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">Create Schedule</Text>
            <Pressable onPress={onClose} disabled={loading}>
              <Text className="text-lg text-primary">✕</Text>
            </Pressable>
          </View>
          <Text className="text-sm text-muted mt-1">Set up automated {websiteName} reports</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Email Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              editable={!loading}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
            />
          </View>

          {/* Frequency Selection */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Frequency</Text>
            <View className="gap-2">
              {FREQUENCIES.map((freq) => (
                <Pressable
                  key={freq}
                  onPress={() => setFrequency(freq)}
                  disabled={loading}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={cn(
                      'flex-row items-center p-3 rounded-lg border',
                      frequency === freq ? 'bg-primary border-primary' : 'bg-surface border-border'
                    )}
                  >
                    <View
                      className={cn(
                        'w-5 h-5 rounded-full border-2 items-center justify-center',
                        frequency === freq ? 'border-background bg-primary' : 'border-border'
                      )}
                    >
                      {frequency === freq && <View className="w-2 h-2 bg-background rounded-full" />}
                    </View>
                    <Text
                      className={cn(
                        'ml-3 font-medium capitalize',
                        frequency === freq ? 'text-background' : 'text-foreground'
                      )}
                    >
                      {freq}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Day Selection */}
          {frequency === 'weekly' && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Day of Week</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                }}
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <Pressable
                    key={day}
                    onPress={() => setDayOfWeek(day)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View
                      className={cn(
                        'px-3 py-3 flex-row items-center justify-between',
                        index !== DAYS_OF_WEEK.length - 1 && 'border-b',
                        'border-border'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-medium',
                          dayOfWeek === day ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {day}
                      </Text>
                      {dayOfWeek === day && <Text className="text-primary">✓</Text>}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {frequency === 'monthly' && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Day of Month</Text>
              <TextInput
                value={dayOfMonth}
                onChangeText={setDayOfMonth}
                placeholder="1-31"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                editable={!loading}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                }}
              />
            </View>
          )}

          {/* Metrics Selection */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              Select Metrics ({selectedMetrics.length})
            </Text>
            {['Overview', 'Performance', 'Sources', 'Campaigns'].map((category) => (
              <View key={category} className="gap-2">
                <Text className="text-xs font-semibold text-muted uppercase">{category}</Text>
                <View className="gap-2">
                  {AVAILABLE_METRICS.filter((m) => m.category === category).map((metric) => (
                    <Pressable
                      key={metric.id}
                      onPress={() => toggleMetric(metric.id)}
                      disabled={loading}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View
                        className={cn(
                          'flex-row items-center p-3 rounded-lg border',
                          selectedMetrics.includes(metric.id)
                            ? 'bg-primary/10 border-primary'
                            : 'bg-surface border-border'
                        )}
                      >
                        <View
                          className={cn(
                            'w-5 h-5 rounded border-2 items-center justify-center',
                            selectedMetrics.includes(metric.id)
                              ? 'border-primary bg-primary'
                              : 'border-border'
                          )}
                        >
                          {selectedMetrics.includes(metric.id) && (
                            <Text className="text-background font-bold text-xs">✓</Text>
                          )}
                        </View>
                        <Text
                          className={cn(
                            'ml-3 font-medium',
                            selectedMetrics.includes(metric.id) ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {metric.label}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Preview Toggle */}
          <Pressable
            onPress={() => setShowPreview(!showPreview)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: colors.primary + '20',
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text className="text-center font-semibold text-primary">
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Text>
            </View>
          </Pressable>

          {/* Schedule Preview */}
          {showPreview && (
            <SchedulePreview
              email={email}
              frequency={frequency}
              dayOfWeek={dayOfWeek}
              dayOfMonth={parseInt(dayOfMonth)}
              metrics={selectedMetrics}
            />
          )}

          {/* Action Buttons */}
          <View className="gap-3 mt-6">
            <Pressable
              onPress={handleCreate}
              disabled={loading}
              style={({ pressed }) => [
                {
                  opacity: pressed || loading ? 0.7 : 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                },
              ]}
            >
              <Text className="text-center font-semibold text-background">
                {loading ? 'Creating...' : 'Create Schedule'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={loading}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View
                style={{
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-center font-semibold text-foreground">Cancel</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
