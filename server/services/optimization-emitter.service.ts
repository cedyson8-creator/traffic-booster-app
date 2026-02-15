import { EventEmitter } from 'events';

export interface Recommendation {
  id: string;
  type: 'caching' | 'batching' | 'compression' | 'rate-limiting' | 'pagination';
  description: string;
  estimatedSavings: number;
  estimatedCostReduction: number;
  priority: 'low' | 'medium' | 'high';
  implementation: string;
  applied: boolean;
}

export interface OptimizationSummary {
  appliedCount: number;
  totalRecommendations: number;
  totalSavings: number;
  potentialSavings: number;
}

export interface OptimizationUpdate {
  type: 'optimization';
  recommendations: Recommendation[];
  summary: OptimizationSummary;
  timestamp: number;
}

/**
 * OptimizationEmitterService
 * Emits real-time optimization recommendations and cost savings analysis
 * Simulates optimization engine data generation
 */
export class OptimizationEmitterService extends EventEmitter {
  private static instance: OptimizationEmitterService;
  private optimizationInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private appliedRecommendations: Set<string> = new Set();
  private recommendations: Recommendation[] = [
    {
      id: 'cache-1',
      type: 'caching',
      description: 'Implement response caching for frequently accessed endpoints',
      estimatedSavings: 30,
      estimatedCostReduction: 450,
      priority: 'high',
      implementation: 'Add Redis caching layer with 5-minute TTL for GET requests',
      applied: false,
    },
    {
      id: 'batch-1',
      type: 'batching',
      description: 'Batch multiple API requests into single calls',
      estimatedSavings: 25,
      estimatedCostReduction: 375,
      priority: 'high',
      implementation: 'Implement batch endpoint accepting up to 100 requests per call',
      applied: false,
    },
    {
      id: 'compress-1',
      type: 'compression',
      description: 'Enable gzip compression for API responses',
      estimatedSavings: 20,
      estimatedCostReduction: 300,
      priority: 'medium',
      implementation: 'Enable gzip compression for all JSON responses',
      applied: true,
    },
    {
      id: 'paginate-1',
      type: 'pagination',
      description: 'Implement pagination for list endpoints',
      estimatedSavings: 18,
      estimatedCostReduction: 270,
      priority: 'medium',
      implementation: 'Add limit/offset pagination with default limit of 50',
      applied: false,
    },
    {
      id: 'rate-limit-1',
      type: 'rate-limiting',
      description: 'Implement rate limiting to prevent abuse',
      estimatedSavings: 15,
      estimatedCostReduction: 225,
      priority: 'medium',
      implementation: 'Add token bucket rate limiting (100 req/min per client)',
      applied: false,
    },
  ];

  private constructor() {
    super();
    // Initialize applied recommendations
    this.recommendations.forEach(rec => {
      if (rec.applied) {
        this.appliedRecommendations.add(rec.id);
      }
    });
  }

  static getInstance(): OptimizationEmitterService {
    if (!OptimizationEmitterService.instance) {
      OptimizationEmitterService.instance = new OptimizationEmitterService();
    }
    return OptimizationEmitterService.instance;
  }

  /**
   * Start emitting optimization data at regular intervals
   * @param intervalMs Interval in milliseconds (default: 15000ms)
   */
  start(intervalMs: number = 15000): void {
    if (this.isRunning) {
      console.log('[OptimizationEmitter] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[OptimizationEmitter] Starting with ${intervalMs}ms interval`);

    this.optimizationInterval = setInterval(() => {
      this.emitOptimizations();
    }, intervalMs);

    // Emit initial data immediately
    this.emitOptimizations();
  }

  /**
   * Stop emitting optimization data
   */
  stop(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    this.isRunning = false;
    console.log('[OptimizationEmitter] Stopped');
  }

  /**
   * Generate and emit current optimization data
   */
  private emitOptimizations(): void {
    const recommendations = this.recommendations.map(rec => ({
      ...rec,
      applied: this.appliedRecommendations.has(rec.id),
    }));

    const summary = this.calculateSummary(recommendations);

    const update: OptimizationUpdate = {
      type: 'optimization',
      recommendations,
      summary,
      timestamp: Date.now(),
    };

    this.emit('update', update);
  }

  /**
   * Calculate optimization summary
   */
  private calculateSummary(recommendations: Recommendation[]): OptimizationSummary {
    const appliedCount = recommendations.filter(r => r.applied).length;
    const totalSavings = recommendations
      .filter(r => r.applied)
      .reduce((sum, r) => sum + r.estimatedCostReduction, 0);
    const potentialSavings = recommendations.reduce((sum, r) => sum + r.estimatedCostReduction, 0);

    return {
      appliedCount,
      totalRecommendations: recommendations.length,
      totalSavings,
      potentialSavings,
    };
  }

  /**
   * Manually emit optimization data
   */
  emitManual(recommendations: Recommendation[]): void {
    const summary = this.calculateSummary(recommendations);

    const update: OptimizationUpdate = {
      type: 'optimization',
      recommendations,
      summary,
      timestamp: Date.now(),
    };

    this.emit('update', update);
  }

  /**
   * Apply a recommendation
   */
  applyRecommendation(id: string): void {
    this.appliedRecommendations.add(id);
    this.emitOptimizations();
  }

  /**
   * Unapply a recommendation
   */
  unapplyRecommendation(id: string): void {
    this.appliedRecommendations.delete(id);
    this.emitOptimizations();
  }

  /**
   * Get current recommendations
   */
  getCurrentRecommendations(): Recommendation[] {
    return this.recommendations.map(rec => ({
      ...rec,
      applied: this.appliedRecommendations.has(rec.id),
    }));
  }

  /**
   * Get current summary
   */
  getCurrentSummary(): OptimizationSummary {
    return this.calculateSummary(this.getCurrentRecommendations());
  }

  /**
   * Add new recommendation
   */
  addRecommendation(recommendation: Recommendation): void {
    this.recommendations.push(recommendation);
    this.emitOptimizations();
  }

  /**
   * Remove recommendation by ID
   */
  removeRecommendation(id: string): void {
    this.recommendations = this.recommendations.filter(r => r.id !== id);
    this.appliedRecommendations.delete(id);
    this.emitOptimizations();
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get recommendations by priority
   */
  getByPriority(priority: 'low' | 'medium' | 'high'): Recommendation[] {
    return this.getCurrentRecommendations().filter(r => r.priority === priority);
  }

  /**
   * Get recommendations by type
   */
  getByType(type: Recommendation['type']): Recommendation[] {
    return this.getCurrentRecommendations().filter(r => r.type === type);
  }
}

export const optimizationEmitter = OptimizationEmitterService.getInstance();
