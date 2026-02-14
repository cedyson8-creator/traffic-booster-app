import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export type ReportFrequency = 'weekly' | 'biweekly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface EmailScheduleConfig {
  email: string;
  frequency: ReportFrequency;
  dayOfWeek?: DayOfWeek;
  dayOfMonth?: number;
}

interface EmailSchedulerModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (config: EmailScheduleConfig) => Promise<void>;
  isLoading?: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function EmailSchedulerModal({
  visible,
  onClose,
  onSchedule,
  isLoading = false,
}: EmailSchedulerModalProps) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<ReportFrequency>('weekly');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(1);
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setScheduling(true);
    try {
      const config: EmailScheduleConfig = {
        email,
        frequency,
        dayOfWeek: frequency !== 'monthly' ? selectedDay : undefined,
        dayOfMonth: frequency === 'monthly' ? selectedDayOfMonth : undefined,
      };

      await onSchedule(config);
      // Reset form
      setEmail('');
      setFrequency('weekly');
      setSelectedDay('monday');
      setSelectedDayOfMonth(1);
      onClose();
    } catch (error) {
      console.error('Failed to schedule report:', error);
      alert('Failed to schedule report');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={{ backgroundColor: colors.background }} className="flex-1">
        {/* Header */}
        <View
          style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}
          className="flex-row items-center justify-between p-4 border-b"
        >
          <Text className="text-lg font-bold text-foreground">Schedule Report</Text>
          <Pressable
            onPress={onClose}
            disabled={scheduling || isLoading}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-lg font-semibold text-primary">✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              editable={!scheduling && !isLoading}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
              }}
            />
          </View>

          {/* Frequency Selection */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">Frequency</Text>
            <View className="gap-2">
              {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                <Pressable
                  key={freq}
                  onPress={() => setFrequency(freq)}
                  disabled={scheduling || isLoading}
                  style={({ pressed }) => [
                    {
                      backgroundColor: frequency === freq ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  className="p-4 rounded-lg border flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={cn(
                        'w-5 h-5 rounded-full border-2',
                        frequency === freq
                          ? `bg-primary border-primary`
                          : `border-border`
                      )}
                    >
                      {frequency === freq && (
                        <Text className="text-background text-xs font-bold text-center">✓</Text>
                      )}
                    </View>
                    <Text
                      className={cn(
                        'font-semibold text-base',
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
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">Send on</Text>
              <View className="gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    disabled={scheduling || isLoading}
                    style={({ pressed }) => [
                      {
                        backgroundColor: selectedDay === day ? colors.primary : colors.surface,
                        borderColor: colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    className="p-3 rounded-lg border"
                  >
                    <Text
                      className={cn(
                        'font-semibold',
                        selectedDay === day ? 'text-background' : 'text-foreground'
                      )}
                    >
                      {DAY_LABELS[day]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Day of Month Selection */}
          {frequency === 'monthly' && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">Day of Month</Text>
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDayOfMonth(day)}
                    disabled={scheduling || isLoading}
                    style={({ pressed }) => [
                      {
                        backgroundColor: selectedDayOfMonth === day ? colors.primary : colors.surface,
                        borderColor: colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    className="w-12 h-12 rounded-lg border items-center justify-center"
                  >
                    <Text
                      className={cn(
                        'font-semibold',
                        selectedDayOfMonth === day ? 'text-background' : 'text-foreground'
                      )}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Info Box */}
          <View
            style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary }}
            className="p-4 rounded-lg border mb-6"
          >
            <Text className="text-sm text-foreground">
              📧 Reports will be sent automatically at 9:00 AM on the selected schedule with your custom metrics.
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
          className="border-t p-4 gap-2 flex-row"
        >
          <Pressable
            onPress={onClose}
            disabled={scheduling || isLoading}
            style={({ pressed }) => [
              {
                backgroundColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            className="flex-1 p-4 rounded-lg items-center"
          >
            <Text className="font-semibold text-foreground">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSchedule}
            disabled={scheduling || isLoading || !email}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed && !scheduling && !isLoading ? 0.8 : scheduling || isLoading || !email ? 0.5 : 1,
              },
            ]}
            className="flex-1 p-4 rounded-lg items-center"
          >
            <Text className="font-semibold text-background">
              {scheduling ? 'Scheduling...' : 'Schedule Report'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
