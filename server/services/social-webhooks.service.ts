/**
 * Social Webhooks Service
 * Integrations for Slack and Discord webhook delivery
 */

interface SlackMessage {
  text?: string;
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string };
    fields?: Array<{ type: string; text: string }>;
  }>;
  attachments?: Array<{
    color: string;
    title: string;
    text: string;
    fields: Array<{ title: string; value: string; short: boolean }>;
    ts: number;
  }>;
}

interface DiscordMessage {
  content?: string;
  embeds?: Array<{
    title: string;
    description: string;
    color: number;
    fields: Array<{ name: string; value: string; inline: boolean }>;
    timestamp: string;
  }>;
}

interface WebhookDeliveryResult {
  success: boolean;
  platform: 'slack' | 'discord';
  statusCode?: number;
  error?: string;
  timestamp: string;
}

/**
 * Slack Webhook Service
 */
export class SlackWebhookService {
  /**
   * Send message to Slack webhook
   */
  static async sendMessage(webhookUrl: string, message: SlackMessage): Promise<WebhookDeliveryResult> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Slack] Error:', error);
        return {
          success: false,
          platform: 'slack',
          statusCode: response.status,
          error: `Slack API error: ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      console.log('[Slack] Message sent successfully');
      return {
        success: true,
        platform: 'slack',
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Slack] Error sending message:', error);
      return {
        success: false,
        platform: 'slack',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Send alert to Slack
   */
  static async sendAlert(
    webhookUrl: string,
    alertType: string,
    title: string,
    message: string,
    details: Record<string, string>,
  ): Promise<WebhookDeliveryResult> {
    const color = this.getAlertColor(alertType);

    const slackMessage: SlackMessage = {
      attachments: [
        {
          color,
          title,
          text: message,
          fields: Object.entries(details).map(([key, value]) => ({
            title: key,
            value,
            short: true,
          })),
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return this.sendMessage(webhookUrl, slackMessage);
  }

  /**
   * Send error alert to Slack
   */
  static async sendErrorAlert(
    webhookUrl: string,
    errorMessage: string,
    endpoint: string,
    statusCode: number,
    errorCount: number,
  ): Promise<WebhookDeliveryResult> {
    return this.sendAlert(
      webhookUrl,
      'error',
      '🚨 Error Alert',
      `An error occurred on your API`,
      {
        'Error Message': errorMessage,
        Endpoint: endpoint,
        'Status Code': statusCode.toString(),
        'Error Count': errorCount.toString(),
        Timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Send webhook failure alert to Slack
   */
  static async sendWebhookFailureAlert(
    webhookUrl: string,
    webhookUrl_: string,
    failureCount: number,
    lastError: string,
  ): Promise<WebhookDeliveryResult> {
    return this.sendAlert(
      webhookUrl,
      'warning',
      '⚠️ Webhook Failure Alert',
      `Your webhook is failing to deliver`,
      {
        'Webhook URL': webhookUrl_,
        'Failure Count': failureCount.toString(),
        'Last Error': lastError,
        Timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Send rate limit alert to Slack
   */
  static async sendRateLimitAlert(
    webhookUrl: string,
    keyName: string,
    usage: number,
    limit: number,
  ): Promise<WebhookDeliveryResult> {
    return this.sendAlert(
      webhookUrl,
      'warning',
      '⏱️ Rate Limit Alert',
      `Your API key is approaching the rate limit`,
      {
        'Key Name': keyName,
        Usage: `${usage} / ${limit}`,
        'Usage Percentage': `${((usage / limit) * 100).toFixed(1)}%`,
        Timestamp: new Date().toISOString(),
      },
    );
  }

  private static getAlertColor(alertType: string): string {
    switch (alertType) {
      case 'error':
        return '#EF4444'; // Red
      case 'warning':
        return '#F59E0B'; // Amber
      case 'success':
        return '#22C55E'; // Green
      default:
        return '#3B82F6'; // Blue
    }
  }
}

/**
 * Discord Webhook Service
 */
export class DiscordWebhookService {
  /**
   * Send message to Discord webhook
   */
  static async sendMessage(webhookUrl: string, message: DiscordMessage): Promise<WebhookDeliveryResult> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Discord] Error:', error);
        return {
          success: false,
          platform: 'discord',
          statusCode: response.status,
          error: `Discord API error: ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      console.log('[Discord] Message sent successfully');
      return {
        success: true,
        platform: 'discord',
        statusCode: 204,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Discord] Error sending message:', error);
      return {
        success: false,
        platform: 'discord',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Send alert to Discord
   */
  static async sendAlert(
    webhookUrl: string,
    alertType: string,
    title: string,
    message: string,
    details: Record<string, string>,
  ): Promise<WebhookDeliveryResult> {
    const color = this.getAlertColor(alertType);

    const discordMessage: DiscordMessage = {
      embeds: [
        {
          title,
          description: message,
          color,
          fields: Object.entries(details).map(([key, value]) => ({
            name: key,
            value,
            inline: true,
          })),
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return this.sendMessage(webhookUrl, discordMessage);
  }

  /**
   * Send error alert to Discord
   */
  static async sendErrorAlert(
    webhookUrl: string,
    errorMessage: string,
    endpoint: string,
    statusCode: number,
    errorCount: number,
  ): Promise<WebhookDeliveryResult> {
    return this.sendAlert(
      webhookUrl,
      'error',
      '🚨 Error Alert',
      `An error occurred on your API`,
      {
        'Error Message': errorMessage,
        Endpoint: endpoint,
        'Status Code': statusCode.toString(),
        'Error Count': errorCount.toString(),
        Timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Send webhook failure alert to Discord
   */
  static async sendWebhookFailureAlert(
    webhookUrl: string,
    webhookUrl_: string,
    failureCount: number,
    lastError: string,
  ): Promise<WebhookDeliveryResult> {
    return this.sendAlert(
      webhookUrl,
      'warning',
      '⚠️ Webhook Failure Alert',
      `Your webhook is failing to deliver`,
      {
        'Webhook URL': webhookUrl_,
        'Failure Count': failureCount.toString(),
        'Last Error': lastError,
        Timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Send rate limit alert to Discord
   */
  static async sendRateLimitAlert(
    webhookUrl: string,
    keyName: string,
    usage: number,
    limit: number,
  ): Promise<WebhookDeliveryResult> {
    return this.sendAlert(
      webhookUrl,
      'warning',
      '⏱️ Rate Limit Alert',
      `Your API key is approaching the rate limit`,
      {
        'Key Name': keyName,
        Usage: `${usage} / ${limit}`,
        'Usage Percentage': `${((usage / limit) * 100).toFixed(1)}%`,
        Timestamp: new Date().toISOString(),
      },
    );
  }

  private static getAlertColor(alertType: string): number {
    switch (alertType) {
      case 'error':
        return 0xef4444; // Red
      case 'warning':
        return 0xf59e0b; // Amber
      case 'success':
        return 0x22c55e; // Green
      default:
        return 0x3b82f6; // Blue
    }
  }
}

/**
 * Social Webhooks Manager
 * Unified interface for Slack and Discord integrations
 */
export class SocialWebhooksManager {
  /**
   * Send alert to both Slack and Discord
   */
  static async sendToAll(
    slackWebhookUrl: string | null,
    discordWebhookUrl: string | null,
    alertType: string,
    title: string,
    message: string,
    details: Record<string, string>,
  ): Promise<WebhookDeliveryResult[]> {
    const results: WebhookDeliveryResult[] = [];

    if (slackWebhookUrl) {
      const result = await SlackWebhookService.sendAlert(slackWebhookUrl, alertType, title, message, details);
      results.push(result);
    }

    if (discordWebhookUrl) {
      const result = await DiscordWebhookService.sendAlert(discordWebhookUrl, alertType, title, message, details);
      results.push(result);
    }

    return results;
  }

  /**
   * Send error alert to both platforms
   */
  static async sendErrorAlertToAll(
    slackWebhookUrl: string | null,
    discordWebhookUrl: string | null,
    errorMessage: string,
    endpoint: string,
    statusCode: number,
    errorCount: number,
  ): Promise<WebhookDeliveryResult[]> {
    const results: WebhookDeliveryResult[] = [];

    if (slackWebhookUrl) {
      const result = await SlackWebhookService.sendErrorAlert(
        slackWebhookUrl,
        errorMessage,
        endpoint,
        statusCode,
        errorCount,
      );
      results.push(result);
    }

    if (discordWebhookUrl) {
      const result = await DiscordWebhookService.sendErrorAlert(
        discordWebhookUrl,
        errorMessage,
        endpoint,
        statusCode,
        errorCount,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Send webhook failure alert to both platforms
   */
  static async sendWebhookFailureAlertToAll(
    slackWebhookUrl: string | null,
    discordWebhookUrl: string | null,
    webhookUrl: string,
    failureCount: number,
    lastError: string,
  ): Promise<WebhookDeliveryResult[]> {
    const results: WebhookDeliveryResult[] = [];

    if (slackWebhookUrl) {
      const result = await SlackWebhookService.sendWebhookFailureAlert(
        slackWebhookUrl,
        webhookUrl,
        failureCount,
        lastError,
      );
      results.push(result);
    }

    if (discordWebhookUrl) {
      const result = await DiscordWebhookService.sendWebhookFailureAlert(
        discordWebhookUrl,
        webhookUrl,
        failureCount,
        lastError,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Send rate limit alert to both platforms
   */
  static async sendRateLimitAlertToAll(
    slackWebhookUrl: string | null,
    discordWebhookUrl: string | null,
    keyName: string,
    usage: number,
    limit: number,
  ): Promise<WebhookDeliveryResult[]> {
    const results: WebhookDeliveryResult[] = [];

    if (slackWebhookUrl) {
      const result = await SlackWebhookService.sendRateLimitAlert(slackWebhookUrl, keyName, usage, limit);
      results.push(result);
    }

    if (discordWebhookUrl) {
      const result = await DiscordWebhookService.sendRateLimitAlert(discordWebhookUrl, keyName, usage, limit);
      results.push(result);
    }

    return results;
  }
}
