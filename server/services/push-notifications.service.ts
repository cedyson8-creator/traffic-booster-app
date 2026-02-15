// Note: expo-server-sdk is optional - install with: npm install expo-server-sdk
// For now, we'll create a mock implementation
interface Expo {
  sendPushNotificationsAsync(messages: any[]): Promise<any[]>;
}

const Notifications = {
  Expo: class {
    accessToken: string;
    constructor(config: any) {
      this.accessToken = config.accessToken;
    }
    async sendPushNotificationsAsync(messages: any[]) {
      return messages.map(m => ({ id: `ticket-${Date.now()}` }));
    }
  } as any,
  isExpoPushToken: (token: string) => token.startsWith('ExponentPushToken'),
};
import { EventEmitter } from 'events';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | 'custom';
  badge?: number;
}

export interface UserPushToken {
  userId: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface PushResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

/**
 * PushNotificationsService
 * Manages push notifications via Expo Push Notifications
 */
export class PushNotificationsService extends EventEmitter {
  private static instance: PushNotificationsService;
  private notificationClient: any;
  private userTokens: Map<number, UserPushToken[]> = new Map();
  private sendingQueue: Array<{
    userId: number;
    payload: PushNotificationPayload;
    timestamp: Date;
  }> = [];

  private constructor() {
    super();
    this.notificationClient = new Notifications.Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    });
  }

  static getInstance(): PushNotificationsService {
    if (!PushNotificationsService.instance) {
      PushNotificationsService.instance = new PushNotificationsService();
    }
    return PushNotificationsService.instance;
  }

  /**
   * Register push token for user
   */
  registerToken(userId: number, token: string, platform: 'ios' | 'android' | 'web'): UserPushToken {
    if (!token.startsWith('ExponentPushToken')) {
      console.warn(`[PushNotifications] Invalid Expo push token: ${token}`);
    }

    const pushToken: UserPushToken = {
      userId,
      token,
      platform,
      isActive: true,
      createdAt: new Date(),
    };

    if (!this.userTokens.has(userId)) {
      this.userTokens.set(userId, []);
    }

    // Remove duplicate tokens
    const tokens = this.userTokens.get(userId)!;
    const existingIndex = tokens.findIndex((t: UserPushToken) => t.token === token);
    if (existingIndex >= 0) {
      tokens[existingIndex] = pushToken;
    } else {
      tokens.push(pushToken);
    }

    this.emit('token:registered', pushToken);
    console.log(`[PushNotifications] Token registered for user ${userId} (${platform})`);

    return pushToken;
  }

  /**
   * Unregister push token
   */
  unregisterToken(userId: number, token: string): boolean {
    const tokens = this.userTokens.get(userId);
    if (!tokens) return false;

      const index = tokens.findIndex((t: UserPushToken) => t.token === token);
    if (index >= 0) {
      tokens.splice(index, 1);
      this.emit('token:unregistered', { userId, token });
      console.log(`[PushNotifications] Token unregistered for user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Get push tokens for user
   */
  getUserTokens(userId: number): UserPushToken[] {
    return this.userTokens.get(userId) || [];
  }

  /**
   * Send push notification to user
   */
  async sendNotification(userId: number, payload: PushNotificationPayload): Promise<PushResult> {
    const tokens = this.getUserTokens(userId);

    if (tokens.length === 0) {
      console.warn(`[PushNotifications] No push tokens found for user ${userId}`);
      return {
        success: false,
        error: 'No push tokens registered',
      };
    }

    try {
      const messages = tokens
        .filter((t: UserPushToken) => t.isActive)
        .map((t: UserPushToken) => ({
          to: t.token,
          sound: payload.sound || 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          badge: payload.badge,
        }));

      if (messages.length === 0) {
        return {
          success: false,
          error: 'No active push tokens',
        };
      }

      const tickets = await this.notificationClient.sendPushNotificationsAsync(messages);

      // Track first successful ticket
      const successTicket = tickets.find((t: any) => !('error' in t));
      if (successTicket && 'id' in successTicket) {
        this.sendingQueue.push({
          userId,
          payload,
          timestamp: new Date(),
        });

        this.emit('notification:sent', { userId, payload, ticketId: successTicket.id });
        console.log(`[PushNotifications] Notification sent to user ${userId}: ${successTicket.id}`);

        return {
          success: true,
          ticketId: successTicket.id,
        };
      }

      const errorTicket = tickets.find((t: any) => 'error' in t);
      if (errorTicket && 'error' in errorTicket) {
        const error = errorTicket.error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[PushNotifications] Failed to send notification: ${errorMessage}`);

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: 'Unknown error',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PushNotifications] Error sending notification: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send performance alert notification
   */
  async sendPerformanceAlert(
    userId: number,
    endpoint: string,
    metric: string,
    degradationPercent: number
  ): Promise<PushResult> {
    return this.sendNotification(userId, {
      title: 'Performance Alert',
      body: `${metric} degraded by ${degradationPercent}% on ${endpoint}`,
      data: {
        type: 'performance_alert',
        endpoint,
        metric,
        degradationPercent,
      },
      sound: 'default',
    });
  }

  /**
   * Send forecast warning notification
   */
  async sendForecastWarning(userId: number, predicted: number, threshold: number): Promise<PushResult> {
    return this.sendNotification(userId, {
      title: 'Forecast Warning',
      body: `Predicted usage (${predicted}) exceeds threshold (${threshold})`,
      data: {
        type: 'forecast_warning',
        predicted,
        threshold,
      },
      sound: 'default',
    });
  }

  /**
   * Send optimization recommendation notification
   */
  async sendOptimizationRecommendation(
    userId: number,
    type: string,
    savings: number
  ): Promise<PushResult> {
    return this.sendNotification(userId, {
      title: 'Optimization Opportunity',
      body: `${type} can save approximately $${savings}`,
      data: {
        type: 'optimization_recommendation',
        recommendationType: type,
        savings,
      },
      sound: 'default',
    });
  }

  /**
   * Send export ready notification
   */
  async sendExportReady(userId: number, format: string, email: string): Promise<PushResult> {
    return this.sendNotification(userId, {
      title: 'Export Ready',
      body: `Your ${format.toUpperCase()} export has been sent to ${email}`,
      data: {
        type: 'export_ready',
        format,
        email,
      },
      sound: 'default',
    });
  }

  /**
   * Get sending queue (for debugging)
   */
  getSendingQueue() {
    return this.sendingQueue;
  }

  /**
   * Clear sending queue
   */
  clearQueue(): void {
    this.sendingQueue = [];
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    userCount: number;
    totalTokens: number;
    queuedNotifications: number;
  } {
    let totalTokens = 0;
    for (const tokens of this.userTokens.values()) {
      totalTokens += tokens.length;
    }

    return {
      configured: !!process.env.EXPO_ACCESS_TOKEN,
      userCount: this.userTokens.size,
      totalTokens,
      queuedNotifications: this.sendingQueue.length,
    };
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): void {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const [userId, tokens] of this.userTokens.entries()) {
      const typedTokens = tokens as UserPushToken[];
      const activeTokens = typedTokens.filter((t: UserPushToken) => {
        if (!t.lastUsedAt) return true;
        return t.lastUsedAt > thirtyDaysAgo;
      });

      if (activeTokens.length === 0) {
        this.userTokens.delete(userId);
      } else if (activeTokens.length < typedTokens.length) {
        this.userTokens.set(userId, activeTokens);
      }
    }

    console.log('[PushNotifications] Cleaned up expired tokens');
  }

  /**
   * Get all user tokens (for admin/debugging)
   */
  getAllTokens(): Map<number, UserPushToken[]> {
    return this.userTokens;
  }
}
