import { describe, it, expect, beforeEach } from 'vitest';
import { I18nService } from '../services/i18n.service';
import { WebhookReplayService } from '../services/webhook-replay.service';
import { CustomAlertsService, AlertTrigger } from '../services/custom-alerts.service';

/**
 * Advanced Internationalization Tests
 */

describe('I18n Service', () => {
  let i18n: I18nService;

  beforeEach(() => {
    i18n = new I18nService();
  });

  it('should get translation for English', () => {
    i18n.setLanguage('en');
    const text = i18n.t('common.appName');
    expect(text).toBe('Traffic Booster Pro');
  });

  it('should get translation for Spanish', () => {
    i18n.setLanguage('es');
    const text = i18n.t('common.dashboard');
    expect(text).toBe('Panel de Control');
  });

  it('should get translation for French', () => {
    i18n.setLanguage('fr');
    const text = i18n.t('navigation.home');
    expect(text).toBe('Accueil');
  });

  it('should get translation for German', () => {
    i18n.setLanguage('de');
    const text = i18n.t('common.logout');
    expect(text).toBe('Abmelden');
  });

  it('should get translation for Japanese', () => {
    i18n.setLanguage('ja');
    const text = i18n.t('common.dashboard');
    expect(text).toBe('ダッシュボード');
  });

  it('should get translation for Chinese', () => {
    i18n.setLanguage('zh');
    const text = i18n.t('navigation.analytics');
    expect(text).toBe('分析');
  });

  it('should set and get current language', () => {
    i18n.setLanguage('fr');
    expect(i18n.getLanguage()).toBe('fr');
  });

  it('should get language config', () => {
    const config = i18n.getLanguageConfig('es');
    expect(config.code).toBe('es');
    expect(config.name).toBe('Spanish');
  });

  it('should get all supported languages', () => {
    const languages = i18n.getSupportedLanguages();
    expect(languages.length).toBe(6);
    expect(languages.some((l) => l.code === 'en')).toBe(true);
  });

  it('should format date according to language', () => {
    const date = new Date('2026-02-14');
    const formatted = i18n.formatDate(date, 'en');
    expect(formatted).toBeTruthy();
  });

  it('should format time according to language', () => {
    const date = new Date();
    const formatted = i18n.formatTime(date, 'en');
    expect(formatted).toBeTruthy();
  });

  it('should format number according to language', () => {
    const formatted = i18n.formatNumber(1234.56, 'en');
    expect(formatted).toContain('1');
  });

  it('should format currency according to language', () => {
    const formatted = i18n.formatCurrency(99.99, 'USD', 'en');
    expect(formatted).toBeTruthy();
  });

  it('should get all translations for a language', () => {
    const translations = i18n.getAllTranslations('en');
    expect(translations).toBeTruthy();
    expect(translations.common).toBeTruthy();
  });

  it('should add custom translation', () => {
    i18n.addTranslation('en', 'custom.test', 'Test Value');
    const text = i18n.t('custom.test', 'en');
    expect(text).toBe('Test Value');
  });

  it('should check if language is supported', () => {
    expect(i18n.isLanguageSupported('en')).toBe(true);
    expect(i18n.isLanguageSupported('pt')).toBe(false);
  });

  it('should get language by code', () => {
    const lang = i18n.getLanguageByCode('de');
    expect(lang).toBeTruthy();
    expect(lang?.code).toBe('de');
  });

  it('should export translations as JSON', () => {
    const json = i18n.exportTranslations('en');
    const data = JSON.parse(json);
    expect(data.common).toBeTruthy();
  });

  it('should get translation statistics', () => {
    const stats = i18n.getTranslationStats();
    expect(stats.en).toBeGreaterThan(0);
    expect(stats.es).toBeGreaterThan(0);
  });
});

/**
 * Webhook Replay Tests
 */

describe('Webhook Replay Service', () => {
  let replay: WebhookReplayService;

  beforeEach(() => {
    replay = new WebhookReplayService();
  });

  it('should replay a webhook', async () => {
    const log = await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test', id: '123' },
    });

    expect(log).toBeTruthy();
    expect(log.webhookId).toBe('webhook_123');
    expect(log.status).toMatch(/success|failed/);
  });

  it('should replay with edited payload', async () => {
    const log = await replay.replayWithEditedPayload(
      'webhook_123',
      { event: 'test' },
      { event: 'test_edited', data: 'modified' },
    );

    expect(log).toBeTruthy();
    expect(log.replayPayload.event).toBe('test_edited');
  });

  it('should get replay history', async () => {
    await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test1' },
    });
    await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test2' },
    });

    const history = replay.getReplayHistory('webhook_123');
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it('should get replay log by ID', async () => {
    const log = await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test' },
    });

    const retrieved = replay.getReplayLog(log.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved?.id).toBe(log.id);
  });

  it('should batch replay webhooks', async () => {
    const results = await replay.batchReplay(['webhook_1', 'webhook_2', 'webhook_3']);
    expect(results.length).toBe(3);
  });

  it('should schedule replay for later', () => {
    const replayId = replay.scheduleReplay('webhook_123', { event: 'test' }, 100);
    expect(replayId).toBeTruthy();
  });

  it('should get replay statistics', async () => {
    await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test' },
    });

    const stats = replay.getReplayStats('webhook_123');
    expect(stats.totalReplays).toBeGreaterThan(0);
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
  });

  it('should validate webhook payload', () => {
    const valid = replay.validatePayload({ event: 'test' });
    expect(valid.valid).toBe(true);

    const invalid = replay.validatePayload({});
    expect(invalid.valid).toBe(false);
  });

  it('should get queue status', () => {
    const status = replay.getQueueStatus();
    expect(status.pending).toBeGreaterThanOrEqual(0);
    expect(status.processing).toBeGreaterThanOrEqual(0);
  });

  it('should export replay logs as JSON', async () => {
    await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test' },
    });

    const json = replay.exportReplayLogs('webhook_123');
    const data = JSON.parse(json);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should filter replay logs', async () => {
    await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test' },
    });

    const logs = replay.getReplayLogsFiltered('webhook_123', 'success');
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should clear replay logs', async () => {
    await replay.replayWebhook({
      webhookId: 'webhook_123',
      payload: { event: 'test' },
    });

    replay.clearReplayLogs('webhook_123');
    const history = replay.getReplayHistory('webhook_123');
    expect(history.length).toBe(0);
  });
});

/**
 * Custom Alerts Tests
 */

describe('Custom Alerts Service', () => {
  let alerts: CustomAlertsService;

  beforeEach(() => {
    alerts = new CustomAlertsService();
  });

  it('should create an alert', () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    expect(alert).toBeTruthy();
    expect(alert.name).toBe('High Error Rate');
  });

  it('should update an alert', () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const updated = alerts.updateAlert(alert.id, { threshold: 10 });
    expect(updated?.threshold).toBe(10);
  });

  it('should delete an alert', () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const deleted = alerts.deleteAlert(alert.id);
    expect(deleted).toBe(true);
  });

  it('should get alert by ID', () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const retrieved = alerts.getAlert(alert.id);
    expect(retrieved?.id).toBe(alert.id);
  });

  it('should get all alerts for organization', () => {
    alerts.createAlert({
      organizationId: 'org_123',
      name: 'Alert 1',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const allAlerts = alerts.getAlerts('org_123');
    expect(allAlerts.length).toBeGreaterThan(0);
  });

  it('should toggle alert enabled state', () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const toggled = alerts.toggleAlert(alert.id);
    expect(toggled?.enabled).toBe(false);
  });

  it('should trigger alert when threshold exceeded', async () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 0,
      testMode: false,
    });

    const event = await alerts.triggerAlert(alert.id, 10, 'Error rate exceeded');
    expect(event).toBeTruthy();
    expect(event?.currentValue).toBe(10);
  });

  it('should not trigger alert when threshold not exceeded', async () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const event = await alerts.triggerAlert(alert.id, 3, 'Error rate low');
    expect(event).toBeNull();
  });

  it('should acknowledge alert event', async () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 0,
      testMode: false,
    });

    const event = await alerts.triggerAlert(alert.id, 10, 'Error rate exceeded');
    if (event) {
      const acked = alerts.acknowledgeEvent(event.id, 'user_123');
      expect(acked?.acknowledged).toBe(true);
    }
  });

  it('should test alert', async () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 0,
      testMode: true,
    });

    const result = await alerts.testAlert(alert.id);
    expect(result).toBe(true);
  });

  it('should get alert statistics', () => {
    alerts.createAlert({
      organizationId: 'org_123',
      name: 'Alert 1',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const stats = alerts.getAlertStats('org_123');
    expect(stats.totalAlerts).toBeGreaterThan(0);
    expect(stats.enabledAlerts).toBeGreaterThanOrEqual(0);
  });

  it('should get alert events', async () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 0,
      testMode: false,
    });

    await alerts.triggerAlert(alert.id, 10, 'Error rate exceeded');
    const events = alerts.getAlertEvents('org_123');
    expect(events.length).toBeGreaterThan(0);
  });

  it('should export alerts as JSON', () => {
    alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 15,
      testMode: false,
    });

    const json = alerts.exportAlerts('org_123');
    const data = JSON.parse(json);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should clear old events', async () => {
    const alert = alerts.createAlert({
      organizationId: 'org_123',
      name: 'High Error Rate',
      trigger: 'error_rate' as AlertTrigger,
      threshold: 5,
      operator: '>',
      channels: ['email'],
      enabled: true,
      cooldownMinutes: 0,
      testMode: false,
    });

    await alerts.triggerAlert(alert.id, 10, 'Error rate exceeded');
    const deleted = alerts.clearOldEvents('org_123', 0);
    expect(deleted).toBeGreaterThanOrEqual(0);
  });
});
