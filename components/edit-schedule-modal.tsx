import { Modal, View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { SchedulePreview } from './schedule-preview';

interface ScheduledReport {
  id: number;
  email: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  isActive: boolean;
  nextSendAt: string;
  metrics: string[];
}

interface EditScheduleModalProps {
  visible: boolean;
  schedule: ScheduledReport | null;
  userId: number;
  onClose: () => void;
  onSave: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FREQUENCIES = ['weekly', 'biweekly', 'monthly'] as const;

export function EditScheduleModal({
  visible,
  schedule,
  userId,
  onClose,
  onSave,
}: EditScheduleModalProps) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (schedule) {
      setEmail(schedule.email);
      setFrequency(schedule.frequency);
      setDayOfWeek(schedule.dayOfWeek || 'Monday');
      setDayOfMonth(String(schedule.dayOfMonth || 1));
    }
  }, [schedule, visible]);

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (frequency === 'monthly') {
      const day = parseInt(dayOfMonth);
      if (isNaN(day) || day < 1 || day > 31) {
        Alert.alert('Validation Error', 'Please enter a day between 1 and 31');
        return;
      }
    }

    if (!schedule) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/email-scheduler/schedules/${schedule.id}?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          frequency,
          dayOfWeek: frequency !== 'monthly' ? dayOfWeek : undefined,
          dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : undefined,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Schedule updated successfully');
        onSave();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      Alert.alert('Error', 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            marginTop: 100,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="p-6 gap-6">
              {/* Header */}
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-foreground">Edit Schedule</Text>
                <Pressable onPress={onClose} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                  <Text className="text-2xl text-foreground">✕</Text>
                </Pressable>
              </View>

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
                          frequency === freq
                            ? 'bg-primary border-primary'
                            : 'bg-surface border-border'
                        )}
                      >
                        <View
                          className={cn(
                            'w-5 h-5 rounded-full border-2 items-center justify-center',
                            frequency === freq
                              ? 'border-background bg-primary'
                              : 'border-border'
                          )}
                        >
                          {frequency === freq && (
                            <View className="w-2 h-2 bg-background rounded-full" />
                          )}
                        </View>
                        <Text
                          className={cn(
                            'ml-3 font-medium capitalize',
                            frequency === freq ? 'text-background' : 'text-foreground'
                          )}
                        >
                          {freq === 'biweekly' ? 'Every 2 Weeks' : freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Day Selection */}
              {frequency !== 'monthly' && (
                <View className="gap-3">
                  <Text className="text-sm font-semibold text-foreground">Day of Week</Text>
                  <View className="gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Pressable
                        key={day}
                        onPress={() => setDayOfWeek(day)}
                        disabled={loading}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View
                          className={cn(
                            'p-3 rounded-lg border',
                            dayOfWeek === day
                              ? 'bg-primary border-primary'
                              : 'bg-surface border-border'
                          )}
                        >
                          <Text
                            className={cn(
                              'font-medium',
                              dayOfWeek === day ? 'text-background' : 'text-foreground'
                            )}
                          >
                            {day}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Day of Month */}
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

              {/* Preview Toggle Button */}
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
                  metrics={schedule?.metrics || []}
                />
              )}

              {/* Action Buttons */}
              <View className="gap-3 mt-6">
                <Pressable
                  onPress={handleSave}
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
                    {loading ? 'Saving...' : 'Save Changes'}
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
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
