import { ScrollView, Text, View, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

interface Notification {
  id: string;
  type: 'performance_alert' | 'forecast_warning' | 'optimization_recommendation' | 'export_ready';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  createdAt: Date;
}

interface NotificationPreferences {
  performanceAlerts: boolean;
  forecastWarnings: boolean;
  optimizationTips: boolean;
  exportNotifications: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export default function NotificationsScreen() {
  const colors = useColors();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'performance_alert',
      title: 'Performance Degradation: /api/users',
      message: 'Response time has degraded by 35% on /api/users',
      severity: 'high',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: '2',
      type: 'forecast_warning',
      title: 'Forecast Threshold Exceeded',
      message: 'Predicted usage (1850) exceeds threshold (1500)',
      severity: 'medium',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: '3',
      type: 'optimization_recommendation',
      title: 'New Optimization: Caching',
      message: 'Implement Redis caching to save approximately $500',
      severity: 'low',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: '4',
      type: 'export_ready',
      title: 'Export Ready',
      message: 'Your CSV export is ready and has been sent to user@example.com',
      severity: 'low',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  ]);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    performanceAlerts: true,
    forecastWarnings: true,
    optimizationTips: true,
    exportNotifications: true,
    pushEnabled: true,
    emailEnabled: false,
    minSeverity: 'low',
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map(n => ({ ...n, read: true }))
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance_alert':
        return '⚠️';
      case 'forecast_warning':
        return '📈';
      case 'optimization_recommendation':
        return '💡';
      case 'export_ready':
        return '📤';
      default:
        return '🔔';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.primary;
      case 'low':
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-4 gap-6">
          {/* Header */}
          <Animated.View entering={FadeIn} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-foreground">Notifications</Text>
              {unreadCount > 0 && (
                <View
                  className="px-2 py-1 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.error, minWidth: 24 }}
                >
                  <Text className="text-xs font-bold text-background">{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-muted">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up'}
            </Text>
          </Animated.View>

          {/* Mark All As Read */}
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              className="px-4 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-background font-semibold">Mark All as Read</Text>
            </TouchableOpacity>
          )}

          {/* Notifications List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📬 Recent</Text>

            {notifications.length === 0 ? (
              <View
                className="p-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-muted text-center">No notifications yet</Text>
              </View>
            ) : (
              notifications.map((notif, idx) => (
                <Animated.View
                  key={notif.id}
                  entering={FadeIn.delay(idx * 50)}
                  className="p-4 rounded-lg border flex-row gap-3"
                  style={{
                    borderColor: notif.read ? colors.border : getSeverityColor(notif.severity),
                    backgroundColor: notif.read ? colors.surface : colors.background,
                    borderLeftWidth: 4,
                  }}
                >
                  <View className="pt-1">
                    <Text className="text-2xl">{getTypeIcon(notif.type)}</Text>
                  </View>

                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="font-semibold text-foreground flex-1" numberOfLines={1}>
                        {notif.title}
                      </Text>
                      <View
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: getSeverityColor(notif.severity) }}
                      >
                        <Text className="text-xs font-bold text-background">
                          {notif.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm text-muted">{notif.message}</Text>

                    <View className="flex-row items-center justify-between pt-2 gap-2">
                      <Text className="text-xs text-muted">{getTimeAgo(notif.createdAt)}</Text>
                      <View className="flex-row gap-2">
                        {!notif.read && (
                          <TouchableOpacity
                            onPress={() => handleMarkAsRead(notif.id)}
                            className="px-2 py-1 rounded"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text className="text-xs font-semibold text-background">Mark Read</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleDeleteNotification(notif.id)}
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: colors.error }}
                        >
                          <Text className="text-xs font-semibold text-background">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>

          {/* Preferences */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">⚙️ Preferences</Text>

            <View className="gap-3 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              {/* Notification Types */}
              <View className="gap-3">
                <Text className="font-semibold text-foreground">Notification Types</Text>

                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground">Performance Alerts</Text>
                  <Switch
                    value={preferences.performanceAlerts}
                    onValueChange={v => handlePreferenceChange('performanceAlerts', v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground">Forecast Warnings</Text>
                  <Switch
                    value={preferences.forecastWarnings}
                    onValueChange={v => handlePreferenceChange('forecastWarnings', v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground">Optimization Tips</Text>
                  <Switch
                    value={preferences.optimizationTips}
                    onValueChange={v => handlePreferenceChange('optimizationTips', v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground">Export Notifications</Text>
                  <Switch
                    value={preferences.exportNotifications}
                    onValueChange={v => handlePreferenceChange('exportNotifications', v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </View>

              {/* Delivery Methods */}
              <View className="pt-3 gap-3 border-t" style={{ borderTopColor: colors.border }}>
                <Text className="font-semibold text-foreground">Delivery Methods</Text>

                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground">Push Notifications</Text>
                  <Switch
                    value={preferences.pushEnabled}
                    onValueChange={v => handlePreferenceChange('pushEnabled', v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground">Email Notifications</Text>
                  <Switch
                    value={preferences.emailEnabled}
                    onValueChange={v => handlePreferenceChange('emailEnabled', v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </View>

              {/* Minimum Severity */}
              <View className="pt-3 gap-2 border-t" style={{ borderTopColor: colors.border }}>
                <Text className="font-semibold text-foreground">Minimum Severity</Text>
                <View className="flex-row gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map(severity => (
                    <TouchableOpacity
                      key={severity}
                      onPress={() => handlePreferenceChange('minSeverity', severity)}
                      className="flex-1 py-2 rounded-lg items-center"
                      style={{
                        backgroundColor: preferences.minSeverity === severity ? colors.primary : colors.background,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        className="font-semibold text-sm"
                        style={{
                          color: preferences.minSeverity === severity ? colors.background : colors.foreground,
                        }}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
