import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

/**
 * Error Tracking Service
 * Integrates with Sentry for centralized error monitoring
 */

export interface ErrorEvent {
  id: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp: Date;
  userId?: number;
  endpoint?: string;
  statusCode?: number;
  context?: Record<string, any>;
  stackTrace?: string;
  tags?: Record<string, string>;
  breadcrumbs?: Array<{
    message: string;
    level: string;
    timestamp: number;
    category?: string;
  }>;
}

/**
 * In-memory error store for local development
 */
const errorStore: Map<string, ErrorEvent> = new Map();
const errorStats = {
  total: 0,
  byLevel: {
    fatal: 0,
    error: 0,
    warning: 0,
    info: 0,
    debug: 0,
  },
  byEndpoint: {} as Record<string, number>,
};

export class ErrorTrackingService {
  private static initialized = false;
  private static sentryEnabled = false;

  /**
   * Initialize Sentry
   */
  static initialize(dsn?: string) {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    // Only initialize Sentry if DSN is provided
    if (dsn) {
      try {
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: 0.1,
        });
        this.sentryEnabled = true;
        console.log('[ErrorTracking] Sentry initialized successfully');
      } catch (error) {
        console.error('[ErrorTracking] Failed to initialize Sentry:', error);
        this.sentryEnabled = false;
      }
    } else {
      console.log('[ErrorTracking] Sentry DSN not configured, using local error store');
      this.sentryEnabled = false;
    }
  }

  /**
   * Capture an error event
   */
  static captureError(error: Error | string, context?: {
    userId?: number;
    endpoint?: string;
    statusCode?: number;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = typeof error === 'string' ? error : error.message;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    const errorEvent: ErrorEvent = {
      id: errorId,
      message,
      level: 'error',
      timestamp: new Date(),
      userId: context?.userId,
      endpoint: context?.endpoint,
      statusCode: context?.statusCode,
      context: context?.extra,
      stackTrace,
      tags: context?.tags,
    };

    // Store locally
    errorStore.set(errorId, errorEvent);
    errorStats.total++;
    errorStats.byLevel.error++;
    if (context?.endpoint) {
      errorStats.byEndpoint[context.endpoint] = (errorStats.byEndpoint[context.endpoint] || 0) + 1;
    }

    // Send to Sentry if enabled
    if (this.sentryEnabled) {
      Sentry.captureException(error, {
        level: 'error',
        tags: context?.tags,
        extra: {
          userId: context?.userId,
          endpoint: context?.endpoint,
          statusCode: context?.statusCode,
          ...context?.extra,
        },
      });
    }

    return errorId;
  }

  /**
   * Capture a warning
   */
  static captureWarning(message: string, context?: Record<string, any>) {
    const errorId = `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const errorEvent: ErrorEvent = {
      id: errorId,
      message,
      level: 'warning',
      timestamp: new Date(),
      context,
    };

    errorStore.set(errorId, errorEvent);
    errorStats.total++;
    errorStats.byLevel.warning++;

    if (this.sentryEnabled) {
      Sentry.captureMessage(message, 'warning');
    }

    return errorId;
  }

  /**
   * Capture an info message
   */
  static captureInfo(message: string, context?: Record<string, any>) {
    const errorId = `info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const errorEvent: ErrorEvent = {
      id: errorId,
      message,
      level: 'info',
      timestamp: new Date(),
      context,
    };

    errorStore.set(errorId, errorEvent);
    errorStats.total++;
    errorStats.byLevel.info++;

    if (this.sentryEnabled) {
      Sentry.captureMessage(message, 'info');
    }

    return errorId;
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  static addBreadcrumb(message: string, category?: string, level: string = 'info') {
    if (this.sentryEnabled) {
      Sentry.addBreadcrumb({
        message,
        category,
        level: level as any,
        timestamp: Date.now() / 1000,
      });
    }
  }

  /**
   * Set user context
   */
  static setUserContext(userId: number, email?: string, username?: string) {
    if (this.sentryEnabled) {
      Sentry.setUser({
        id: userId.toString(),
        email,
        username,
      });
    }
  }

  /**
   * Clear user context
   */
  static clearUserContext() {
    if (this.sentryEnabled) {
      Sentry.setUser(null);
    }
  }

  /**
   * Get error by ID
   */
  static getError(errorId: string): ErrorEvent | null {
    return errorStore.get(errorId) || null;
  }

  /**
   * Get recent errors
   */
  static getRecentErrors(limit: number = 50): ErrorEvent[] {
    return Array.from(errorStore.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get errors by level
   */
  static getErrorsByLevel(level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'): ErrorEvent[] {
    return Array.from(errorStore.values()).filter((e) => e.level === level);
  }

  /**
   * Get errors by endpoint
   */
  static getErrorsByEndpoint(endpoint: string): ErrorEvent[] {
    return Array.from(errorStore.values()).filter((e) => e.endpoint === endpoint);
  }

  /**
   * Get error statistics
   */
  static getStatistics(): typeof errorStats {
    return {
      total: errorStats.total,
      byLevel: { ...errorStats.byLevel },
      byEndpoint: { ...errorStats.byEndpoint },
    };
  }

  /**
   * Get errors in time range
   */
  static getErrorsInRange(startTime: Date, endTime: Date): ErrorEvent[] {
    return Array.from(errorStore.values()).filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime,
    );
  }

  /**
   * Clear all errors (testing only)
   */
  static clearAll() {
    errorStore.clear();
    errorStats.total = 0;
    errorStats.byLevel = { fatal: 0, error: 0, warning: 0, info: 0, debug: 0 };
    errorStats.byEndpoint = {};
  }

  /**
   * Get Sentry status
   */
  static getStatus(): {
    initialized: boolean;
    sentryEnabled: boolean;
    backend: 'sentry' | 'local';
    totalErrors: number;
  } {
    return {
      initialized: this.initialized,
      sentryEnabled: this.sentryEnabled,
      backend: this.sentryEnabled ? 'sentry' : 'local',
      totalErrors: errorStats.total,
    };
  }

  /**
   * Express error handler middleware
   */
  static errorHandler() {
    const self = this;
    return (err: Error, req: Request, res: Response, next: any) => {
      const userId = (req as any).userId;
      const endpoint = req.path;
      const statusCode = res.statusCode || 500;

      self.captureError(err, {
        userId,
        endpoint,
        statusCode,
        tags: {
          method: req.method,
          url: req.url,
        },
      });

      res.status(statusCode).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
        errorId: `err_${Date.now()}`,
      });
    };
  }

  /**
   * Express request tracking middleware
   */
  static requestTracker() {
    const self = this;
    return (req: Request, res: Response, next: any) => {
      const userId = (req as any).userId;

      if (userId) {
        self.setUserContext(userId);
      }

      self.addBreadcrumb(`${req.method} ${req.path}`, 'http', 'info');

      const originalSend = res.send;
      res.send = function (data: any) {
        if (res.statusCode >= 400) {
          self.captureWarning(`HTTP ${res.statusCode} on ${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            method: req.method,
            path: req.path,
          });
        }
        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Graceful shutdown
   */
  static async shutdown() {
    if (this.sentryEnabled) {
      try {
        await Sentry.close(2000);
        console.log('[ErrorTracking] Sentry shutdown complete');
      } catch (error) {
        console.error('[ErrorTracking] Error during Sentry shutdown:', error);
      }
    }
  }
}

// Initialize on import
const sentryDsn = process.env.SENTRY_DSN;
ErrorTrackingService.initialize(sentryDsn);
