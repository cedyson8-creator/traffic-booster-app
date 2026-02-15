import { EmailService } from './email.service';
import { PushNotificationsService } from './push-notifications.service';

/**
 * Email Testing Service
 * Provides methods to test email delivery end-to-end
 */
export class EmailTestingService {
  constructor(
    private emailService: EmailService,
    private pushService: PushNotificationsService
  ) {}

  /**
   * Send a test email to verify SendGrid integration
   */
  async sendTestEmail(email: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.emailService.sendEmail({
        to: email,
        subject: 'Traffic Booster Pro - Test Email',
        html: `
          <h1>Test Email from Traffic Booster Pro</h1>
          <p>This is a test email to verify SendGrid integration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p>If you received this email, your email delivery is configured correctly!</p>
        `,
      });

      return {
        success: result.success,
        messageId: result.success ? 'email-sent' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a test performance alert email
   */
  async sendTestPerformanceAlert(email: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.emailService.sendPerformanceAlert({
        email,
        metric: '/api/checkout',
        value: 850,
        threshold: 500,
        timestamp: new Date().toISOString(),
      });

      return {
        success: result.success,
        messageId: result.success ? 'email-sent' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a test forecast warning email
   */
  async sendTestForecastWarning(email: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.emailService.sendForecastWarning({
        email,
        metric: 'traffic_volume',
        forecastedValue: 2500,
        threshold: 2000,
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      });

      return {
        success: result.success,
        messageId: result.success ? 'email-sent' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a test optimization recommendation email
   */
  async sendTestOptimizationRecommendation(email: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.emailService.sendOptimizationRecommendation({
        email,
        recommendation: 'Implement Redis caching for database queries',
        potentialSavings: '$1,200/month',
        priority: 'high',
        timestamp: new Date().toISOString(),
      });

      return {
        success: result.success,
        messageId: result.success ? 'email-sent' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get email delivery status
   */
  getEmailStatus(): { configured: boolean; provider: string; testEmail?: string } {
    const configured = this.emailService.isEmailConfigured();
    return {
      configured,
      provider: configured ? 'SendGrid' : 'Mock',
    };
  }

  /**
   * Send all test emails in sequence
   */
  async sendAllTestEmails(email: string): Promise<{
    testEmail: { success: boolean; messageId?: string; error?: string };
    performanceAlert: { success: boolean; messageId?: string; error?: string };
    forecastWarning: { success: boolean; messageId?: string; error?: string };
    optimizationRecommendation: { success: boolean; messageId?: string; error?: string };
  }> {
    return {
      testEmail: await this.sendTestEmail(email),
      performanceAlert: await this.sendTestPerformanceAlert(email),
      forecastWarning: await this.sendTestForecastWarning(email),
      optimizationRecommendation: await this.sendTestOptimizationRecommendation(email),
    };
  }
}
