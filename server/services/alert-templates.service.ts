/**
 * Alert Templates Service
 * Provides pre-configured alert templates for common scenarios
 */

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  triggerType: 'error_rate' | 'api_latency' | 'webhook_failure' | 'quota_exceeded' | 'failed_auth';
  threshold: number;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  channels: ('email' | 'slack' | 'discord' | 'webhook')[];
  cooldownMinutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
}

export class AlertTemplatesService {
  private templates: Map<string, AlertTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default alert templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: AlertTemplate[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 5%',
        triggerType: 'error_rate',
        threshold: 5,
        operator: '>',
        channels: ['email', 'slack'],
        cooldownMinutes: 30,
        severity: 'high',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'slow-api',
        name: 'Slow API Response',
        description: 'Alert when average API latency exceeds 1000ms',
        triggerType: 'api_latency',
        threshold: 1000,
        operator: '>',
        channels: ['email', 'slack'],
        cooldownMinutes: 15,
        severity: 'medium',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'webhook-failures',
        name: 'Webhook Delivery Failures',
        description: 'Alert when webhook failure rate exceeds 10%',
        triggerType: 'webhook_failure',
        threshold: 10,
        operator: '>',
        channels: ['email', 'discord'],
        cooldownMinutes: 60,
        severity: 'high',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'quota-exceeded',
        name: 'Quota Exceeded',
        description: 'Alert when usage quota is exceeded',
        triggerType: 'quota_exceeded',
        threshold: 100,
        operator: '>=',
        channels: ['email', 'slack'],
        cooldownMinutes: 120,
        severity: 'critical',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'auth-failures',
        name: 'Authentication Failures',
        description: 'Alert when failed auth attempts exceed 10 per minute',
        triggerType: 'failed_auth',
        threshold: 10,
        operator: '>',
        channels: ['email', 'slack', 'discord'],
        cooldownMinutes: 5,
        severity: 'critical',
        enabled: true,
        createdAt: new Date(),
      },
      {
        id: 'critical-errors',
        name: 'Critical Errors',
        description: 'Alert on any critical system error',
        triggerType: 'error_rate',
        threshold: 1,
        operator: '>=',
        channels: ['email', 'slack', 'discord', 'webhook'],
        cooldownMinutes: 1,
        severity: 'critical',
        enabled: true,
        createdAt: new Date(),
      },
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): AlertTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): AlertTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by trigger type
   */
  getTemplatesByTriggerType(triggerType: string): AlertTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.triggerType === triggerType);
  }

  /**
   * Get templates by severity
   */
  getTemplatesBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): AlertTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.severity === severity);
  }

  /**
   * Create custom template from existing template
   */
  createFromTemplate(templateId: string, customizations: Partial<AlertTemplate>): AlertTemplate {
    const baseTemplate = this.getTemplate(templateId);
    if (!baseTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    const newTemplate: AlertTemplate = {
      ...baseTemplate,
      id: `custom-${Date.now()}`,
      ...customizations,
      createdAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Get recommended templates for organization
   */
  getRecommendedTemplates(organizationType: 'startup' | 'scale-up' | 'enterprise'): AlertTemplate[] {
    const recommended: AlertTemplate[] = [];

    switch (organizationType) {
      case 'startup':
        // Startups need basic monitoring
        recommended.push(
          this.getTemplate('high-error-rate')!,
          this.getTemplate('quota-exceeded')!,
          this.getTemplate('auth-failures')!
        );
        break;
      case 'scale-up':
        // Scale-ups need comprehensive monitoring
        recommended.push(
          this.getTemplate('high-error-rate')!,
          this.getTemplate('slow-api')!,
          this.getTemplate('webhook-failures')!,
          this.getTemplate('quota-exceeded')!,
          this.getTemplate('auth-failures')!
        );
        break;
      case 'enterprise':
        // Enterprises need everything
        recommended.push(...this.getAllTemplates());
        break;
    }

    return recommended;
  }

  /**
   * Get templates by channel
   */
  getTemplatesByChannel(channel: 'email' | 'slack' | 'discord' | 'webhook'): AlertTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.channels.includes(channel));
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<AlertTemplate>): AlertTemplate {
    const template = this.getTemplate(id);
    if (!template) {
      throw new Error(`Template ${id} not found`);
    }

    const updated: AlertTemplate = {
      ...template,
      ...updates,
      id: template.id, // Don't allow ID changes
      createdAt: template.createdAt, // Don't allow creation date changes
    };

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
   * Search templates by name or description
   */
  searchTemplates(query: string): AlertTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Export templates as JSON
   */
  exportTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()), null, 2);
  }

  /**
   * Import templates from JSON
   */
  importTemplates(jsonData: string): number {
    const templates = JSON.parse(jsonData) as AlertTemplate[];
    let importedCount = 0;

    for (const template of templates) {
      this.templates.set(template.id, template);
      importedCount++;
    }

    return importedCount;
  }
}

export const alertTemplatesService = new AlertTemplatesService();
