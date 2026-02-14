/**
 * Payment Processor Service
 * Handles Stripe and PayPal payment processing with subscription management
 */

export interface PaymentMethod {
  id: string;
  organizationId: string;
  provider: 'stripe' | 'paypal';
  type: 'card' | 'bank' | 'paypal';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  paymentMethodId: string;
  provider: 'stripe' | 'paypal';
  providerSubscriptionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  organizationId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'void' | 'uncollectible';
  invoiceNumber: string;
  dueDate: Date;
  paidDate?: Date;
  provider: 'stripe' | 'paypal';
  providerInvoiceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  provider: 'stripe' | 'paypal';
  providerIntentId: string;
  clientSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentProcessorService {
  private paymentMethods: Map<string, PaymentMethod> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private paymentIntents: Map<string, PaymentIntent> = new Map();

  /**
   * Create payment method
   */
  createPaymentMethod(
    organizationId: string,
    provider: 'stripe' | 'paypal',
    type: 'card' | 'bank' | 'paypal',
    last4: string,
    expiryMonth?: number,
    expiryYear?: number,
  ): PaymentMethod {
    const method: PaymentMethod = {
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      provider,
      type,
      last4,
      expiryMonth,
      expiryYear,
      isDefault: this.paymentMethods.size === 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.paymentMethods.set(method.id, method);
    return method;
  }

  /**
   * Get payment method
   */
  getPaymentMethod(id: string): PaymentMethod | undefined {
    return this.paymentMethods.get(id);
  }

  /**
   * List payment methods for organization
   */
  listPaymentMethods(organizationId: string): PaymentMethod[] {
    return Array.from(this.paymentMethods.values()).filter(
      (m) => m.organizationId === organizationId,
    );
  }

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(organizationId: string, paymentMethodId: string): PaymentMethod | undefined {
    const methods = this.listPaymentMethods(organizationId);

    // Remove default from all
    methods.forEach((m) => {
      m.isDefault = false;
    });

    // Set new default
    const method = this.paymentMethods.get(paymentMethodId);
    if (method && method.organizationId === organizationId) {
      method.isDefault = true;
      method.updatedAt = new Date();
      return method;
    }

    return undefined;
  }

  /**
   * Delete payment method
   */
  deletePaymentMethod(id: string): boolean {
    return this.paymentMethods.delete(id);
  }

  /**
   * Create subscription
   */
  createSubscription(
    organizationId: string,
    planId: string,
    paymentMethodId: string,
    provider: 'stripe' | 'paypal',
  ): Subscription {
    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      paymentMethodId,
      provider,
      providerSubscriptionId: `${provider}_sub_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  /**
   * Get subscription
   */
  getSubscription(id: string): Subscription | undefined {
    return this.subscriptions.get(id);
  }

  /**
   * List subscriptions for organization
   */
  listSubscriptions(organizationId: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (s) => s.organizationId === organizationId,
    );
  }

  /**
   * Update subscription
   */
  updateSubscription(id: string, updates: Partial<Subscription>): Subscription | undefined {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;

    Object.assign(subscription, updates, { updatedAt: new Date() });
    return subscription;
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(id: string, immediate: boolean = false): Subscription | undefined {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    subscription.updatedAt = new Date();

    if (immediate) {
      subscription.currentPeriodEnd = new Date();
    }

    return subscription;
  }

  /**
   * Create payment intent
   */
  createPaymentIntent(
    organizationId: string,
    amount: number,
    currency: string = 'usd',
    provider: 'stripe' | 'paypal' = 'stripe',
  ): PaymentIntent {
    const intent: PaymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      amount,
      currency,
      status: 'requires_payment_method',
      provider,
      providerIntentId: `${provider}_pi_${Date.now()}`,
      clientSecret: provider === 'stripe' ? `${Math.random().toString(36).substr(2, 32)}_secret_${Math.random().toString(36).substr(2, 32)}` : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.paymentIntents.set(intent.id, intent);
    return intent;
  }

  /**
   * Get payment intent
   */
  getPaymentIntent(id: string): PaymentIntent | undefined {
    return this.paymentIntents.get(id);
  }

  /**
   * Confirm payment intent
   */
  confirmPaymentIntent(id: string, paymentMethodId: string): PaymentIntent | undefined {
    const intent = this.paymentIntents.get(id);
    if (!intent) return undefined;

    intent.status = 'processing';
    intent.updatedAt = new Date();

    // Simulate processing
    setTimeout(() => {
      const current = this.paymentIntents.get(id);
      if (current) {
        current.status = 'succeeded';
        current.updatedAt = new Date();
      }
    }, 1000);

    return intent;
  }

  /**
   * Create invoice
   */
  createInvoice(
    organizationId: string,
    subscriptionId: string,
    amount: number,
    currency: string = 'usd',
    provider: 'stripe' | 'paypal' = 'stripe',
  ): Invoice {
    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      subscriptionId,
      amount,
      currency,
      status: 'sent',
      invoiceNumber: `INV-${Date.now()}`,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      provider,
      providerInvoiceId: `${provider}_inv_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  /**
   * Get invoice
   */
  getInvoice(id: string): Invoice | undefined {
    return this.invoices.get(id);
  }

  /**
   * List invoices for organization
   */
  listInvoices(organizationId: string): Invoice[] {
    return Array.from(this.invoices.values()).filter(
      (i) => i.organizationId === organizationId,
    );
  }

  /**
   * Mark invoice as paid
   */
  markInvoiceAsPaid(id: string): Invoice | undefined {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    invoice.updatedAt = new Date();

    return invoice;
  }

  /**
   * Get billing summary
   */
  getBillingSummary(organizationId: string): {
    activeSubscriptions: number;
    totalMonthlyRecurring: number;
    upcomingInvoices: number;
    overdueInvoices: number;
    lastInvoiceDate?: Date;
  } {
    const subscriptions = this.listSubscriptions(organizationId);
    const invoices = this.listInvoices(organizationId);

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const upcomingInvoices = invoices.filter((i) => i.status === 'sent').length;
    const overdueInvoices = invoices.filter(
      (i) => i.status === 'sent' && i.dueDate < new Date(),
    ).length;

    const lastInvoice = invoices.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    return {
      activeSubscriptions,
      totalMonthlyRecurring: 0, // Would calculate from subscriptions
      upcomingInvoices,
      overdueInvoices,
      lastInvoiceDate: lastInvoice?.createdAt,
    };
  }

  /**
   * Get payment history
   */
  getPaymentHistory(organizationId: string, limit: number = 10): Invoice[] {
    return this.listInvoices(organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Validate payment method
   */
  validatePaymentMethod(last4: string, expiryMonth?: number, expiryYear?: number): boolean {
    if (!last4 || last4.length !== 4) return false;
    if (expiryMonth && (expiryMonth < 1 || expiryMonth > 12)) return false;
    if (expiryYear && expiryYear < new Date().getFullYear()) return false;
    return true;
  }

  /**
   * Get refund policy
   */
  getRefundPolicy(): {
    refundWindow: number;
    refundPercentage: number;
    supportedReasons: string[];
  } {
    return {
      refundWindow: 30, // 30 days
      refundPercentage: 100,
      supportedReasons: ['service_not_as_described', 'duplicate_charge', 'fraudulent', 'requested_by_customer'],
    };
  }

  /**
   * Export billing data
   */
  exportBillingData(organizationId: string, format: 'json' | 'csv'): string {
    const invoices = this.listInvoices(organizationId);
    const subscriptions = this.listSubscriptions(organizationId);

    if (format === 'json') {
      return JSON.stringify({ invoices, subscriptions }, null, 2);
    }

    // CSV format
    let csv = 'Invoice Number,Amount,Status,Created Date,Due Date\n';
    invoices.forEach((inv) => {
      csv += `${inv.invoiceNumber},${inv.amount},${inv.status},${inv.createdAt.toISOString()},${inv.dueDate.toISOString()}\n`;
    });

    return csv;
  }
}
