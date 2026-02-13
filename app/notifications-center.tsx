import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useNotifications } from "@/lib/notifications-context";
import { Notification } from "@/lib/notification-types";

export default function NotificationsCenterScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: () => clearAllNotifications(),
          style: "destructive",
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      campaign_milestone: "flag",
      traffic_spike: "trending-up",
      recommendation: "lightbulb",
      campaign_completed: "check-circle",
      campaign_paused: "pause-circle",
      ab_test_winner: "emoji-events",
      system: "info",
    };
    return icons[type] || "notifications";
  };

  const getNotificationColor = (type: string) => {
    const colors_map: Record<string, string> = {
      campaign_milestone: "#0a7ea4",
      traffic_spike: "#22C55E",
      recommendation: "#F59E0B",
      campaign_completed: "#22C55E",
      campaign_paused: "#EF4444",
      ab_test_winner: "#8B5CF6",
      system: "#6B7280",
    };
    return colors_map[type] || colors.primary;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.id)}
      className={`mb-2 rounded-xl p-4 border ${
        item.read
          ? "bg-surface border-border"
          : "bg-primary/5 border-primary/20"
      }`}
    >
      <View className="flex-row gap-3">
        <View
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{
            backgroundColor: `${getNotificationColor(item.type)}20`,
          }}
        >
          <MaterialIcons
            name={getNotificationIcon(item.type) as any}
            size={20}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`font-semibold ${
                item.read ? "text-foreground" : "text-foreground font-bold"
              }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View className="w-2 h-2 rounded-full bg-primary ml-2" />
            )}
          </View>
          <Text className="text-sm text-muted mt-1" numberOfLines={2}>
            {item.message}
          </Text>
          <Text className="text-xs text-muted mt-2">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-foreground">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Text className="text-sm text-primary mt-1">
                {unreadCount} unread
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-lg bg-surface items-center justify-center"
          >
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <View className="flex-row gap-2 mb-4">
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={() => markAllAsRead()}
                className="flex-1 bg-primary/10 border border-primary/20 rounded-lg p-2"
              >
                <Text className="text-sm font-semibold text-primary text-center">
                  Mark All as Read
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleClearAll}
              className="flex-1 bg-error/10 border border-error/20 rounded-lg p-2"
            >
              <Text className="text-sm font-semibold text-error text-center">
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons
              name="notifications-none"
              size={48}
              color={colors.muted}
            />
            <Text className="text-lg font-semibold text-foreground mt-4">
              No Notifications
            </Text>
            <Text className="text-sm text-muted mt-2 text-center">
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      </View>

      {/* Footer Info */}
      <View className="bg-surface rounded-lg p-3 border border-border mt-4">
        <View className="flex-row gap-2">
          <MaterialIcons name="info" size={16} color={colors.muted} />
          <Text className="text-xs text-muted flex-1">
            Long press on a notification to delete it. Tap to view details.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
