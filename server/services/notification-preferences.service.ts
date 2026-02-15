/**
 * Notification Preferences Service
 * Manages user notification preferences across different channels and alert types
 */

export type NotificationChannel = 'email' | 'slack' | 'discord' | 'webhook';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertTriggerType = 'error_rate' | 'api_latency' | 'webhook_failure' | 'quota_exceeded' | 'failed_auth';

export interface ChannelPreference {
  channel: NotificationChannel;
  enabled: boolean;
  severities: AlertSeverity[];
  triggerTypes: AlertTriggerType[];
  quietHours?: {
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface NotificationPreference {
  id: string;
  userId: string;
  organizationId: string;
  channels: ChannelPreference[];
  defaultChannel: NotificationChannel;
  digestEnabled: boolean;
  digestFrequency: 'hourly' | 'daily' | 'weekly';
  unsubscribeFromAll: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationPreferencesService {
  private static instance: NotificationPreferencesService;
  private preferences: Map<string, NotificationPreference> = new Map();

  private constructor() {}

  static getInstance(): NotificationPreferencesService {
    if (!NotificationPreferencesService.instance) {
      NotificationPreferencesService.instance = new NotificationPreferencesService();
    }
    return NotificationPreferencesService.instance;
  }

  static resetInstance(): void {
    NotificationPreferencesService.instance = undefined as any;
  }

  /**
   * Create notification preferences for user
   */
  createPreferences(
    userId: string,
    organizationId: string
  ): NotificationPreference {
    const prefs: NotificationPreference = {
      id: `prefs-${Date.now()}`,
      userId,
      organizationId,
      channels: this.getDefaultChannelPreferences(),
      defaultChannel: 'email',
      digestEnabled: true,
      digestFrequency: 'daily',
      unsubscribeFromAll: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.preferences.set(prefs.id, prefs);
    return prefs;
  }

  /**
   * Get default channel preferences
   */
  private getDefaultChannelPreferences(): ChannelPreference[] {
    return [
      {
        channel: 'email',
        enabled: true,
        severities: ['high', 'critical'],
        triggerTypes: ['error_rate', 'quota_exceeded', 'failed_auth'],
        rateLimit: { maxPerHour: 10, maxPerDay: 50 },
      },
      {
        channel: 'slack',
        enabled: false,
        severities: ['critical'],
        triggerTypes: ['error_rate', 'quota_exceeded'],
      },
      {
        channel: 'discord',
        enabled: false,
        severities: ['high', 'critical'],
        triggerTypes: ['error_rate', 'failed_auth'],
      },
      {
        channel: 'webhook',
        enabled: false,
        severities: ['critical'],
        triggerTypes: [],
      },
    ];
  }

  /**
   * Get preferences by user ID
   */
  getPreferencesByUserId(userId: string): NotificationPreference | undefined {
    return Array.from(this.preferences.values()).find(p => p.userId === userId);
  }

  /**
   * Get preferences by organization ID
   */
  getPreferencesByOrganizationId(organizationId: string): NotificationPreference[] {
    return Array.from(this.preferences.values()).filter(p => p.organizationId === organizationId);
  }

  /**
   * Update channel preference
   */
  updateChannelPreference(
    prefsId: string,
    channel: NotificationChannel,
    updates: Partial<ChannelPreference>
  ): NotificationPreference | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    const channelIndex = prefs.channels.findIndex(c => c.channel === channel);
    if (channelIndex === -1) return null;

    prefs.channels[channelIndex] = {
      ...prefs.channels[channelIndex],
      ...updates,
      channel, // Don't allow channel to be changed
    };

    prefs.updatedAt = new Date();
    return prefs;
  }

  /**
   * Enable/disable notification channel
   */
  setChannelEnabled(prefsId: string, channel: NotificationChannel, enabled: boolean): NotificationPreference | null {
    return this.updateChannelPreference(prefsId, channel, { enabled });
  }

  /**
   * Set which severities trigger notifications for a channel
   */
  setChannelSeverities(
    prefsId: string,
    channel: NotificationChannel,
    severities: AlertSeverity[]
  ): NotificationPreference | null {
    return this.updateChannelPreference(prefsId, channel, { severities });
  }

  /**
   * Set which trigger types send notifications for a channel
   */
  setChannelTriggerTypes(
    prefsId: string,
    channel: NotificationChannel,
    triggerTypes: AlertTriggerType[]
  ): NotificationPreference | null {
    return this.updateChannelPreference(prefsId, channel, { triggerTypes });
  }

  /**
   * Set quiet hours for a channel
   */
  setQuietHours(
    prefsId: string,
    channel: NotificationChannel,
    startTime: string,
    endTime: string
  ): NotificationPreference | null {
    return this.updateChannelPreference(prefsId, channel, {
      quietHours: { startTime, endTime },
    });
  }

  /**
   * Set rate limit for a channel
   */
  setRateLimit(
    prefsId: string,
    channel: NotificationChannel,
    maxPerHour: number,
    maxPerDay: number
  ): NotificationPreference | null {
    return this.updateChannelPreference(prefsId, channel, {
      rateLimit: { maxPerHour, maxPerDay },
    });
  }

  /**
   * Check if notification should be sent based on preferences
   */
  shouldSendNotification(
    prefsId: string,
    channel: NotificationChannel,
    severity: AlertSeverity,
    triggerType: AlertTriggerType
  ): boolean {
    const prefs = this.preferences.get(prefsId);
    if (!prefs || prefs.unsubscribeFromAll) return false;

    const channelPref = prefs.channels.find(c => c.channel === channel);
    if (!channelPref || !channelPref.enabled) return false;

    const severityMatch = channelPref.severities.includes(severity);
    const triggerMatch = channelPref.triggerTypes.length === 0 || channelPref.triggerTypes.includes(triggerType);

    return severityMatch && triggerMatch;
  }

  /**
   * Check if current time is within quiet hours
   */
  isWithinQuietHours(prefsId: string, channel: NotificationChannel): boolean {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return false;

    const channelPref = prefs.channels.find(c => c.channel === channel);
    if (!channelPref || !channelPref.quietHours) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return currentTime >= channelPref.quietHours.startTime && currentTime <= channelPref.quietHours.endTime;
  }

  /**
   * Set default notification channel
   */
  setDefaultChannel(prefsId: string, channel: NotificationChannel): NotificationPreference | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    prefs.defaultChannel = channel;
    prefs.updatedAt = new Date();
    return prefs;
  }

  /**
   * Enable/disable digest emails
   */
  setDigestEnabled(prefsId: string, enabled: boolean): NotificationPreference | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    prefs.digestEnabled = enabled;
    prefs.updatedAt = new Date();
    return prefs;
  }

  /**
   * Set digest frequency
   */
  setDigestFrequency(
    prefsId: string,
    frequency: 'hourly' | 'daily' | 'weekly'
  ): NotificationPreference | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    prefs.digestFrequency = frequency;
    prefs.updatedAt = new Date();
    return prefs;
  }

  /**
   * Unsubscribe from all notifications
   */
  unsubscribeFromAll(prefsId: string): NotificationPreference | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    prefs.unsubscribeFromAll = true;
    prefs.updatedAt = new Date();
    return prefs;
  }

  /**
   * Resubscribe to notifications
   */
  resubscribe(prefsId: string): NotificationPreference | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    prefs.unsubscribeFromAll = false;
    prefs.updatedAt = new Date();
    return prefs;
  }

  /**
   * Get enabled channels
   */
  getEnabledChannels(prefsId: string): NotificationChannel[] {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return [];

    return prefs.channels
      .filter(c => c.enabled)
      .map(c => c.channel);
  }

  /**
   * Get notification summary
   */
  getNotificationSummary(prefsId: string): Record<string, unknown> {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return {};

    return {
      userId: prefs.userId,
      organizationId: prefs.organizationId,
      unsubscribedFromAll: prefs.unsubscribeFromAll,
      defaultChannel: prefs.defaultChannel,
      digestEnabled: prefs.digestEnabled,
      digestFrequency: prefs.digestFrequency,
      enabledChannels: this.getEnabledChannels(prefsId),
      channelDetails: prefs.channels.map(c => ({
        channel: c.channel,
        enabled: c.enabled,
        severities: c.severities,
        triggerTypes: c.triggerTypes,
        hasQuietHours: !!c.quietHours,
        hasRateLimit: !!c.rateLimit,
      })),
    };
  }

  /**
   * Export preferences as JSON
   */
  exportPreferences(prefsId: string): string | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    return JSON.stringify(prefs, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  importPreferences(jsonData: string): NotificationPreference | null {
    try {
      const imported = JSON.parse(jsonData) as NotificationPreference;
      this.preferences.set(imported.id, imported);
      return imported;
    } catch {
      return null;
    }
  }

  /**
   * Reset preferences to defaults
   */
  resetToDefaults(prefsId: string): NotificationPreference | null {
    const prefs = this.preferences.get(prefsId);
    if (!prefs) return null;

    prefs.channels = this.getDefaultChannelPreferences();
    prefs.defaultChannel = 'email';
    prefs.digestEnabled = true;
    prefs.digestFrequency = 'daily';
    prefs.unsubscribeFromAll = false;
    prefs.updatedAt = new Date();

    return prefs;
  }

  /**
   * Get total preferences count
   */
  getTotalCount(): number {
    return this.preferences.size;
  }

  /**
   * Delete preferences
   */
  deletePreferences(prefsId: string): boolean {
    return this.preferences.delete(prefsId);
  }
}

export const notificationPreferencesService = NotificationPreferencesService.getInstance();
