/**
 * Report template library service
 * Manages pre-built report templates for quick report creation
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'summary' | 'detailed' | 'executive' | 'custom';
  metrics: string[];
  includeCharts: boolean;
  includeSummary: boolean;
  dateRange?: { days: number };
  createdAt: Date;
  isDefault: boolean;
}

export class ReportTemplatesService {
  private static instance: ReportTemplatesService;
  private templates: Map<string, ReportTemplate> = new Map();
  private templateCounter = 0;

  private constructor() {
    this.initializeDefaultTemplates();
  }

  static getInstance(): ReportTemplatesService {
    if (!ReportTemplatesService.instance) {
      ReportTemplatesService.instance = new ReportTemplatesService();
    }
    return ReportTemplatesService.instance;
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaults: Omit<ReportTemplate, 'id' | 'createdAt'>[] = [
      {
        name: 'Weekly Summary',
        description: 'Quick overview of last 7 days performance',
        category: 'summary',
        metrics: ['api_calls', 'error_rate', 'avg_response_time'],
        includeCharts: true,
        includeSummary: true,
        dateRange: { days: 7 },
        isDefault: true,
      },
      {
        name: 'Monthly Report',
        description: 'Comprehensive monthly performance analysis',
        category: 'detailed',
        metrics: ['api_calls', 'error_rate', 'avg_response_time', 'webhook_success_rate', 'top_endpoints'],
        includeCharts: true,
        includeSummary: true,
        dateRange: { days: 30 },
        isDefault: true,
      },
      {
        name: 'Executive Summary',
        description: 'High-level metrics for stakeholders',
        category: 'executive',
        metrics: ['api_calls', 'error_rate', 'webhook_success_rate'],
        includeCharts: true,
        includeSummary: true,
        dateRange: { days: 90 },
        isDefault: true,
      },
      {
        name: 'Performance Deep Dive',
        description: 'Detailed analysis of API performance',
        category: 'detailed',
        metrics: ['api_calls', 'error_rate', 'avg_response_time', 'p95_response_time', 'p99_response_time', 'top_endpoints', 'error_distribution'],
        includeCharts: true,
        includeSummary: true,
        dateRange: { days: 30 },
        isDefault: true,
      },
      {
        name: 'Webhook Health Report',
        description: 'Webhook delivery and reliability metrics',
        category: 'detailed',
        metrics: ['webhook_success_rate', 'webhook_failures', 'webhook_retries', 'webhook_avg_response_time'],
        includeCharts: true,
        includeSummary: true,
        dateRange: { days: 30 },
        isDefault: true,
      },
      {
        name: 'Cost Analysis',
        description: 'API usage costs and optimization opportunities',
        category: 'executive',
        metrics: ['api_calls', 'cost_per_call', 'total_cost', 'cost_by_endpoint'],
        includeCharts: true,
        includeSummary: true,
        dateRange: { days: 30 },
        isDefault: true,
      },
    ];

    defaults.forEach(template => {
      const id = `template-${++this.templateCounter}`;
      this.templates.set(id, {
        ...template,
        id,
        createdAt: new Date(),
      });
    });
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get default templates
   */
  getDefaultTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.isDefault);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: ReportTemplate['category']): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Create custom template
   */
  createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt'>): ReportTemplate {
    const id = `template-${++this.templateCounter}`;
    const newTemplate: ReportTemplate = {
      ...template,
      id,
      createdAt: new Date(),
    };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<Omit<ReportTemplate, 'id' | 'createdAt'>>): ReportTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated = { ...template, ...updates };
    this.templates.set(id, updated);
    return updated;
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Get template count
   */
  getTemplateCount(): number {
    return this.templates.size;
  }

  /**
   * Reset for testing
   */
  static resetInstance(): void {
    ReportTemplatesService.instance = new ReportTemplatesService();
  }
}

export const reportTemplatesService = ReportTemplatesService.getInstance();
