import { performanceEmitter, PerformanceUpdate } from './performance-emitter.service';
import { forecastingEmitter, ForecastingUpdate } from './forecasting-emitter.service';
import { optimizationEmitter, OptimizationUpdate } from './optimization-emitter.service';
import { WebSocketService } from './websocket.service';

type MetricUpdate = PerformanceUpdate | ForecastingUpdate | OptimizationUpdate;

/**
 * EventAggregatorService
 * Connects all event emitters to the WebSocket service
 * Manages event routing and broadcasting
 */
export class EventAggregatorService {
  private static instance: EventAggregatorService;
  private wsService: WebSocketService;
  private isInitialized = false;

  private constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  static getInstance(wsService?: WebSocketService): EventAggregatorService {
    if (!EventAggregatorService.instance) {
      if (!wsService) {
        throw new Error('WebSocketService required for first initialization');
      }
      EventAggregatorService.instance = new EventAggregatorService(wsService);
    }
    return EventAggregatorService.instance;
  }

  /**
   * Initialize event listeners for all emitters
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('[EventAggregator] Already initialized');
      return;
    }

    console.log('[EventAggregator] Initializing event listeners...');

    // Listen to performance metrics
    performanceEmitter.on('update', (update: PerformanceUpdate) => {
      this.handlePerformanceUpdate(update);
    });

    // Listen to forecasting data
    forecastingEmitter.on('update', (update: ForecastingUpdate) => {
      this.handleForecastingUpdate(update);
    });

    // Listen to optimization recommendations
    optimizationEmitter.on('update', (update: OptimizationUpdate) => {
      this.handleOptimizationUpdate(update);
    });

    this.isInitialized = true;
    console.log('[EventAggregator] Event listeners initialized');
  }

  /**
   * Handle performance metric updates
   */
  private handlePerformanceUpdate(update: PerformanceUpdate): void {
    console.log(`[EventAggregator] Broadcasting performance update with ${update.metrics.length} metrics`);
    this.wsService.broadcast(update as any);
  }

  /**
   * Handle forecasting updates
   */
  private handleForecastingUpdate(update: ForecastingUpdate): void {
    console.log(`[EventAggregator] Broadcasting forecast update for ${update.daysAhead} days`);
    this.wsService.broadcast(update as any);
  }

  /**
   * Handle optimization updates
   */
  private handleOptimizationUpdate(update: OptimizationUpdate): void {
    console.log(
      `[EventAggregator] Broadcasting optimization update with ${update.recommendations.length} recommendations`
    );
    this.wsService.broadcast(update as any);
  }

  /**
   * Start all emitters
   */
  startAll(): void {
    console.log('[EventAggregator] Starting all emitters...');
    performanceEmitter.start(5000);
    forecastingEmitter.start(10000);
    optimizationEmitter.start(15000);
    console.log('[EventAggregator] All emitters started');
  }

  /**
   * Stop all emitters
   */
  stopAll(): void {
    console.log('[EventAggregator] Stopping all emitters...');
    performanceEmitter.stop();
    forecastingEmitter.stop();
    optimizationEmitter.stop();
    console.log('[EventAggregator] All emitters stopped');
  }

  /**
   * Start specific emitter
   */
  startEmitter(type: 'performance' | 'forecasting' | 'optimization'): void {
    switch (type) {
      case 'performance':
        performanceEmitter.start();
        break;
      case 'forecasting':
        forecastingEmitter.start();
        break;
      case 'optimization':
        optimizationEmitter.start();
        break;
    }
  }

  /**
   * Stop specific emitter
   */
  stopEmitter(type: 'performance' | 'forecasting' | 'optimization'): void {
    switch (type) {
      case 'performance':
        performanceEmitter.stop();
        break;
      case 'forecasting':
        forecastingEmitter.stop();
        break;
      case 'optimization':
        optimizationEmitter.stop();
        break;
    }
  }

  /**
   * Check if emitter is running
   */
  isEmitterActive(type: 'performance' | 'forecasting' | 'optimization'): boolean {
    switch (type) {
      case 'performance':
        return performanceEmitter.isActive();
      case 'forecasting':
        return forecastingEmitter.isActive();
      case 'optimization':
        return optimizationEmitter.isActive();
    }
  }

  /**
   * Broadcast manual update
   */
  broadcastManualUpdate(update: MetricUpdate): void {
    console.log(`[EventAggregator] Broadcasting manual ${update.type} update`);
    this.wsService.broadcast(update as any);
  }

  /**
   * Broadcast to all clients (including unsubscribed)
   */
  broadcastToAll(update: MetricUpdate): void {
    console.log(`[EventAggregator] Broadcasting ${update.type} to all clients`);
    this.wsService.broadcastToAll(update as any);
  }

  /**
   * Get connected clients count
   */
  getConnectedClients(): number {
    return this.wsService.getConnectedClients();
  }

  /**
   * Check if initialized
   */
  isInitialized_(): boolean {
    return this.isInitialized;
  }

  /**
   * Get emitter status
   */
  getStatus(): {
    initialized: boolean;
    connectedClients: number;
    emitters: {
      performance: boolean;
      forecasting: boolean;
      optimization: boolean;
    };
  } {
    return {
      initialized: this.isInitialized,
      connectedClients: this.getConnectedClients(),
      emitters: {
        performance: performanceEmitter.isActive(),
        forecasting: forecastingEmitter.isActive(),
        optimization: optimizationEmitter.isActive(),
      },
    };
  }
}

export const eventAggregator = (wsService: WebSocketService) =>
  EventAggregatorService.getInstance(wsService);
