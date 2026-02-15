import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * EmailService
 * Handles email sending for scheduled exports and notifications
 */
export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  private constructor() {
    this.initializeTransporter();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter(): void {
    try {
      // Check for SendGrid API key first (highest priority)
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      if (sendgridApiKey) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: sendgridApiKey,
          },
        });
        this.isConfigured = true;
        console.log('[EmailService] Initialized with SendGrid provider (API key)');
        return;
      }

      // Fall back to standard SMTP configuration
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
      const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const emailPort = parseInt(process.env.EMAIL_PORT || '587');
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;

      if (!emailUser || !emailPassword) {
        console.warn('[EmailService] Email credentials not configured. Using mock transporter.');
        this.transporter = this.createMockTransporter();
        this.isConfigured = false;
        return;
      }

      if (emailProvider === 'sendgrid') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: emailPassword,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: emailPort === 465,
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });
      }

      this.isConfigured = true;
      console.log(`[EmailService] Initialized with ${emailProvider} provider`);
    } catch (error) {
      console.error('[EmailService] Failed to initialize transporter:', error);
      this.transporter = this.createMockTransporter();
      this.isConfigured = false;
    }
  }

  /**
   * Create mock transporter for development/testing
   */
  private createMockTransporter(): nodemailer.Transporter {
    return {
      sendMail: async (mailOptions: any) => {
        console.log('[EmailService] Mock email sent:', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          timestamp: new Date().toISOString(),
        });
        return { messageId: `mock-${Date.now()}` };
      },
    } as any;
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<SendResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email service not initialized',
      };
    }

    try {
      const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@trafficbooster.app';

      const mailOptions = {
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`[EmailService] Email sent to ${options.to}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] Failed to send email:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send export report email
   */
  async sendExportReport(
    email: string,
    format: string,
    reportName: string,
    reportContent: Buffer | string,
    contentType: string
  ): Promise<SendResult> {
    return this.sendEmail({
      to: email,
      subject: `Your ${format.toUpperCase()} Export: ${reportName}`,
      html: `<p>Your ${format.toUpperCase()} export is ready for download.</p>`,
      attachments: [
        {
          filename: `${reportName}.${format}`,
          content: reportContent,
          contentType: contentType,
        },
      ],
    });
  }

  /**
   * Send performance alert email
   */
  async sendPerformanceAlert(data: {
    email: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: string;
  }): Promise<SendResult> {
    return this.sendEmail({
      to: data.email,
      subject: `Performance Alert: ${data.metric}`,
      html: `
        <h2>Performance Alert</h2>
        <p>Metric: <strong>${data.metric}</strong></p>
        <p>Current Value: <strong>${data.value}</strong></p>
        <p>Threshold: <strong>${data.threshold}</strong></p>
        <p>Time: ${new Date(data.timestamp).toLocaleString()}</p>
      `,
    });
  }

  /**
   * Send forecast warning email
   */
  async sendForecastWarning(data: {
    email: string;
    metric: string;
    forecastedValue: number;
    threshold: number;
    confidence: number;
    timestamp: string;
  }): Promise<SendResult> {
    return this.sendEmail({
      to: data.email,
      subject: `Forecast Warning: ${data.metric}`,
      html: `
        <h2>Forecast Warning</h2>
        <p>Metric: <strong>${data.metric}</strong></p>
        <p>Forecasted Value: <strong>${data.forecastedValue}</strong></p>
        <p>Threshold: <strong>${data.threshold}</strong></p>
        <p>Confidence: <strong>${(data.confidence * 100).toFixed(1)}%</strong></p>
        <p>Time: ${new Date(data.timestamp).toLocaleString()}</p>
      `,
    });
  }

  /**
   * Send optimization recommendation email
   */
  async sendOptimizationRecommendation(data: {
    email: string;
    recommendation: string;
    potentialSavings: string;
    priority: string;
    timestamp: string;
  }): Promise<SendResult> {
    return this.sendEmail({
      to: data.email,
      subject: `Optimization Opportunity: ${data.recommendation}`,
      html: `
        <h2>Optimization Recommendation</h2>
        <p>Recommendation: <strong>${data.recommendation}</strong></p>
        <p>Potential Savings: <strong>${data.potentialSavings}</strong></p>
        <p>Priority: <strong>${data.priority.toUpperCase()}</strong></p>
        <p>Time: ${new Date(data.timestamp).toLocaleString()}</p>
      `,
    });
  }

  /**
   * Send scheduled report email
   */
  async sendScheduledReport(data: {
    email: string;
    reportName: string;
    format: string;
    reportContent: Buffer | string;
    contentType: string;
  }): Promise<SendResult> {
    return this.sendExportReport(data.email, data.format, data.reportName, data.reportContent, data.contentType);
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}
