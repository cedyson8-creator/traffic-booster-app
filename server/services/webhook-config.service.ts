import crypto from 'crypto';

/**
 * Webhook Configuration Service
 * Handles webhook setup and verification for SendGrid and Nodemailer
 */

interface WebhookConfig {
  provider: 'sendgrid' | 'nodemailer' | 'mailgun' | 'aws-ses';
  apiKey?: string;
  webhookUrl: string;
  signingSecret?: string;
  enabled: boolean;
}

class WebhookConfigService {
  private configs: Map<string, WebhookConfig> = new Map();

  /**
   * Initialize webhook configuration for a provider
   */
  initializeProvider(provider: 'sendgrid' | 'nodemailer' | 'mailgun' | 'aws-ses', config: WebhookConfig) {
    this.configs.set(provider, config);
    console.log(`[WebhookConfig] Initialized ${provider} webhook configuration`);
  }

  /**
   * Get webhook configuration for a provider
   */
  getConfig(provider: string): WebhookConfig | null {
    return this.configs.get(provider) || null;
  }

  /**
   * Verify SendGrid webhook signature
   * SendGrid uses HMAC-SHA256 verification
   */
  verifySendGridSignature(
    timestamp: string,
    signature: string,
    body: string,
    signingSecret: string
  ): boolean {
    try {
      const computedSignature = crypto
        .createHmac('sha256', signingSecret)
        .update(`${timestamp}${body}`)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      console.error('[WebhookConfig] SendGrid signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify Mailgun webhook signature
   * Mailgun uses HMAC-SHA256 with different format
   */
  verifyMailgunSignature(
    timestamp: string,
    token: string,
    signature: string,
    signingSecret: string
  ): boolean {
    try {
      const computedSignature = crypto
        .createHmac('sha256', signingSecret)
        .update(`${timestamp}${token}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      console.error('[WebhookConfig] Mailgun signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get webhook URL for a provider
   */
  getWebhookUrl(provider: string): string | null {
    const config = this.getConfig(provider);
    return config?.webhookUrl || null;
  }

  /**
   * Check if webhook is enabled for a provider
   */
  isWebhookEnabled(provider: string): boolean {
    const config = this.getConfig(provider);
    return config?.enabled || false;
  }

  /**
   * Generate webhook signing secret for local testing
   */
  generateSigningSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Parse SendGrid webhook event
   */
  parseSendGridEvent(body: any) {
    return {
      email: body.email,
      event: body.event,
      timestamp: body.timestamp,
      messageId: body['message-id'],
      metadata: {
        userAgent: body['user-agent'],
        ipAddress: body.ip,
        url: body.url,
      },
    };
  }

  /**
   * Parse Mailgun webhook event
   */
  parseMailgunEvent(body: any) {
    const event = body['event-data'];
    return {
      email: event.recipient,
      event: event.event,
      timestamp: event.timestamp,
      messageId: event['message']['headers']['message-id'],
      metadata: {
        userAgent: event['user-agent'],
        ipAddress: event.ip,
        url: event.url,
      },
    };
  }

  /**
   * Parse AWS SES webhook event (SNS format)
   */
  parseAwsSesEvent(body: any) {
    const message = JSON.parse(body.Message);
    const eventType = message.eventType;

    return {
      email: message.mail.destination[0],
      event: eventType.toLowerCase(),
      timestamp: message.mail.timestamp,
      messageId: message.mail.messageId,
      metadata: {
        sendingAccountId: message.mail.sendingAccountId,
        bounce: message.bounce,
        complaint: message.complaint,
      },
    };
  }
}

export const webhookConfigService = new WebhookConfigService();

// Initialize with environment variables
if (process.env.SENDGRID_API_KEY) {
  webhookConfigService.initializeProvider('sendgrid', {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    webhookUrl: process.env.SENDGRID_WEBHOOK_URL || '/api/webhooks/sendgrid',
    signingSecret: process.env.SENDGRID_SIGNING_SECRET,
    enabled: true,
  });
}

if (process.env.MAILGUN_API_KEY) {
  webhookConfigService.initializeProvider('mailgun', {
    provider: 'mailgun',
    apiKey: process.env.MAILGUN_API_KEY,
    webhookUrl: process.env.MAILGUN_WEBHOOK_URL || '/api/webhooks/mailgun',
    signingSecret: process.env.MAILGUN_SIGNING_SECRET,
    enabled: true,
  });
}

if (process.env.AWS_SES_REGION) {
  webhookConfigService.initializeProvider('aws-ses', {
    provider: 'aws-ses',
    webhookUrl: process.env.AWS_SES_WEBHOOK_URL || '/api/webhooks/aws-ses',
    enabled: true,
  });
}
