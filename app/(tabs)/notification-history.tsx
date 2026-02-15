import { ScrollView, Text, View, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

interface Notification {
  id: string;
  type: 'performance_alert' | 'forecast_warning' | 'optimization_recommendation' | 'export_ready';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export default function NotificationHistoryScreen() {
  const colors = useColors();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'performance' | 'forecast' | 'optimization' | 'export'>('all');

  type FilterType = typeof filter;

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call to /api/notifications/history/:userId
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'performance_alert',
          title: 'Performance Alert',
          message: 'Response time degraded by 25% on /api/users',
          severity: 'high',
          read: false,
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          data: { endpoint: '/api/users', metric: 'response_time', degradationPercent: 25 },
        },
        {
          id: '2',
          type: 'forecast_warning',
          title: 'Forecast Warning',
          message: 'Predicted usage (85%) exceeds threshold (80%)',
          severity: 'medium',
          read: false,
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          data: { predicted: 85, threshold: 80 },
        },
        {
          id: '3',
          type: 'optimization_recommendation',
          title: 'Optimization Opportunity',
          message: 'Enable caching can save approximately $500/month',
          severity: 'low',
          read: true,
          createdAt: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
          data: { type: 'caching', savings: 500 },
        },
        {
          id: '4',
          type: 'export_ready',
          title: 'Export Ready',
          message: 'Your CSV export is ready for download',
          severity: 'low',
          read: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          data: { format: 'csv' },
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NotificationHistory] Error loading notifications:', errorMessage);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    // TODO: Call API to mark as read
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // TODO: Call API to delete notification
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter !== 'all') {
      if (filter === 'performance') {
        filtered = filtered.filter(n => n.type === 'performance_alert');
      } else if (filter === 'forecast') {
        filtered = filtered.filter(n => n.type === 'forecast_warning');
      } else if (filter === 'optimization') {
        filtered = filtered.filter(n => n.type === 'optimization_recommendation');
      } else if (filter === 'export') {
        filtered = filtered.filter(n => n.type === 'export_ready');
      }
    }

    return filtered;
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'performance_alert':
        return colors.error;
      case 'forecast_warning':
        return colors.warning;
      case 'optimization_recommendation':
        return colors.success;
      case 'export_ready':
        return colors.primary;
      default:
        return colors.muted;
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'performance_alert':
        return 'Performance';
      case 'forecast_warning':
        return 'Forecast';
      case 'optimization_recommendation':
        return 'Optimization';
      case 'export_ready':
        return 'Export';
      default:
        return 'Notification';
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical':
        return colors.error;
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const filterButtons: Array<{ label: string; value: typeof filter }> = [
    { label: 'All', value: 'all' },
    { label: `Unread (${unreadCount})`, value: 'unread' },
    { label: 'Performance', value: 'performance' },
    { label: 'Forecast', value: 'forecast' },
    { label: 'Optimization', value: 'optimization' },
    { label: 'Export', value: 'export' },
  ];

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1">
        {/* Header */}
        <View className="gap-2 mb-4">
          <Text className="text-3xl font-bold text-foreground">
            Notifications
          </Text>
          <Text className="text-sm text-muted">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 -mx-4 px-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {filterButtons.map(btn => (
            <TouchableOpacity
              key={btn.value}
              onPress={() => setFilter(btn.value as FilterType)}
              className={`px-4 py-2 rounded-full ${
                filter === btn.value
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  filter === btn.value ? 'text-background' : 'text-foreground'
                }`}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-2xl">📭</Text>
            <Text className="text-muted font-medium">No notifications</Text>
            <Text className="text-xs text-muted text-center">
              You're all caught up!
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={item => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => markAsRead(item.id)}
                className={`mb-3 p-4 rounded-lg border ${
                  item.read
                    ? `bg-surface border-border`
                    : `bg-primary/5 border-primary/30`
                }`}
              >
                <View className="gap-2">
                  {/* Header */}
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center gap-2">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getTypeColor(item.type) }}
                        />
                        <Text className="text-xs font-semibold text-muted">
                          {getTypeLabel(item.type)}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded"
                          style={{ backgroundColor: getSeverityColor(item.severity) + '20' }}
                        >
                          <Text
                            className="text-xs font-medium capitalize"
                            style={{ color: getSeverityColor(item.severity) }}
                          >
                            {item.severity}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-base font-semibold text-foreground">
                        {item.title}
                      </Text>
                    </View>
                    {!item.read && (
                      <View className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                  </View>

                  {/* Message */}
                  <Text className="text-sm text-muted leading-relaxed">
                    {item.message}
                  </Text>

                  {/* Footer */}
                  <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
                    <Text className="text-xs text-muted">
                      {formatTime(item.createdAt)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteNotification(item.id)}
                      className="px-3 py-1"
                    >
                      <Text className="text-xs text-error font-medium">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
