import Stripe from 'stripe';
import { StripePaymentService } from './stripe-payment.service';

/**
 * Stripe Webhook Handler Service
 * Processes webhook events from Stripe
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export class StripeWebhookService {
  /**
   * Verify and process Stripe webhook event
   */
  static async handleWebhookEvent(
    body: Buffer | string,
    signature: string,
    secret: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        secret
      );

      console.log(`[StripeWebhook] Processing event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);

        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

        case 'invoice.created':
          return await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);

        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);

        case 'invoice.payment_failed':
          return await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

        case 'charge.succeeded':
          return await this.handleChargeSucceeded(event.data.object as Stripe.Charge);

        case 'charge.failed':
          return await this.handleChargeFailed(event.data.object as Stripe.Charge);

        case 'payment_intent.succeeded':
          return await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);

        case 'payment_intent.payment_failed':
          return await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);

        default:
          console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
          return { success: true, message: `Unhandled event type: ${event.type}` };
      }
    } catch (error) {
      console.error('[StripeWebhook] Error handling webhook:', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  /**
   * Handle subscription created event
   */
  private static async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<{ success: boolean; message: string }> {
    try {
      const userId = parseInt(subscription.metadata?.userId || '0');
      if (!userId) {
        console.warn('[StripeWebhook] No userId in subscription metadata');
        return { success: false, message: 'No userId in metadata' };
      }

      console.log(`[StripeWebhook] Subscription created for user ${userId}`);
      return { success: true, message: 'Subscription created' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling subscription created:', error);
      return { success: false, message: 'Failed to handle subscription created' };
    }
  }

  /**
   * Handle subscription updated event
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<{ success: boolean; message: string }> {
    try {
      const userId = parseInt(subscription.metadata?.userId || '0');
      if (!userId) {
        return { success: false, message: 'No userId in metadata' };
      }

      console.log(`[StripeWebhook] Subscription updated for user ${userId}: status=${subscription.status}`);
      return { success: true, message: 'Subscription updated' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling subscription updated:', error);
      return { success: false, message: 'Failed to handle subscription updated' };
    }
  }

  /**
   * Handle subscription deleted event
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{ success: boolean; message: string }> {
    try {
      const userId = parseInt(subscription.metadata?.userId || '0');
      if (!userId) {
        return { success: false, message: 'No userId in metadata' };
      }

      console.log(`[StripeWebhook] Subscription deleted for user ${userId}`);
      return { success: true, message: 'Subscription deleted' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling subscription deleted:', error);
      return { success: false, message: 'Failed to handle subscription deleted' };
    }
  }

  /**
   * Handle invoice created event
   */
  private static async handleInvoiceCreated(invoice: Stripe.Invoice): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[StripeWebhook] Invoice created: ${invoice.id}`);
      return { success: true, message: 'Invoice created' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling invoice created:', error);
      return { success: false, message: 'Failed to handle invoice created' };
    }
  }

  /**
   * Handle invoice payment succeeded event
   */
  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<{ success: boolean; message: string }> {
    try {
      const customerId = invoice.customer as string;
      if (!customerId || !invoice.id) {
        return { success: false, message: 'Missing customer or invoice ID' };
      }

      console.log(`[StripeWebhook] Invoice payment succeeded: ${invoice.id}`);

      // Create invoice record in database
      // Note: Would need to fetch userId from customer ID
      return { success: true, message: 'Invoice payment succeeded' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling invoice payment succeeded:', error);
      return { success: false, message: 'Failed to handle invoice payment succeeded' };
    }
  }

  /**
   * Handle invoice payment failed event
   */
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[StripeWebhook] Invoice payment failed: ${invoice.id}`);
      // Send notification to user about failed payment
      return { success: true, message: 'Invoice payment failed' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling invoice payment failed:', error);
      return { success: false, message: 'Failed to handle invoice payment failed' };
    }
  }

  /**
   * Handle charge succeeded event
   */
  private static async handleChargeSucceeded(charge: Stripe.Charge): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[StripeWebhook] Charge succeeded: ${charge.id}, amount: ${charge.amount}`);
      return { success: true, message: 'Charge succeeded' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling charge succeeded:', error);
      return { success: false, message: 'Failed to handle charge succeeded' };
    }
  }

  /**
   * Handle charge failed event
   */
  private static async handleChargeFailed(charge: Stripe.Charge): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[StripeWebhook] Charge failed: ${charge.id}, reason: ${charge.failure_message}`);
      return { success: true, message: 'Charge failed' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling charge failed:', error);
      return { success: false, message: 'Failed to handle charge failed' };
    }
  }

  /**
   * Handle payment intent succeeded event
   */
  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[StripeWebhook] Payment intent succeeded: ${paymentIntent.id}`);
      return { success: true, message: 'Payment intent succeeded' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling payment intent succeeded:', error);
      return { success: false, message: 'Failed to handle payment intent succeeded' };
    }
  }

  /**
   * Handle payment intent failed event
   */
  private static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[StripeWebhook] Payment intent failed: ${paymentIntent.id}`);
      return { success: true, message: 'Payment intent failed' };
    } catch (error) {
      console.error('[StripeWebhook] Error handling payment intent failed:', error);
      return { success: false, message: 'Failed to handle payment intent failed' };
    }
  }
}
