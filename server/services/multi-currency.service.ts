/**
 * Multi-Currency Service
 * Handles currency conversion, exchange rates, and regional tax calculation
 */

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface TaxRate {
  country: string;
  region?: string;
  taxType: 'VAT' | 'GST' | 'Sales Tax' | 'Other';
  rate: number;
  description: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  regions: string[];
}

export interface PriceConversion {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  tax: number;
  taxRate: number;
  total: number;
  timestamp: Date;
}

export class MultiCurrencyService {
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private taxRates: Map<string, TaxRate> = new Map();
  private currencyConfigs: Map<string, CurrencyConfig> = new Map();
  private conversionHistory: PriceConversion[] = [];

  constructor() {
    this.initializeCurrencies();
    this.initializeTaxRates();
    this.loadExchangeRates();
  }

  /**
   * Initialize supported currencies
   */
  private initializeCurrencies(): void {
    const currencies: CurrencyConfig[] = [
      { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, regions: ['US', 'CA'] },
      { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, regions: ['DE', 'FR', 'IT', 'ES'] },
      { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, regions: ['GB', 'UK'] },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, regions: ['JP'] },
      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2, regions: ['AU'] },
      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2, regions: ['CA'] },
      { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2, regions: ['CH'] },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, regions: ['CN'] },
      { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, regions: ['IN'] },
      { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2, regions: ['MX'] },
    ];

    currencies.forEach((config) => {
      this.currencyConfigs.set(config.code, config);
    });
  }

  /**
   * Initialize tax rates by region
   */
  private initializeTaxRates(): void {
    const taxRates: TaxRate[] = [
      // Europe - VAT
      { country: 'DE', taxType: 'VAT', rate: 0.19, description: 'German VAT' },
      { country: 'FR', taxType: 'VAT', rate: 0.20, description: 'French VAT' },
      { country: 'IT', taxType: 'VAT', rate: 0.22, description: 'Italian VAT' },
      { country: 'ES', taxType: 'VAT', rate: 0.21, description: 'Spanish VAT' },
      { country: 'GB', taxType: 'VAT', rate: 0.20, description: 'UK VAT' },
      { country: 'CH', taxType: 'VAT', rate: 0.077, description: 'Swiss VAT' },
      // Asia-Pacific - GST
      { country: 'AU', taxType: 'GST', rate: 0.10, description: 'Australian GST' },
      { country: 'JP', taxType: 'Sales Tax', rate: 0.10, description: 'Japanese Sales Tax' },
      { country: 'IN', taxType: 'GST', rate: 0.18, description: 'Indian GST' },
      // North America - Sales Tax
      { country: 'US', region: 'CA', taxType: 'Sales Tax', rate: 0.0725, description: 'California Sales Tax' },
      { country: 'US', region: 'NY', taxType: 'Sales Tax', rate: 0.04, description: 'New York Sales Tax' },
      { country: 'US', region: 'TX', taxType: 'Sales Tax', rate: 0.0625, description: 'Texas Sales Tax' },
      { country: 'CA', taxType: 'GST', rate: 0.05, description: 'Canadian GST' },
      { country: 'MX', taxType: 'VAT', rate: 0.16, description: 'Mexican VAT' },
      // China
      { country: 'CN', taxType: 'VAT', rate: 0.13, description: 'Chinese VAT' },
    ];

    taxRates.forEach((rate) => {
      const key = rate.region ? `${rate.country}_${rate.region}` : rate.country;
      this.taxRates.set(key, rate);
    });
  }

  /**
   * Load exchange rates (mock data - in production, fetch from API)
   */
  private loadExchangeRates(): void {
    const rates = [
      { from: 'USD', to: 'EUR', rate: 0.92 },
      { from: 'USD', to: 'GBP', rate: 0.79 },
      { from: 'USD', to: 'JPY', rate: 149.5 },
      { from: 'USD', to: 'AUD', rate: 1.53 },
      { from: 'USD', to: 'CAD', rate: 1.36 },
      { from: 'USD', to: 'CHF', rate: 0.88 },
      { from: 'USD', to: 'CNY', rate: 7.24 },
      { from: 'USD', to: 'INR', rate: 83.12 },
      { from: 'USD', to: 'MXN', rate: 17.05 },
      { from: 'EUR', to: 'USD', rate: 1.087 },
      { from: 'EUR', to: 'GBP', rate: 0.86 },
      { from: 'GBP', to: 'USD', rate: 1.266 },
      { from: 'GBP', to: 'EUR', rate: 1.163 },
    ];

    rates.forEach((r) => {
      const key = `${r.from}_${r.to}`;
      this.exchangeRates.set(key, {
        ...r,
        timestamp: new Date(),
        source: 'mock',
      });
    });
  }

  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(from: string, to: string): number {
    if (from === to) return 1;

    const key = `${from}_${to}`;
    const rate = this.exchangeRates.get(key);

    if (!rate) {
      // Try reverse rate
      const reverseKey = `${to}_${from}`;
      const reverseRate = this.exchangeRates.get(reverseKey);
      if (reverseRate) {
        return 1 / reverseRate.rate;
      }
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }

    return rate.rate;
  }

  /**
   * Convert amount between currencies
   */
  convertCurrency(amount: number, from: string, to: string): number {
    const rate = this.getExchangeRate(from, to);
    return amount * rate;
  }

  /**
   * Get tax rate for a region
   */
  getTaxRate(country: string, region?: string): TaxRate | undefined {
    const key = region ? `${country}_${region}` : country;
    return this.taxRates.get(key);
  }

  /**
   * Calculate price with tax
   */
  calculatePriceWithTax(amount: number, country: string, region?: string): { subtotal: number; tax: number; total: number; taxRate: number } {
    const taxRate = this.getTaxRate(country, region);
    const taxPercentage = taxRate?.rate || 0;
    const tax = amount * taxPercentage;
    const total = amount + tax;

    return {
      subtotal: amount,
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      taxRate: taxPercentage,
    };
  }

  /**
   * Convert price and apply tax
   */
  convertAndApplyTax(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    country: string,
    region?: string,
  ): PriceConversion {
    const exchangeRate = this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate;

    const taxInfo = this.calculatePriceWithTax(convertedAmount, country, region);

    const conversion: PriceConversion = {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      convertedCurrency: toCurrency,
      exchangeRate,
      tax: taxInfo.tax,
      taxRate: taxInfo.taxRate,
      total: taxInfo.total,
      timestamp: new Date(),
    };

    this.conversionHistory.push(conversion);
    return conversion;
  }

  /**
   * Get currency configuration
   */
  getCurrencyConfig(code: string): CurrencyConfig | undefined {
    return this.currencyConfigs.get(code);
  }

  /**
   * List all supported currencies
   */
  listCurrencies(): CurrencyConfig[] {
    return Array.from(this.currencyConfigs.values());
  }

  /**
   * List all supported regions with tax rates
   */
  listTaxRegions(): TaxRate[] {
    return Array.from(this.taxRates.values());
  }

  /**
   * Format price in currency
   */
  formatPrice(amount: number, currency: string): string {
    const config = this.getCurrencyConfig(currency);
    if (!config) return `${amount} ${currency}`;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    }).format(amount);
  }

  /**
   * Get conversion history
   */
  getConversionHistory(limit: number = 10): PriceConversion[] {
    return this.conversionHistory.slice(-limit).reverse();
  }

  /**
   * Clear conversion history
   */
  clearConversionHistory(): void {
    this.conversionHistory = [];
  }

  /**
   * Update exchange rate
   */
  updateExchangeRate(from: string, to: string, rate: number): void {
    const key = `${from}_${to}`;
    this.exchangeRates.set(key, {
      from,
      to,
      rate,
      timestamp: new Date(),
      source: 'manual',
    });
  }

  /**
   * Update tax rate
   */
  updateTaxRate(country: string, rate: number, taxType: 'VAT' | 'GST' | 'Sales Tax' | 'Other', region?: string): void {
    const key = region ? `${country}_${region}` : country;
    this.taxRates.set(key, {
      country,
      region,
      taxType,
      rate,
      description: `${taxType} for ${region ? region + ', ' : ''}${country}`,
    });
  }

  /**
   * Get pricing tiers in multiple currencies
   */
  getPricingTiersMultiCurrency(
    basePrices: { name: string; price: number }[],
    baseCurrency: string,
    targetCurrencies: string[],
  ): Record<string, { name: string; prices: Record<string, number> }> {
    const result: Record<string, { name: string; prices: Record<string, number> }> = {};

    basePrices.forEach((tier) => {
      result[tier.name] = {
        name: tier.name,
        prices: {},
      };

      targetCurrencies.forEach((currency) => {
        try {
          const converted = this.convertCurrency(tier.price, baseCurrency, currency);
          result[tier.name].prices[currency] = parseFloat(converted.toFixed(2));
        } catch {
          result[tier.name].prices[currency] = tier.price;
        }
      });
    });

    return result;
  }

  /**
   * Get regional pricing with tax
   */
  getRegionalPricing(
    basePrice: number,
    baseCurrency: string,
    regions: Array<{ country: string; region?: string; currency: string }>,
  ): Array<{ country: string; region?: string; currency: string; price: number; tax: number; total: number }> {
    return regions.map((location) => {
      const converted = this.convertCurrency(basePrice, baseCurrency, location.currency);
      const withTax = this.calculatePriceWithTax(converted, location.country, location.region);

      return {
        country: location.country,
        region: location.region,
        currency: location.currency,
        price: parseFloat(converted.toFixed(2)),
        tax: withTax.tax,
        total: withTax.total,
      };
    });
  }

  /**
   * Detect currency by country
   */
  detectCurrencyByCountry(country: string): string | undefined {
    const config = Array.from(this.currencyConfigs.values()).find((c) => c.regions.includes(country));
    return config?.code;
  }

  /**
   * Detect tax rate by country
   */
  detectTaxByCountry(country: string, region?: string): TaxRate | undefined {
    return this.getTaxRate(country, region);
  }

  /**
   * Export exchange rates as JSON
   */
  exportExchangeRates(): string {
    const rates = Array.from(this.exchangeRates.values());
    return JSON.stringify(rates, null, 2);
  }

  /**
   * Export tax rates as JSON
   */
  exportTaxRates(): string {
    const rates = Array.from(this.taxRates.values());
    return JSON.stringify(rates, null, 2);
  }
}
