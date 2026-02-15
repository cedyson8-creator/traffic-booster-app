import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookMonitoringService } from '../services/webhook-monitoring.service';
import { ReportTemplatesService } from '../services/report-templates.service';
import { CostAnalysisService } from '../services/cost-analysis.service';

describe('Webhook Monitoring Service', () => {
  let monitoringService: WebhookMonitoringService;

  beforeEach(() => {
    WebhookMonitoringService.resetInstance();
    monitoringService = WebhookMonitoringService.getInstance();
  });

  it('should record webhook delivery event', () => {
    const event = {
      webhookId: 'webhook-1',
      eventId: 'event-1',
      status: 'delivered' as const,
      timestamp: new Date(),
      responseCode: 200,
      responseTime: 150,
      retryCount: 0,
    };

    monitoringService.recordEvent(event);
    const stats = monitoringService.getStats();
    
    expect(stats.totalWebhooks).toBe(1);
    expect(stats.recentEvents.length).toBeGreaterThan(0);
  });

  it('should calculate success rate', () => {
    monitoringService.recordEvent({
      webhookId: 'webhook-1',
      eventId: 'event-1',
      status: 'delivered',
      timestamp: new Date(),
      responseCode: 200,
      responseTime: 100,
      retryCount: 0,
    });

    monitoringService.recordEvent({
      webhookId: 'webhook-1',
      eventId: 'event-2',
      status: 'failed',
      timestamp: new Date(),
      errorMessage: 'Timeout',
      retryCount: 3,
    });

    const stats = monitoringService.getStats();
    expect(stats.successRate).toBe(50);
  });

  it('should track webhook-specific stats', () => {
    monitoringService.recordEvent({
      webhookId: 'webhook-1',
      eventId: 'event-1',
      status: 'delivered',
      timestamp: new Date(),
      responseCode: 200,
      responseTime: 200,
      retryCount: 0,
    });

    const webhookStats = monitoringService.getWebhookStats('webhook-1');
    expect(webhookStats).not.toBeNull();
    expect(webhookStats?.success).toBe(1);
    expect(webhookStats?.failed).toBe(0);
  });

  it('should subscribe to events', () => {
    let eventReceived = false;

    monitoringService.subscribe((event) => {
      eventReceived = true;
      expect(event.webhookId).toBe('webhook-1');
    });

    monitoringService.recordEvent({
      webhookId: 'webhook-1',
      eventId: 'event-1',
      status: 'delivered',
      timestamp: new Date(),
      responseCode: 200,
      responseTime: 100,
      retryCount: 0,
    });
  });

  it('should get recent events for webhook', () => {
    for (let i = 0; i < 5; i++) {
      monitoringService.recordEvent({
        webhookId: 'webhook-1',
        eventId: `event-${i}`,
        status: 'delivered',
        timestamp: new Date(),
        responseCode: 200,
        responseTime: 100 + i * 10,
        retryCount: 0,
      });
    }

    const recentEvents = monitoringService.getRecentEvents('webhook-1', 3);
    expect(recentEvents.length).toBe(3);
  });
});

describe('Report Templates Service', () => {
  let templatesService: ReportTemplatesService;

  beforeEach(() => {
    ReportTemplatesService.resetInstance();
    templatesService = ReportTemplatesService.getInstance();
  });

  it('should initialize with default templates', () => {
    const templates = templatesService.getDefaultTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get all templates', () => {
    const templates = templatesService.getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get templates by category', () => {
    const summaryTemplates = templatesService.getTemplatesByCategory('summary');
    expect(summaryTemplates.length).toBeGreaterThan(0);
    expect(summaryTemplates.every(t => t.category === 'summary')).toBe(true);
  });

  it('should get template by ID', () => {
    const templates = templatesService.getAllTemplates();
    const firstTemplate = templates[0];
    
    const retrieved = templatesService.getTemplate(firstTemplate.id);
    expect(retrieved).not.toBeUndefined();
    expect(retrieved?.id).toBe(firstTemplate.id);
  });

  it('should create custom template', () => {
    const customTemplate = templatesService.createTemplate({
      name: 'Custom Report',
      description: 'My custom template',
      category: 'custom',
      metrics: ['api_calls'],
      includeCharts: true,
      includeSummary: false,
      isDefault: false,
    });

    expect(customTemplate.id).toBeDefined();
    expect(customTemplate.name).toBe('Custom Report');
    expect(customTemplate.createdAt).toBeDefined();
  });

  it('should update template', () => {
    const templates = templatesService.getAllTemplates();
    const template = templates[0];
    
    const updated = templatesService.updateTemplate(template.id, {
      name: 'Updated Name',
    });

    expect(updated?.name).toBe('Updated Name');
  });

  it('should delete template', () => {
    const initialCount = templatesService.getTemplateCount();
    const templates = templatesService.getAllTemplates();
    const templateToDelete = templates[0];
    
    const deleted = templatesService.deleteTemplate(templateToDelete.id);
    expect(deleted).toBe(true);
    expect(templatesService.getTemplateCount()).toBe(initialCount - 1);
  });
});

describe('Cost Analysis Service', () => {
  let costService: CostAnalysisService;

  beforeEach(() => {
    CostAnalysisService.resetInstance();
    costService = CostAnalysisService.getInstance();
  });

  it('should record API call cost', () => {
    costService.recordApiCall('org-1', '/api/users', 0.01, 150, false);
    
    const summary = costService.getCostSummary('org-1');
    expect(summary.totalCost).toBe(0.01);
    expect(summary.totalCalls).toBe(1);
  });

  it('should calculate average cost per call', () => {
    costService.recordApiCall('org-1', '/api/users', 0.01, 100, false);
    costService.recordApiCall('org-1', '/api/users', 0.01, 200, false);
    costService.recordApiCall('org-1', '/api/users', 0.01, 150, false);
    
    const summary = costService.getCostSummary('org-1');
    expect(summary.averageCostPerCall).toBe(0.01);
    expect(summary.totalCalls).toBe(3);
  });

  it('should track error rates', () => {
    costService.recordApiCall('org-1', '/api/users', 0.01, 100, false);
    costService.recordApiCall('org-1', '/api/users', 0.01, 100, true);
    
    const analysis = costService.analyzeCosts('org-1', new Date(0), new Date());
    const endpoint = analysis.costByEndpoint[0];
    
    expect(endpoint.errorRate).toBe(0.5);
  });

  it('should generate cost analysis', () => {
    costService.recordApiCall('org-1', '/api/users', 0.01, 100, false);
    costService.recordApiCall('org-1', '/api/posts', 0.02, 200, false);
    
    const analysis = costService.analyzeCosts('org-1', new Date(0), new Date());
    
    expect(analysis.totalCost).toBe(0.03);
    expect(analysis.totalApiCalls).toBe(2);
    expect(analysis.costByEndpoint.length).toBe(2);
  });

  it('should generate optimization recommendations', () => {
    // Record many calls to trigger caching recommendation
    for (let i = 0; i < 1500; i++) {
      costService.recordApiCall('org-1', '/api/users', 0.01, 100, false);
    }
    
    const analysis = costService.analyzeCosts('org-1', new Date(0), new Date());
    
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(analysis.recommendations.some(r => r.type === 'caching')).toBe(true);
  });

  it('should get high-cost endpoints', () => {
    costService.recordApiCall('org-1', '/api/users', 0.01, 100, false);
    costService.recordApiCall('org-1', '/api/posts', 0.05, 200, false);
    costService.recordApiCall('org-1', '/api/comments', 0.02, 150, false);
    
    const highCost = costService.getHighCostEndpoints('org-1', 2);
    
    expect(highCost.length).toBe(2);
    expect(highCost[0].endpoint).toBe('/api/posts');
    expect(highCost[1].endpoint).toBe('/api/comments');
  });

  it('should generate cost trend', () => {
    costService.recordApiCall('org-1', '/api/users', 0.01, 100, false);
    
    const analysis = costService.analyzeCosts('org-1', new Date(0), new Date());
    
    expect(analysis.costTrend.length).toBe(30);
    expect(analysis.costTrend[0].date).toBeDefined();
    expect(analysis.costTrend[0].cost).toBeGreaterThan(0);
  });

  it('should handle multiple organizations', () => {
    costService.recordApiCall('org-1', '/api/users', 0.01, 100, false);
    costService.recordApiCall('org-2', '/api/posts', 0.02, 200, false);
    
    const summary1 = costService.getCostSummary('org-1');
    const summary2 = costService.getCostSummary('org-2');
    
    expect(summary1.totalCost).toBe(0.01);
    expect(summary2.totalCost).toBe(0.02);
  });
});
