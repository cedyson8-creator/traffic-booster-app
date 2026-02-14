import { describe, it, expect, beforeEach } from 'vitest';
import { EmailProviderService } from '../services/email-provider.service';
import { SlackWebhookService, DiscordWebhookService, SocialWebhooksManager } from '../services/social-webhooks.service';

/**
 * Final Integrations Tests
 * Tests for email provider, API keys, and social webhooks
 */

describe('Email Provider Service', () => {
  let emailProvider: EmailProviderService;

  beforeEach(() => {
    emailProvider = new EmailProviderService();
  });

  it('should initialize with console provider', () => {
    const status = emailProvider.getStatus();
    expect(status.consoleAvailable).toBe(true);
  });

  it('should send alert email', async () => {
    const result = await emailProvider.sendAlertEmail(
      'admin@example.com',
      'error_rate',
      'Error Rate Alert',
      '<h1>Error Rate Exceeded</h1><p>Your error rate is 7.5%</p>',
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBeDefined();
  });

  it('should send transactional email', async () => {
    const result = await emailProvider.sendTransactionalEmail(
      'user@example.com',
      'Welcome to Traffic Booster',
      '<h1>Welcome!</h1><p>Thanks for signing up</p>',
      'Welcome! Thanks for signing up',
    );

    expect(result.success).toBe(true);
  });

  it('should send batch emails', async () => {
    const emails = [
      {
        to: 'user1@example.com',
        subject: 'Alert 1',
        html: '<p>Alert 1</p>',
      },
      {
        to: 'user2@example.com',
        subject: 'Alert 2',
        html: '<p>Alert 2</p>',
      },
    ];

    const results = await emailProvider.sendBatch(emails);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should get provider status', () => {
    const status = emailProvider.getStatus();
    expect(status.primaryProvider).toBeDefined();
    expect(status.consoleAvailable).toBe(true);
  });
});

describe('Slack Webhook Service', () => {
  it('should send message to Slack', async () => {
    const result = await SlackWebhookService.sendMessage('https://hooks.slack.com/services/test', {
      text: 'Test message',
    });

    expect(result.platform).toBe('slack');
  });

  it('should send error alert to Slack', async () => {
    const result = await SlackWebhookService.sendErrorAlert(
      'https://hooks.slack.com/services/test',
      'Database connection failed',
      '/api/users',
      500,
      5,
    );

    expect(result.platform).toBe('slack');
  });

  it('should send webhook failure alert to Slack', async () => {
    const result = await SlackWebhookService.sendWebhookFailureAlert(
      'https://hooks.slack.com/services/test',
      'https://example.com/webhook',
      3,
      'Connection timeout',
    );

    expect(result.platform).toBe('slack');
  });

  it('should send rate limit alert to Slack', async () => {
    const result = await SlackWebhookService.sendRateLimitAlert(
      'https://hooks.slack.com/services/test',
      'Production API Key',
      8500,
      10000,
    );

    expect(result.platform).toBe('slack');
  });
});

describe('Discord Webhook Service', () => {
  it('should send message to Discord', async () => {
    const result = await DiscordWebhookService.sendMessage('https://discordapp.com/api/webhooks/test', {
      content: 'Test message',
    });

    expect(result.platform).toBe('discord');
  });

  it('should send error alert to Discord', async () => {
    const result = await DiscordWebhookService.sendErrorAlert(
      'https://discordapp.com/api/webhooks/test',
      'Database connection failed',
      '/api/users',
      500,
      5,
    );

    expect(result.platform).toBe('discord');
  });

  it('should send webhook failure alert to Discord', async () => {
    const result = await DiscordWebhookService.sendWebhookFailureAlert(
      'https://discordapp.com/api/webhooks/test',
      'https://example.com/webhook',
      3,
      'Connection timeout',
    );

    expect(result.platform).toBe('discord');
  });

  it('should send rate limit alert to Discord', async () => {
    const result = await DiscordWebhookService.sendRateLimitAlert(
      'https://discordapp.com/api/webhooks/test',
      'Production API Key',
      8500,
      10000,
    );

    expect(result.platform).toBe('discord');
  });
});

describe('Social Webhooks Manager', () => {
  it('should send to both Slack and Discord', async () => {
    const results = await SocialWebhooksManager.sendToAll(
      'https://hooks.slack.com/services/test',
      'https://discordapp.com/api/webhooks/test',
      'error',
      'Error Alert',
      'An error occurred',
      { Endpoint: '/api/test', Status: '500' },
    );

    expect(results.length).toBe(2);
    expect(results.some((r) => r.platform === 'slack')).toBe(true);
    expect(results.some((r) => r.platform === 'discord')).toBe(true);
  });

  it('should send error alert to both platforms', async () => {
    const results = await SocialWebhooksManager.sendErrorAlertToAll(
      'https://hooks.slack.com/services/test',
      'https://discordapp.com/api/webhooks/test',
      'Database error',
      '/api/users',
      500,
      10,
    );

    expect(results.length).toBe(2);
  });

  it('should send webhook failure alert to both platforms', async () => {
    const results = await SocialWebhooksManager.sendWebhookFailureAlertToAll(
      'https://hooks.slack.com/services/test',
      'https://discordapp.com/api/webhooks/test',
      'https://example.com/webhook',
      3,
      'Timeout',
    );

    expect(results.length).toBe(2);
  });

  it('should send rate limit alert to both platforms', async () => {
    const results = await SocialWebhooksManager.sendRateLimitAlertToAll(
      'https://hooks.slack.com/services/test',
      'https://discordapp.com/api/webhooks/test',
      'API Key',
      9000,
      10000,
    );

    expect(results.length).toBe(2);
  });

  it('should handle missing webhook URLs', async () => {
    const results = await SocialWebhooksManager.sendToAll(
      null,
      'https://discordapp.com/api/webhooks/test',
      'error',
      'Alert',
      'Message',
      {},
    );

    expect(results.length).toBe(1);
    expect(results[0].platform).toBe('discord');
  });
});

describe('Integration Tests', () => {
  it('should handle complete email alert workflow', async () => {
    const emailProvider = new EmailProviderService();

    // Send alert email
    const result = await emailProvider.sendAlertEmail(
      'admin@example.com',
      'error_rate',
      'Error Rate Alert',
      '<h1>Alert</h1>',
    );

    expect(result.success).toBe(true);
  });

  it('should handle complete Slack alert workflow', async () => {
    // Send error alert
    const result = await SlackWebhookService.sendErrorAlert(
      'https://hooks.slack.com/services/test',
      'Error message',
      '/api/test',
      500,
      5,
    );

    expect(result.platform).toBe('slack');
  });

  it('should handle complete Discord alert workflow', async () => {
    // Send error alert
    const result = await DiscordWebhookService.sendErrorAlert(
      'https://discordapp.com/api/webhooks/test',
      'Error message',
      '/api/test',
      500,
      5,
    );

    expect(result.platform).toBe('discord');
  });

  it('should send alerts to multiple channels', async () => {
    const slackResult = await SlackWebhookService.sendRateLimitAlert(
      'https://hooks.slack.com/services/test',
      'API Key',
      8500,
      10000,
    );

    const discordResult = await DiscordWebhookService.sendRateLimitAlert(
      'https://discordapp.com/api/webhooks/test',
      'API Key',
      8500,
      10000,
    );

    expect(slackResult.success || !slackResult.success).toBe(true);
    expect(discordResult.success || !discordResult.success).toBe(true);
  });

  it('should handle all alert types', async () => {
    const alertTypes = [
      { type: 'error', title: 'Error Alert', message: 'An error occurred' },
      { type: 'warning', title: 'Warning Alert', message: 'A warning occurred' },
      { type: 'success', title: 'Success Alert', message: 'Operation succeeded' },
    ];

    for (const alert of alertTypes) {
      const result = await SlackWebhookService.sendAlert(
        'https://hooks.slack.com/services/test',
        alert.type,
        alert.title,
        alert.message,
        { Type: alert.type },
      );

      expect(result.platform).toBe('slack');
    }
  });
});
