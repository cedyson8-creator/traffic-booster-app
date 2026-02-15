import { ScrollView, Text, View, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

interface ExportSchedule {
  id: string;
  format: 'csv' | 'json' | 'html' | 'pdf';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  email: string;
  isActive: boolean;
  nextRun: string;
}

export default function ExportSchedulerScreen() {
  const colors = useColors();

  const [schedules, setSchedules] = useState<ExportSchedule[]>([
    {
      id: '1',
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'user@example.com',
      isActive: true,
      nextRun: 'Today at 09:00',
    },
    {
      id: '2',
      format: 'pdf',
      frequency: 'weekly',
      time: '10:00',
      email: 'user@example.com',
      isActive: false,
      nextRun: 'Monday at 10:00',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    format: 'csv' | 'json' | 'html' | 'pdf';
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    email: string;
  }>({
    format: 'csv',
    frequency: 'daily',
    time: '09:00',
    email: 'user@example.com',
  });

  const handleAddSchedule = () => {
    if (!formData.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    const newSchedule: ExportSchedule = {
      id: `schedule-${Date.now()}`,
      ...formData,
      isActive: true,
      nextRun: 'Today at ' + formData.time,
    };

    setSchedules([...schedules, newSchedule]);
    setShowForm(false);
    setFormData({
      format: 'csv',
      frequency: 'daily',
      time: '09:00',
      email: 'user@example.com',
    });

    Alert.alert('Success', 'Export schedule created successfully');
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(
      schedules.map(s =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert('Delete Schedule', 'Are you sure you want to delete this schedule?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => {
          setSchedules(schedules.filter(s => s.id !== id));
          Alert.alert('Deleted', 'Schedule has been deleted');
        },
      },
    ]);
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'csv':
        return '📊 CSV';
      case 'json':
        return '{ } JSON';
      case 'html':
        return '🌐 HTML';
      case 'pdf':
        return '📄 PDF';
      default:
        return format;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '📅 Daily';
      case 'weekly':
        return '📆 Weekly';
      case 'monthly':
        return '📋 Monthly';
      default:
        return frequency;
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-4 gap-6">
          {/* Header */}
          <Animated.View entering={FadeIn} className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Export Scheduler</Text>
            <Text className="text-sm text-muted">
              Schedule automatic dashboard exports and reports
            </Text>
          </Animated.View>

          {/* Add Schedule Button */}
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            className="px-4 py-3 rounded-lg items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-background font-semibold">
              {showForm ? '✕ Cancel' : '+ Add New Schedule'}
            </Text>
          </TouchableOpacity>

          {/* Add Schedule Form */}
          {showForm && (
            <Animated.View entering={SlideInRight} className="gap-4 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <View className="gap-2">
                <Text className="font-semibold text-foreground">Export Format</Text>
                <View className="flex-row gap-2">
                  {(['csv', 'json', 'html', 'pdf'] as const).map((format: 'csv' | 'json' | 'html' | 'pdf') => (
                    <TouchableOpacity
                      key={format}
                      onPress={() => setFormData(prev => ({ ...prev, format }))}
                      className="flex-1 py-2 rounded-lg items-center"
                      style={{
                        backgroundColor: formData.format === format ? colors.primary : colors.background,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        className="font-semibold text-sm"
                        style={{
                          color: formData.format === format ? colors.background : colors.foreground,
                        }}
                      >
                        {getFormatLabel(format)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <Text className="font-semibold text-foreground">Frequency</Text>
                <View className="flex-row gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((freq: 'daily' | 'weekly' | 'monthly') => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setFormData(prev => ({ ...prev, frequency: freq }))}
                      className="flex-1 py-2 rounded-lg items-center"
                      style={{
                        backgroundColor: formData.frequency === freq ? colors.primary : colors.background,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        className="font-semibold text-sm"
                        style={{
                          color: formData.frequency === freq ? colors.background : colors.foreground,
                        }}
                      >
                        {getFrequencyLabel(freq)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <Text className="font-semibold text-foreground">Time (HH:mm)</Text>
                <TextInput
                  value={formData.time}
                  onChangeText={time => setFormData({ ...formData, time })}
                  placeholder="09:00"
                  placeholderTextColor={colors.muted}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  }}
                />
              </View>

              <View className="gap-2">
                <Text className="font-semibold text-foreground">Email Address</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={email => setFormData({ ...formData, email })}
                  placeholder="user@example.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={handleAddSchedule}
                className="px-4 py-3 rounded-lg items-center"
                style={{ backgroundColor: colors.success }}
              >
                <Text className="text-background font-semibold">Create Schedule</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Schedules List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              📋 Active Schedules ({schedules.filter(s => s.isActive).length})
            </Text>

            {schedules.length === 0 ? (
              <View
                className="p-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-muted text-center">No schedules created yet</Text>
              </View>
            ) : (
              schedules.map((schedule, idx) => (
                <Animated.View
                  key={schedule.id}
                  entering={FadeIn.delay(idx * 50)}
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: schedule.isActive ? colors.primary : colors.border,
                    backgroundColor: colors.surface,
                    opacity: schedule.isActive ? 1 : 0.6,
                  }}
                >
                  <View className="gap-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-lg">{getFormatLabel(schedule.format)}</Text>
                          <Text className="text-sm text-muted">{getFrequencyLabel(schedule.frequency)}</Text>
                        </View>
                        <Text className="text-sm text-muted">{schedule.email}</Text>
                      </View>
                      <Switch
                        value={schedule.isActive}
                        onValueChange={() => handleToggleSchedule(schedule.id)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t" style={{ borderTopColor: colors.border }}>
                      <View>
                        <Text className="text-xs text-muted">Next Run</Text>
                        <Text className="font-semibold text-foreground">{schedule.nextRun}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteSchedule(schedule.id)}
                        className="px-3 py-2 rounded-lg"
                        style={{ backgroundColor: colors.error }}
                      >
                        <Text className="text-background font-semibold text-sm">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>

          {/* Export History */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📤 Recent Exports</Text>
            <View
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-semibold text-foreground">Daily CSV Export</Text>
                    <Text className="text-xs text-muted">Feb 15, 2026 at 09:00</Text>
                  </View>
                  <Text className="text-sm text-success">✓ Sent</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
