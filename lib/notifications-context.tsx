import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Notification,
  NotificationPreferences,
} from "./notification-types";
import {
  configureNotifications,
  getNotificationPermissionStatus,
} from "./notification-service";

interface NotificationsContextType {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  addNotification: (notification: Notification) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  permissionStatus: "granted" | "denied" | "undetermined";
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined
);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  campaignMilestones: true,
  trafficSpikes: true,
  recommendations: true,
  campaignCompletion: true,
  abTestResults: true,
  systemUpdates: true,
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
  },
};

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_PREFERENCES
  );
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "undetermined"
  >("undetermined");

  // Initialize
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Configure notifications
      await configureNotifications();

      // Get permission status
      const status = await getNotificationPermissionStatus();
      setPermissionStatus(status);

      // Load preferences
      const savedPreferences = await AsyncStorage.getItem(
        "notification_preferences"
      );
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }

      // Load notifications
      const savedNotifications = await AsyncStorage.getItem("notifications");
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        // Filter out expired notifications
        const active = parsed.filter(
          (n: Notification) => !n.expiresAt || n.expiresAt > Date.now()
        );
        setNotifications(active);
      }
    } catch (error) {
      console.error("[NotificationsProvider] Failed to initialize:", error);
    }
  };

  const addNotification = async (notification: Notification) => {
    try {
      const updated = [notification, ...notifications];
      setNotifications(updated);
      await AsyncStorage.setItem("notifications", JSON.stringify(updated));
    } catch (error) {
      console.error("[NotificationsProvider] Failed to add notification:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
      await AsyncStorage.setItem("notifications", JSON.stringify(updated));
    } catch (error) {
      console.error("[NotificationsProvider] Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      await AsyncStorage.setItem("notifications", JSON.stringify(updated));
    } catch (error) {
      console.error(
        "[NotificationsProvider] Failed to mark all as read:",
        error
      );
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const updated = notifications.filter((n) => n.id !== notificationId);
      setNotifications(updated);
      await AsyncStorage.setItem("notifications", JSON.stringify(updated));
    } catch (error) {
      console.error(
        "[NotificationsProvider] Failed to delete notification:",
        error
      );
    }
  };

  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      await AsyncStorage.setItem("notifications", JSON.stringify([]));
    } catch (error) {
      console.error(
        "[NotificationsProvider] Failed to clear notifications:",
        error
      );
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      setPreferences(newPreferences);
      await AsyncStorage.setItem(
        "notification_preferences",
        JSON.stringify(newPreferences)
      );
    } catch (error) {
      console.error(
        "[NotificationsProvider] Failed to update preferences:",
        error
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        preferences,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        updatePreferences,
        permissionStatus,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return context;
}
