import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useNotifications } from "@/lib/notifications-context";
import { NotificationPreferences } from "@/lib/notification-types";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { preferences, updatePreferences, permissionStatus } =
    useNotifications();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(
    preferences
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleQuietHoursToggle = () => {
    setLocalPrefs((prev) => ({
      ...prev,
      quietHours: prev.quietHours
        ? {
            ...prev.quietHours,
            enabled: !prev.quietHours.enabled,
          }
        : {
            enabled: true,
            startTime: "22:00",
            endTime: "08:00",
          },
    }));
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    setLocalPrefs((prev) => ({
      ...prev,
      quietHours: prev.quietHours
        ? {
            ...prev.quietHours,
            [field]: value,
          }
        : {
            enabled: false,
            startTime: "22:00",
            endTime: "08:00",
          },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updatePreferences(localPrefs);
      Alert.alert("Success", "Notification settings saved");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPrefs(preferences);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">
                ← Back
              </Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-1">
              Notification Settings
            </Text>
            <Text className="text-muted">
              Customize when and how you receive notifications
            </Text>
          </View>

          {/* Permission Status */}
          <View
            className={`rounded-xl p-4 border ${
              permissionStatus === "granted"
                ? "bg-success/10 border-success/20"
                : "bg-warning/10 border-warning/20"
            }`}
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons
                name={
                  permissionStatus === "granted"
                    ? "check-circle"
                    : "warning"
                }
                size={20}
                color={
                  permissionStatus === "granted" ? colors.success : colors.warning
                }
              />
              <View className="flex-1">
                <Text className="font-semibold text-foreground">
                  {permissionStatus === "granted"
                    ? "Notifications Enabled"
                    : "Notifications Disabled"}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {permissionStatus === "granted"
                    ? "You will receive all enabled notifications"
                    : "Enable notifications in system settings to receive alerts"}
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Types */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Notification Types
            </Text>
            <View className="gap-2">
              {/* Campaign Milestones */}
              <View className="flex-row items-center justify-between bg-surface rounded-lg p-4 border border-border">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    Campaign Milestones
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    When campaigns reach 25%, 50%, 75%, 100%
                  </Text>
                </View>
                <Switch
                  value={localPrefs.campaignMilestones}
                  onValueChange={() => handleToggle("campaignMilestones")}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              {/* Traffic Spikes */}
              <View className="flex-row items-center justify-between bg-surface rounded-lg p-4 border border-border">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    Traffic Spikes
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    When unusual traffic increases are detected
                  </Text>
                </View>
                <Switch
                  value={localPrefs.trafficSpikes}
                  onValueChange={() => handleToggle("trafficSpikes")}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              {/* Recommendations */}
              <View className="flex-row items-center justify-between bg-surface rounded-lg p-4 border border-border">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    Recommendations
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    New optimization suggestions for campaigns
                  </Text>
                </View>
                <Switch
                  value={localPrefs.recommendations}
                  onValueChange={() => handleToggle("recommendations")}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              {/* Campaign Completion */}
              <View className="flex-row items-center justify-between bg-surface rounded-lg p-4 border border-border">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    Campaign Completion
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    When campaigns reach their targets
                  </Text>
                </View>
                <Switch
                  value={localPrefs.campaignCompletion}
                  onValueChange={() => handleToggle("campaignCompletion")}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              {/* A/B Test Results */}
              <View className="flex-row items-center justify-between bg-surface rounded-lg p-4 border border-border">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    A/B Test Results
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    When A/B tests complete with winners
                  </Text>
                </View>
                <Switch
                  value={localPrefs.abTestResults}
                  onValueChange={() => handleToggle("abTestResults")}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              {/* System Updates */}
              <View className="flex-row items-center justify-between bg-surface rounded-lg p-4 border border-border">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    System Updates
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Important app updates and maintenance notices
                  </Text>
                </View>
                <Switch
                  value={localPrefs.systemUpdates}
                  onValueChange={() => handleToggle("systemUpdates")}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
            </View>
          </View>

          {/* Quiet Hours */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Quiet Hours
            </Text>
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    Enable Quiet Hours
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Don't receive notifications during these hours
                  </Text>
                </View>
                <Switch
                  value={localPrefs.quietHours?.enabled ?? false}
                  onValueChange={handleQuietHoursToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>

              {localPrefs.quietHours?.enabled && (
                <View className="gap-3 mt-2 pt-3 border-t border-border">
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Start Time
                    </Text>
                    <TextInput
                      value={localPrefs.quietHours?.startTime}
                      onChangeText={(value) =>
                        handleTimeChange("startTime", value)
                      }
                      placeholder="HH:mm"
                      placeholderTextColor={colors.muted}
                      className="bg-background border border-border rounded-lg p-3 text-foreground"
                    />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      End Time
                    </Text>
                    <TextInput
                      value={localPrefs.quietHours?.endTime}
                      onChangeText={(value) =>
                        handleTimeChange("endTime", value)
                      }
                      placeholder="HH:mm"
                      placeholderTextColor={colors.muted}
                      className="bg-background border border-border rounded-lg p-3 text-foreground"
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-2 mt-4">
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="bg-primary rounded-lg p-4 items-center"
            >
              <Text className="text-background font-semibold">
                {isSaving ? "Saving..." : "Save Settings"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReset}
              className="bg-surface border border-border rounded-lg p-4 items-center"
            >
              <Text className="text-foreground font-semibold">Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
