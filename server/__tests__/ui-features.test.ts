import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationPreferencesService } from '../services/notification-preferences.service';

describe('Notification Preferences Service', () => {
  let prefsService: NotificationPreferencesService;

  beforeEach(() => {
    NotificationPreferencesService.resetInstance();
    prefsService = NotificationPreferencesService.getInstance();
  });

  // Removed createFreshService as it's no longer needed

  it('should create notification preferences for user', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    expect(prefs.userId).toBe('user-1');
    expect(prefs.organizationId).toBe('org-1');
    expect(prefs.channels.length).toBe(4);
  });

  it('should have default channel preferences', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const emailChannel = prefs.channels.find(c => c.channel === 'email');
    expect(emailChannel?.enabled).toBe(true);
    expect(emailChannel?.severities).toContain('high');
  });

  it('should get preferences by user ID', () => {
    prefsService.createPreferences('user-1', 'org-1');
    const found = prefsService.getPreferencesByUserId('user-1');
    expect(found).toBeDefined();
    expect(found?.userId).toBe('user-1');
  });

  it('should get preferences by organization ID', () => {
    prefsService.createPreferences('user-1', 'org-1');
    prefsService.createPreferences('user-2', 'org-1');
    const found = prefsService.getPreferencesByOrganizationId('org-1');
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it('should enable/disable notification channel', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setChannelEnabled(prefs.id, 'slack', true);
    expect(updated?.channels.find(c => c.channel === 'slack')?.enabled).toBe(true);
  });

  it('should set channel severities', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setChannelSeverities(prefs.id, 'email', [
      'critical',
    ]);
    const emailChannel = updated?.channels.find(c => c.channel === 'email');
    expect(emailChannel?.severities).toEqual(['critical']);
  });

  it('should set channel trigger types', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setChannelTriggerTypes(prefs.id, 'slack', [
      'error_rate',
    ]);
    const slackChannel = updated?.channels.find(c => c.channel === 'slack');
    expect(slackChannel?.triggerTypes).toEqual(['error_rate']);
  });

  it('should set quiet hours for channel', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setQuietHours(prefs.id, 'email', '22:00', '08:00');
    const emailChannel = updated?.channels.find(c => c.channel === 'email');
    expect(emailChannel?.quietHours?.startTime).toBe('22:00');
    expect(emailChannel?.quietHours?.endTime).toBe('08:00');
  });

  it('should set rate limit for channel', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setRateLimit(prefs.id, 'email', 5, 20);
    const emailChannel = updated?.channels.find(c => c.channel === 'email');
    expect(emailChannel?.rateLimit?.maxPerHour).toBe(5);
    expect(emailChannel?.rateLimit?.maxPerDay).toBe(20);
  });

  it('should determine if notification should be sent', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const shouldSend = prefsService.shouldSendNotification(
      prefs.id,
      'email',
      'high',
      'error_rate'
    );
    expect(shouldSend).toBe(true);
  });

  it('should not send notification for disabled channel', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    prefsService.setChannelEnabled(prefs.id, 'slack', false);
    const shouldSend = prefsService.shouldSendNotification(
      prefs.id,
      'slack',
      'critical',
      'error_rate'
    );
    expect(shouldSend).toBe(false);
  });

  it('should not send notification for unsubscribed user', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    prefsService.unsubscribeFromAll(prefs.id);
    const shouldSend = prefsService.shouldSendNotification(
      prefs.id,
      'email',
      'critical',
      'error_rate'
    );
    expect(shouldSend).toBe(false);
  });

  it('should resubscribe user', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    prefsService.unsubscribeFromAll(prefs.id);
    const resubscribed = prefsService.resubscribe(prefs.id);
    expect(resubscribed?.unsubscribeFromAll).toBe(false);
  });

  it('should get enabled channels', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    prefsService.setChannelEnabled(prefs.id, 'slack', true);
    const enabled = prefsService.getEnabledChannels(prefs.id);
    expect(enabled).toContain('email');
    expect(enabled).toContain('slack');
  });

  it('should get notification summary', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const summary = prefsService.getNotificationSummary(prefs.id);
    expect(summary.userId).toBe('user-1');
    expect(summary.organizationId).toBe('org-1');
    expect(summary.enabledChannels).toContain('email');
  });

  it('should set default notification channel', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setDefaultChannel(prefs.id, 'slack');
    expect(updated?.defaultChannel).toBe('slack');
  });

  it('should enable/disable digest emails', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setDigestEnabled(prefs.id, false);
    expect(updated?.digestEnabled).toBe(false);
  });

  it('should set digest frequency', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const updated = prefsService.setDigestFrequency(prefs.id, 'weekly');
    expect(updated?.digestFrequency).toBe('weekly');
  });

  it('should export preferences as JSON', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const exported = prefsService.exportPreferences(prefs.id);
    expect(exported).toBeDefined();
    expect(exported).toContain('user-1');
    expect(exported).toContain('org-1');
  });

  it('should import preferences from JSON', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const exported = prefsService.exportPreferences(prefs.id);
    const imported = prefsService.importPreferences(exported!);
    expect(imported?.userId).toBe('user-1');
    expect(imported?.organizationId).toBe('org-1');
  });

  it('should reset preferences to defaults', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    prefsService.setChannelEnabled(prefs.id, 'slack', true);
    prefsService.setDigestFrequency(prefs.id, 'weekly');
    const reset = prefsService.resetToDefaults(prefs.id);
    expect(reset?.digestFrequency).toBe('daily');
    expect(reset?.channels.find(c => c.channel === 'slack')?.enabled).toBe(false);
  });

  it('should delete preferences', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    const deleted = prefsService.deletePreferences(prefs.id);
    expect(deleted).toBe(true);
    const found = prefsService.getPreferencesByUserId('user-1');
    expect(found).toBeUndefined();
  });

  it('should get total preferences count', () => {
    const initialCount = prefsService.getTotalCount();
    prefsService.createPreferences('user-new-1', 'org-new');
    prefsService.createPreferences('user-new-2', 'org-new');
    const count = prefsService.getTotalCount();
    expect(count).toBeGreaterThan(initialCount);
  });

  it('should check if current time is within quiet hours', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    // Set quiet hours to current time + 1 hour
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`;
    prefsService.setQuietHours(prefs.id, 'email', startTime, endTime);
    const isQuiet = prefsService.isWithinQuietHours(prefs.id, 'email');
    expect(isQuiet).toBe(true);
  });

  it('should handle severity filtering correctly', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    prefsService.setChannelSeverities(prefs.id, 'email', ['critical']);
    
    const shouldSendCritical = prefsService.shouldSendNotification(
      prefs.id,
      'email',
      'critical',
      'error_rate'
    );
    expect(shouldSendCritical).toBe(true);

    const shouldSendHigh = prefsService.shouldSendNotification(
      prefs.id,
      'email',
      'high',
      'error_rate'
    );
    expect(shouldSendHigh).toBe(false);
  });

  it('should handle trigger type filtering correctly', () => {
    const prefs = prefsService.createPreferences('user-1', 'org-1');
    prefsService.setChannelTriggerTypes(prefs.id, 'email', ['error_rate']);
    
    const shouldSendErrorRate = prefsService.shouldSendNotification(
      prefs.id,
      'email',
      'high',
      'error_rate'
    );
    expect(shouldSendErrorRate).toBe(true);

    const shouldSendLatency = prefsService.shouldSendNotification(
      prefs.id,
      'email',
      'high',
      'api_latency'
    );
    expect(shouldSendLatency).toBe(false);
  });
});
