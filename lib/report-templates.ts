import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  isPreset: boolean;
}

const PRESET_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview with key metrics and trends',
    metrics: [
      'total_visits',
      'unique_visitors',
      'growth_rate',
      'conversion_rate',
      'organic_traffic',
      'campaign_roi',
    ],
    isPreset: true,
  },
  {
    id: 'detailed-analysis',
    name: 'Detailed Analysis',
    description: 'Comprehensive report with all available metrics',
    metrics: [
      'total_visits',
      'unique_visitors',
      'avg_session_duration',
      'bounce_rate',
      'growth_rate',
      'conversion_rate',
      'avg_pages_per_session',
      'return_visitor_rate',
      'organic_traffic',
      'direct_traffic',
      'referral_traffic',
      'social_traffic',
      'active_campaigns',
      'campaign_roi',
      'campaign_performance',
    ],
    isPreset: true,
  },
  {
    id: 'campaign-performance',
    name: 'Campaign Performance',
    description: 'Focus on campaign metrics and ROI analysis',
    metrics: [
      'total_visits',
      'conversion_rate',
      'active_campaigns',
      'campaign_roi',
      'campaign_performance',
      'organic_traffic',
      'social_traffic',
    ],
    isPreset: true,
  },
  {
    id: 'traffic-sources',
    name: 'Traffic Sources',
    description: 'Detailed breakdown of traffic sources and channels',
    metrics: [
      'total_visits',
      'unique_visitors',
      'organic_traffic',
      'direct_traffic',
      'referral_traffic',
      'social_traffic',
      'growth_rate',
    ],
    isPreset: true,
  },
  {
    id: 'engagement-metrics',
    name: 'Engagement Metrics',
    description: 'User engagement and behavior analysis',
    metrics: [
      'unique_visitors',
      'avg_session_duration',
      'bounce_rate',
      'avg_pages_per_session',
      'return_visitor_rate',
      'conversion_rate',
    ],
    isPreset: true,
  },
];

const STORAGE_KEY = '@traffic_booster_custom_templates';

export class ReportTemplateManager {
  /**
   * Get all available templates (presets + custom)
   */
  static async getAllTemplates(): Promise<ReportTemplate[]> {
    try {
      const customTemplates = await this.getCustomTemplates();
      return [...PRESET_TEMPLATES, ...customTemplates];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return PRESET_TEMPLATES;
    }
  }

  /**
   * Get only custom templates
   */
  static async getCustomTemplates(): Promise<ReportTemplate[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to get custom templates:', error);
      return [];
    }
  }

  /**
   * Get a template by ID
   */
  static async getTemplate(id: string): Promise<ReportTemplate | null> {
    try {
      // Check presets first
      const preset = PRESET_TEMPLATES.find((t) => t.id === id);
      if (preset) return preset;

      // Check custom templates
      const custom = await this.getCustomTemplates();
      return custom.find((t) => t.id === id) || null;
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }

  /**
   * Save a custom template
   */
  static async saveTemplate(template: Omit<ReportTemplate, 'id' | 'isPreset'>): Promise<ReportTemplate> {
    try {
      const id = `custom-${Date.now()}`;
      const newTemplate: ReportTemplate = {
        ...template,
        id,
        isPreset: false,
      };

      const custom = await this.getCustomTemplates();
      custom.push(newTemplate);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(custom));

      return newTemplate;
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  }

  /**
   * Update a custom template
   */
  static async updateTemplate(id: string, updates: Partial<Omit<ReportTemplate, 'id' | 'isPreset'>>): Promise<ReportTemplate> {
    try {
      const custom = await this.getCustomTemplates();
      const index = custom.findIndex((t) => t.id === id);

      if (index === -1) {
        throw new Error(`Template ${id} not found`);
      }

      const updated = { ...custom[index], ...updates };
      custom[index] = updated;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(custom));

      return updated;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete a custom template
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const custom = await this.getCustomTemplates();
      const filtered = custom.filter((t) => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Get preset templates only
   */
  static getPresetTemplates(): ReportTemplate[] {
    return PRESET_TEMPLATES;
  }
}
