import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Mock Device for development
const Device = {
  isDevice: true,
};

export interface PushNotificationState {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isRegistered: boolean;
}

/**
 * Hook for managing push notifications
 * Handles token registration and notification listeners
 */
export function usePushNotifications(userId?: number) {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    isLoading: true,
    error: null,
    isRegistered: false,
  });

  useEffect(() => {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      } as any),
    });

    registerForPushNotifications();

    // Listen for notifications
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[PushNotifications] Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      subscription.remove();
    };
  }, [userId]);

  /**
   * Register for push notifications
   */
  const registerForPushNotifications = async () => {
    try {
      // Check if device supports notifications
      if (!Device || !Device.isDevice) {
        console.warn('[PushNotifications] Push notifications only work on physical devices');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Push notifications only work on physical devices',
        }));
        return;
      }

      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[PushNotifications] Failed to get push notification permissions');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Notification permissions not granted',
        }));
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });

      console.log('[PushNotifications] Got push token:', token.data);

      // Register token with backend if userId is provided
      if (userId) {
        await registerTokenWithBackend(userId, token.data);
      }

      setState(prev => ({
        ...prev,
        token: token.data,
        isLoading: false,
        isRegistered: true,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PushNotifications] Error registering for push notifications:', errorMessage);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  /**
   * Register token with backend
   */
  const registerTokenWithBackend = async (userId: number, token: string) => {
    try {
      const platform = Platform.OS as 'ios' | 'android' | 'web';

      const response = await fetch('/api/push-notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          platform,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register token: ${response.statusText}`);
      }

      console.log('[PushNotifications] Token registered with backend');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PushNotifications] Error registering token with backend:', errorMessage);
    }
  };

  /**
   * Handle notification response
   */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data;

    console.log('[PushNotifications] Handling notification:', data);

    // Handle different notification types
    if (data.type === 'performance_alert') {
      console.log('[PushNotifications] Performance alert:', data);
    } else if (data.type === 'forecast_warning') {
      console.log('[PushNotifications] Forecast warning:', data);
    } else if (data.type === 'optimization_recommendation') {
      console.log('[PushNotifications] Optimization recommendation:', data);
    } else if (data.type === 'export_ready') {
      console.log('[PushNotifications] Export ready:', data);
    }
  };

  /**
   * Send test notification
   */
  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from Traffic Booster Pro',
          data: { type: 'test' },
        },
        trigger: {
          type: 'time' as const,
          seconds: 2,
        } as any,
      });

      console.log('[PushNotifications] Test notification scheduled');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PushNotifications] Error sending test notification:', errorMessage);
    }
  };

  return {
    ...state,
    registerForPushNotifications,
    sendTestNotification,
  };
}
