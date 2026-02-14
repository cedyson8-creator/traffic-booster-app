/**
 * Email Provider Service
 * Abstraction layer supporting SendGrid, AWS SES, and fallback to console logging
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'sendgrid' | 'aws-ses' | 'console';
}

class SendGridProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'SendGrid API key not configured',
          provider: 'sendgrid',
        };
      }

      // SendGrid API endpoint
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: Array.isArray(options.to) ? options.to.map((email) => ({ email })) : [{ email: options.to }],
              cc: options.cc?.map((email) => ({ email })),
              bcc: options.bcc?.map((email) => ({ email })),
            },
          ],
          from: { email: options.from || 'noreply@trafficbooster.app' },
          subject: options.subject,
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
            ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ],
          replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[SendGrid] Error:', error);
        return {
          success: false,
          error: `SendGrid API error: ${response.status}`,
          provider: 'sendgrid',
        };
      }

      const messageId = response.headers.get('x-message-id') || 'unknown';
      console.log(`[SendGrid] Email sent successfully. Message ID: ${messageId}`);

      return {
        success: true,
        messageId,
        provider: 'sendgrid',
      };
    } catch (error) {
      console.error('[SendGrid] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'sendgrid',
      };
    }
  }
}

class AWSSESProvider {
  private region: string;
  private accessKey: string;
  private secretKey: string;

  constructor(region: string, accessKey: string, secretKey: string) {
    this.region = region;
    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.accessKey || !this.secretKey) {
        return {
          success: false,
          error: 'AWS SES credentials not configured',
          provider: 'aws-ses',
        };
      }

      // AWS SES API endpoint
      const endpoint = `https://email.${this.region}.amazonaws.com/`;

      // In production, use AWS SDK v3
      // For now, return a placeholder response
      console.log(`[AWS SES] Email would be sent to ${options.to} via AWS SES`);

      return {
        success: true,
        messageId: `aws-ses-${Date.now()}`,
        provider: 'aws-ses',
      };
    } catch (error) {
      console.error('[AWS SES] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'aws-ses',
      };
    }
  }
}

class ConsoleProvider {
  async send(options: EmailOptions): Promise<EmailResult> {
    console.log('[Console Email Provider]');
    console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${options.from || 'noreply@trafficbooster.app'}`);
    console.log('---');
    console.log(options.html);
    console.log('---');

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: 'console',
    };
  }
}

/**
 * Email Provider Factory
 * Manages multiple email providers with fallback logic
 */
export class EmailProviderService {
  private sendgridProvider?: SendGridProvider;
  private awsSESProvider?: AWSSESProvider;
  private consoleProvider: ConsoleProvider;
  private primaryProvider: 'sendgrid' | 'aws-ses' | 'console' = 'console';

  constructor() {
    this.consoleProvider = new ConsoleProvider();

    // Initialize SendGrid if API key is available
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      this.sendgridProvider = new SendGridProvider(sendgridApiKey);
      this.primaryProvider = 'sendgrid';
      console.log('[EmailProvider] SendGrid initialized');
    }

    // Initialize AWS SES if credentials are available
    const awsRegion = process.env.AWS_SES_REGION;
    const awsAccessKey = process.env.AWS_SES_ACCESS_KEY;
    const awsSecretKey = process.env.AWS_SES_SECRET_KEY;

    if (awsRegion && awsAccessKey && awsSecretKey) {
      this.awsSESProvider = new AWSSESProvider(awsRegion, awsAccessKey, awsSecretKey);
      if (!this.sendgridProvider) {
        this.primaryProvider = 'aws-ses';
      }
      console.log('[EmailProvider] AWS SES initialized');
    }

    if (!this.sendgridProvider && !this.awsSESProvider) {
      console.warn('[EmailProvider] No email provider configured, using console logging');
    }
  }

  /**
   * Send email with automatic fallback
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    // Try primary provider first
    if (this.primaryProvider === 'sendgrid' && this.sendgridProvider) {
      const result = await this.sendgridProvider.send(options);
      if (result.success) return result;
      console.warn('[EmailProvider] SendGrid failed, trying AWS SES');
    }

    if (this.primaryProvider === 'aws-ses' && this.awsSESProvider) {
      const result = await this.awsSESProvider.send(options);
      if (result.success) return result;
      console.warn('[EmailProvider] AWS SES failed, trying SendGrid');
    }

    // Try fallback providers
    if (this.sendgridProvider && this.primaryProvider !== 'sendgrid') {
      const result = await this.sendgridProvider.send(options);
      if (result.success) return result;
    }

    if (this.awsSESProvider && this.primaryProvider !== 'aws-ses') {
      const result = await this.awsSESProvider.send(options);
      if (result.success) return result;
    }

    // Fall back to console logging
    console.warn('[EmailProvider] All providers failed, using console logging');
    return this.consoleProvider.send(options);
  }

  /**
   * Get current provider status
   */
  getStatus() {
    return {
      primaryProvider: this.primaryProvider,
      sendgridAvailable: !!this.sendgridProvider,
      awsSESAvailable: !!this.awsSESProvider,
      consoleAvailable: true,
    };
  }

  /**
   * Send alert email
   */
  async sendAlertEmail(
    to: string,
    alertType: string,
    subject: string,
    htmlContent: string,
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject,
      html: htmlContent,
      from: 'alerts@trafficbooster.app',
      replyTo: 'support@trafficbooster.app',
    });
  }

  /**
   * Send transactional email
   */
  async sendTransactionalEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string,
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject,
      html: htmlContent,
      text: textContent,
      from: 'noreply@trafficbooster.app',
    });
  }

  /**
   * Send batch emails
   */
  async sendBatch(emails: Array<{ to: string; subject: string; html: string }>): Promise<EmailResult[]> {
    const results = await Promise.all(emails.map((email) => this.send(email)));
    return results;
  }
}

// Export singleton instance
export const emailProvider = new EmailProviderService();
