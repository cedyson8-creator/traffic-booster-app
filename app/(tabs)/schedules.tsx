import { ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { useWebsites } from '@/lib/websites-context';
import { cn } from '@/lib/utils';
import { EditScheduleModal } from '@/components/edit-schedule-modal';

interface ScheduledReport {
  id: number;
  email: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  isActive: boolean;
  nextSendAt: string;
  lastSentAt?: string;
  metrics: string[];
}

export default function SchedulesScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { websites } = useWebsites();
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [user?.id]);

  const loadSchedules = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/email-scheduler/schedules?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (id: number, isActive: boolean) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/email-scheduler/schedules/${id}/toggle?userId=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await loadSchedules();
        Alert.alert('Success', `Schedule ${!isActive ? 'enabled' : 'disabled'}`);
      } else {
        Alert.alert('Error', 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const deleteSchedule = async (id: number) => {
    if (!user?.id) return;

    Alert.alert('Delete Schedule', 'Are you sure you want to delete this schedule?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const response = await fetch(`/api/email-scheduler/schedules/${id}?userId=${user.id}`, {
              method: 'DELETE',
            });

            if (response.ok) {
              await loadSchedules();
              Alert.alert('Success', 'Schedule deleted');
            } else {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          } catch (error) {
            console.error('Failed to delete schedule:', error);
            Alert.alert('Error', 'Failed to delete schedule');
          }
        },
      },
    ]);
  };

  const getWebsiteName = (scheduleId: number) => {
    // For now, return a generic label since we don't have website info in the schedule
    return `Schedule ${scheduleId}`;
  };

  const formatNextSendDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFrequencyLabel = (frequency: string, dayOfWeek?: string, dayOfMonth?: number) => {
    switch (frequency) {
      case 'weekly':
        return `Weekly on ${dayOfWeek || 'Monday'}`;
      case 'biweekly':
        return `Every 2 weeks on ${dayOfWeek || 'Monday'}`;
      case 'monthly':
        return `Monthly on day ${dayOfMonth || 1}`;
      default:
        return frequency;
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <Text className="text-foreground">Loading schedules...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2 mb-4">
            <Text className="text-3xl font-bold text-foreground">Scheduled Reports</Text>
            <Text className="text-base text-muted">Manage your automated report deliveries</Text>
          </View>

          {/* Empty State */}
          {schedules.length === 0 ? (
            <View className="items-center justify-center py-12 gap-3">
              <Text className="text-lg font-semibold text-foreground">No scheduled reports yet</Text>
              <Text className="text-sm text-muted text-center">
                Create your first scheduled report from the Analytics tab
              </Text>
            </View>
          ) : (
            /* Schedule List */
            <View className="gap-3">
              {schedules.map((schedule) => (
                <Pressable
                  key={schedule.id}
                  onPress={() => setSelectedScheduleId(selectedScheduleId === schedule.id ? null : schedule.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={cn(
                      'rounded-lg p-4 border',
                      schedule.isActive
                        ? 'bg-surface border-primary'
                        : 'bg-surface border-border opacity-60'
                    )}
                  >
                    {/* Schedule Header */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">
                          Report Schedule
                        </Text>
                        <Text className="text-sm text-muted mt-1">{schedule.email}</Text>
                      </View>
                      <View
                        className={cn(
                          'px-3 py-1 rounded-full',
                          schedule.isActive ? 'bg-primary' : 'bg-border'
                        )}
                      >
                        <Text className={cn('text-xs font-semibold', schedule.isActive ? 'text-background' : 'text-foreground')}>
                          {schedule.isActive ? 'Active' : 'Paused'}
                        </Text>
                      </View>
                    </View>

                    {/* Schedule Details */}
                    <View className="gap-2 mb-3">
                      <Text className="text-sm text-foreground font-medium">
                        {getFrequencyLabel(schedule.frequency, schedule.dayOfWeek, schedule.dayOfMonth)}
                      </Text>
                      <Text className="text-xs text-muted">
                        Next send: {formatNextSendDate(schedule.nextSendAt)}
                      </Text>
                      {schedule.lastSentAt && (
                        <Text className="text-xs text-muted">
                          Last sent: {formatNextSendDate(schedule.lastSentAt)}
                        </Text>
                      )}
                    </View>

                    {/* Metrics */}
                    <View className="mb-3">
                      <Text className="text-xs font-semibold text-foreground mb-2">
                        Metrics ({schedule.metrics.length})
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {schedule.metrics.slice(0, 3).map((metric, idx) => (
                          <View key={idx} className="bg-primary/10 px-2 py-1 rounded">
                            <Text className="text-xs text-primary font-medium">{metric}</Text>
                          </View>
                        ))}
                        {schedule.metrics.length > 3 && (
                          <View className="bg-primary/10 px-2 py-1 rounded">
                            <Text className="text-xs text-primary font-medium">+{schedule.metrics.length - 3}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Expanded Actions */}
                    {selectedScheduleId === schedule.id && (
                      <View className="border-t border-border pt-3 gap-2 mt-3">
                        <Pressable
                          onPress={() => {
                            setEditingSchedule(schedule);
                            setShowEditModal(true);
                          }}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <View className="bg-primary/10 py-2 px-3 rounded">
                            <Text className="text-sm font-semibold text-primary text-center">Edit Schedule</Text>
                          </View>
                        </Pressable>

                        <Pressable
                          onPress={() => toggleSchedule(schedule.id, schedule.isActive)}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <View className="bg-primary/10 py-2 px-3 rounded">
                            <Text className="text-sm font-semibold text-primary text-center">
                              {schedule.isActive ? 'Pause Schedule' : 'Resume Schedule'}
                            </Text>
                          </View>
                        </Pressable>

                        <Pressable
                          onPress={() => deleteSchedule(schedule.id)}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <View className="bg-error/10 py-2 px-3 rounded">
                            <Text className="text-sm font-semibold text-error text-center">Delete Schedule</Text>
                          </View>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        visible={showEditModal}
        schedule={editingSchedule}
        userId={user?.id || 0}
        onClose={() => {
          setShowEditModal(false);
          setEditingSchedule(null);
        }}
        onSave={() => {
          loadSchedules();
          setSelectedScheduleId(null);
        }}
      />
    </ScreenContainer>
  );
}
