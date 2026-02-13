import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  Notification,
  NotificationEvent,
  NotificationType,
  CampaignMilestoneData,
  TrafficSpikeData,
  RecommendationData,
  ABTestWinnerData,
} from "./notification-types";

/**
 * Configure notification handler
 */
export async function configureNotifications(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn("[NotificationService] Notification permissions not granted");
  }
}

/**
 * Send local notification
 */
export async function sendLocalNotification(
  notification: Notification
): Promise<void> {
  if (Platform.OS === "web") {
    // Web notifications using browser API
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        tag: notification.id,
        badge: "/assets/images/icon.png",
      });
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification.id,
          type: notification.type,
          campaignId: notification.campaignId,
          testId: notification.testId,
          actionUrl: notification.actionUrl,
          ...notification.data,
        },
        sound: true,
        badge: 1,
      },
      trigger: { seconds: 1 } as any,
    });
  } catch (error) {
    console.error("[NotificationService] Failed to send notification:", error);
  }
}

/**
 * Create campaign milestone notification
 */
export function createCampaignMilestoneNotification(
  campaignId: string,
  data: CampaignMilestoneData
): Notification {
  const milestoneLabel = `${data.milestone}%`;
  return {
    id: `milestone-${campaignId}-${data.milestone}-${Date.now()}`,
    campaignId,
    type: "campaign_milestone",
    title: `🎯 Campaign Milestone Reached!`,
    message: `${data.campaignName} has reached ${milestoneLabel} of its target (${data.currentVisits.toLocaleString()} / ${data.targetVisits.toLocaleString()} visits)`,
    priority: "high",
    read: false,
    createdAt: Date.now(),
    data,
  };
}

/**
 * Create traffic spike notification
 */
export function createTrafficSpikeNotification(
  campaignId: string,
  data: TrafficSpikeData
): Notification {
  return {
    id: `spike-${campaignId}-${Date.now()}`,
    campaignId,
    type: "traffic_spike",
    title: `📈 Traffic Spike Detected!`,
    message: `${data.campaignName} experienced a ${data.spikePercentage.toFixed(
      1
    )}% traffic increase in the ${data.timeWindow}`,
    priority: "normal",
    read: false,
    createdAt: Date.now(),
    data,
  };
}

/**
 * Create recommendation notification
 */
export function createRecommendationNotification(
  campaignId: string,
  data: RecommendationData
): Notification {
  const typeEmoji = {
    budget: "💰",
    duration: "⏱️",
    targeting: "🎯",
    timing: "⏰",
    content: "✍️",
  };

  return {
    id: `recommendation-${campaignId}-${Date.now()}`,
    campaignId,
    type: "recommendation",
    title: `${typeEmoji[data.recommendationType]} New Recommendation`,
    message: `${data.title} - Could improve performance by ${data.estimatedImprovement.toFixed(
      1
    )}%`,
    priority: "normal",
    read: false,
    createdAt: Date.now(),
    data,
  };
}

/**
 * Create A/B test winner notification
 */
export function createABTestWinnerNotification(
  testId: string,
  data: ABTestWinnerData
): Notification {
  return {
    id: `winner-${testId}-${Date.now()}`,
    testId,
    type: "ab_test_winner",
    title: `🏆 A/B Test Complete!`,
    message: `${data.testName}: "${data.winnerVariation}" is the winner with ${data.improvementPercentage.toFixed(
      1
    )}% improvement`,
    priority: "high",
    read: false,
    createdAt: Date.now(),
    data,
  };
}

/**
 * Create campaign completed notification
 */
export function createCampaignCompletedNotification(
  campaignName: string,
  websiteName: string,
  totalVisits: number
): Notification {
  return {
    id: `completed-${campaignName}-${Date.now()}`,
    type: "campaign_completed",
    title: `✅ Campaign Complete!`,
    message: `${campaignName} on ${websiteName} has reached its target with ${totalVisits.toLocaleString()} total visits`,
    priority: "high",
    read: false,
    createdAt: Date.now(),
  };
}

/**
 * Check if notification should be sent based on quiet hours
 */
export function shouldSendNotification(
  preferences: any,
  priority: string
): boolean {
  // Always send urgent notifications
  if (priority === "urgent") {
    return true;
  }

  // Check quiet hours
  if (preferences.quietHours?.enabled) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const startTime = preferences.quietHours.startTime;
    const endTime = preferences.quietHours.endTime;

    // Simple time comparison (doesn't handle day boundaries)
    if (startTime < endTime) {
      if (currentTime >= startTime && currentTime < endTime) {
        return false;
      }
    } else {
      // Handles quiet hours that cross midnight
      if (currentTime >= startTime || currentTime < endTime) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        return true;
      }
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
    }
    return false;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("[NotificationService] Failed to request permissions:", error);
    return false;
  }
}

/**
 * Get notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  if (Platform.OS === "web") {
    if ("Notification" in window) {
      if (Notification.permission === "granted") return "granted";
      if (Notification.permission === "denied") return "denied";
      return "undetermined";
    }
    return "denied";
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch (error) {
    console.error(
      "[NotificationService] Failed to get permission status:",
      error
    );
    return "denied";
  }
}
