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
      // Use environment variables for email configuration
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
      const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const emailPort = parseInt(process.env.EMAIL_PORT || '587');
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;
      const emailFrom = process.env.EMAIL_FROM || emailUser || 'noreply@trafficbooster.app';

      if (!emailUser || !emailPassword) {
        console.warn('[EmailService] Email credentials not configured. Using mock transporter.');
        this.transporter = this.createMockTransporter();
        this.isConfigured = false;
        return;
      }

      if (emailProvider === 'sendgrid') {
        // SendGrid configuration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: emailPassword,
          },
        });
      } else {
        // Standard SMTP configuration
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
    const subject = `Your ${format.toUpperCase()} Export: ${reportName}`;
    const html = `
      <h2>Your Export is Ready</h2>
      <p>Hello,</p>
      <p>Your ${format.toUpperCase()} export <strong>${reportName}</strong> is ready for download.</p>
      <p>The file is attached to this email.</p>
      <p>Best regards,<br>Traffic Booster Pro Team</p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: `${reportName}.${format}`,
          content: reportContent,
          contentType,
        },
      ],
    });
  }

  /**
   * Send performance alert email
   */
  async sendPerformanceAlert(
    email: string,
    endpoint: string,
    metric: string,
    degradationPercent: number
  ): Promise<SendResult> {
    const subject = `Performance Alert: ${endpoint}`;
    const html = `
      <h2>Performance Degradation Detected</h2>
      <p>Hello,</p>
      <p>We detected a performance issue on your endpoint:</p>
      <ul>
        <li><strong>Endpoint:</strong> ${endpoint}</li>
        <li><strong>Metric:</strong> ${metric}</li>
        <li><strong>Degradation:</strong> ${degradationPercent}%</li>
      </ul>
      <p>Please investigate and take corrective action.</p>
      <p>Best regards,<br>Traffic Booster Pro Team</p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send forecast warning email
   */
  async sendForecastWarning(
    email: string,
    predicted: number,
    threshold: number
  ): Promise<SendResult> {
    const subject = 'Forecast Warning: Threshold Exceeded';
    const html = `
      <h2>Forecast Warning</h2>
      <p>Hello,</p>
      <p>Our forecast predicts that usage will exceed your threshold:</p>
      <ul>
        <li><strong>Predicted Usage:</strong> ${predicted}</li>
        <li><strong>Threshold:</strong> ${threshold}</li>
        <li><strong>Excess:</strong> ${predicted - threshold}</li>
      </ul>
      <p>Consider scaling your infrastructure or adjusting your limits.</p>
      <p>Best regards,<br>Traffic Booster Pro Team</p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send optimization recommendation email
   */
  async sendOptimizationRecommendation(
    email: string,
    type: string,
    savings: number,
    description: string
  ): Promise<SendResult> {
    const subject = `Optimization Opportunity: ${type}`;
    const html = `
      <h2>New Optimization Recommendation</h2>
      <p>Hello,</p>
      <p>We found an optimization opportunity for your infrastructure:</p>
      <ul>
        <li><strong>Type:</strong> ${type}</li>
        <li><strong>Estimated Savings:</strong> $${savings}</li>
        <li><strong>Description:</strong> ${description}</li>
      </ul>
      <p>Log in to your dashboard to review and implement this recommendation.</p>
      <p>Best regards,<br>Traffic Booster Pro Team</p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send test email
   */
  async sendTestEmail(email: string): Promise<SendResult> {
    const subject = 'Test Email from Traffic Booster Pro';
    const html = `
      <h2>Test Email</h2>
      <p>Hello,</p>
      <p>This is a test email from Traffic Booster Pro.</p>
      <p>If you received this email, your email configuration is working correctly.</p>
      <p>Best regards,<br>Traffic Booster Pro Team</p>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get email service status
   */
  getStatus(): {
    configured: boolean;
    provider: string;
    email: string | undefined;
  } {
    return {
      configured: this.isConfigured,
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      email: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    };
  }
}
