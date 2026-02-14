/**
 * Email Configuration Service
 * Handles email service setup and configuration
 */
export class EmailConfigService {
  private static emailService: 'sendgrid' | 'nodemailer' | 'mock' = 'mock';
  private static sendgridApiKey: string | null = null;
  private static nodemailerConfig: any = null;

  /**
   * Initialize email service
   * Supports SendGrid, Nodemailer, or mock implementation
   */
  static initialize(): void {
    const emailProvider = process.env.EMAIL_PROVIDER || 'mock';

    switch (emailProvider) {
      case 'sendgrid':
        this.emailService = 'sendgrid';
        this.sendgridApiKey = process.env.SENDGRID_API_KEY || null;
        if (!this.sendgridApiKey) {
          console.warn('[EmailConfig] SendGrid selected but SENDGRID_API_KEY not set, falling back to mock');
          this.emailService = 'mock';
        } else {
          console.log('[EmailConfig] Initialized with SendGrid');
        }
        break;

      case 'nodemailer':
        this.emailService = 'nodemailer';
        this.nodemailerConfig = {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASSWORD || '',
          },
          from: process.env.SMTP_FROM_EMAIL || 'noreply@trafficbooster.com',
        };

        if (!this.nodemailerConfig.auth.user || !this.nodemailerConfig.auth.pass) {
          console.warn('[EmailConfig] Nodemailer selected but SMTP credentials not set, falling back to mock');
          this.emailService = 'mock';
        } else {
          console.log('[EmailConfig] Initialized with Nodemailer');
        }
        break;

      default:
        this.emailService = 'mock';
        console.log('[EmailConfig] Using mock email service');
    }
  }

  /**
   * Get current email service type
   */
  static getEmailService(): 'sendgrid' | 'nodemailer' | 'mock' {
    return this.emailService;
  }

  /**
   * Get SendGrid API key
   */
  static getSendGridApiKey(): string | null {
    return this.sendgridApiKey;
  }

  /**
   * Get Nodemailer configuration
   */
  static getNodemailerConfig(): any {
    return this.nodemailerConfig;
  }

  /**
   * Check if email service is configured
   */
  static isConfigured(): boolean {
    return this.emailService !== 'mock';
  }
}
