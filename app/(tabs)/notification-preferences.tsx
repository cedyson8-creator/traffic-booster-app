import { ScrollView, Text, View, Switch, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

interface NotificationPreferences {
  performanceAlerts: boolean;
  forecastWarnings: boolean;
  optimizationTips: boolean;
  exportNotifications: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
}

export default function NotificationPreferencesScreen() {
  const colors = useColors();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    performanceAlerts: true,
    forecastWarnings: true,
    optimizationTips: true,
    exportNotifications: true,
    pushEnabled: true,
    emailEnabled: false,
    minSeverity: 'low',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // TODO: Replace with actual API call
      console.log('[NotificationPreferences] Loading preferences...');
    } catch (error) {
      console.error('[NotificationPreferences] Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call to /api/notifications/preferences
      console.log('[NotificationPreferences] Saving preferences:', preferences);
      Alert.alert('Success', 'Notification preferences updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NotificationPreferences] Error saving preferences:', errorMessage);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setSeverity = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    setPreferences(prev => ({
      ...prev,
      minSeverity: severity,
    }));
  };

  const severityLevels = ['low', 'medium', 'high', 'critical'] as const;
  const severityColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.error,
    critical: colors.error,
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Notification Preferences
            </Text>
            <Text className="text-sm text-muted">
              Customize how and when you receive alerts
            </Text>
          </View>

          {/* Delivery Methods */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Delivery Methods
            </Text>

            <View className="bg-surface rounded-lg p-4 gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    Push Notifications
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Receive alerts on your device
                  </Text>
                </View>
                <Switch
                  value={preferences.pushEnabled}
                  onValueChange={() => togglePreference('pushEnabled')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.foreground}
                />
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    Email Notifications
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Receive alerts via email
                  </Text>
                </View>
                <Switch
                  value={preferences.emailEnabled}
                  onValueChange={() => togglePreference('emailEnabled')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.foreground}
                />
              </View>
            </View>
          </View>

          {/* Notification Types */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Notification Types
            </Text>

            <View className="bg-surface rounded-lg p-4 gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    Performance Alerts
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    When metrics degrade
                  </Text>
                </View>
                <Switch
                  value={preferences.performanceAlerts}
                  onValueChange={() => togglePreference('performanceAlerts')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.foreground}
                />
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    Forecast Warnings
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    When predictions exceed thresholds
                  </Text>
                </View>
                <Switch
                  value={preferences.forecastWarnings}
                  onValueChange={() => togglePreference('forecastWarnings')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.foreground}
                />
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    Optimization Tips
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Cost-saving recommendations
                  </Text>
                </View>
                <Switch
                  value={preferences.optimizationTips}
                  onValueChange={() => togglePreference('optimizationTips')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.foreground}
                />
              </View>

              <View className="h-px bg-border" />

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    Export Notifications
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    When exports are ready
                  </Text>
                </View>
                <Switch
                  value={preferences.exportNotifications}
                  onValueChange={() => togglePreference('exportNotifications')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.foreground}
                />
              </View>
            </View>
          </View>

          {/* Severity Filter */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              Minimum Severity
            </Text>
            <Text className="text-xs text-muted px-1">
              Only receive notifications at this severity level or higher
            </Text>

            <View className="gap-2">
              {severityLevels.map(severity => (
                <TouchableOpacity
                  key={severity}
                  onPress={() => setSeverity(severity)}
                  className={`flex-row items-center gap-3 p-3 rounded-lg border ${
                    preferences.minSeverity === severity
                      ? `bg-primary/10 border-primary`
                      : `bg-surface border-border`
                  }`}
                >
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: severityColors[severity] }}
                  />
                  <Text
                    className={`flex-1 font-medium capitalize ${
                      preferences.minSeverity === severity
                        ? 'text-foreground'
                        : 'text-muted'
                    }`}
                  >
                    {severity}
                  </Text>
                  {preferences.minSeverity === severity && (
                    <Text className="text-primary font-semibold">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 mt-4">
            <TouchableOpacity
              onPress={savePreferences}
              disabled={isSaving}
              className={`flex-row items-center justify-center gap-2 py-3 rounded-lg ${
                isSaving ? 'bg-primary/50' : 'bg-primary'
              }`}
            >
              <Text className="text-base font-semibold text-background">
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPreferences({
                performanceAlerts: true,
                forecastWarnings: true,
                optimizationTips: true,
                exportNotifications: true,
                pushEnabled: true,
                emailEnabled: false,
                minSeverity: 'low',
              })}
              className="flex-row items-center justify-center py-3 rounded-lg border border-border"
            >
              <Text className="text-base font-semibold text-foreground">
                Reset to Defaults
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 rounded-lg p-4 gap-2 border border-primary/30">
            <Text className="text-sm font-semibold text-foreground">
              💡 Pro Tip
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              Adjust your minimum severity to reduce notification noise. Set to "high" to only receive critical alerts.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
