/**
 * Audit Logging Service
 * Comprehensive audit trail for compliance and debugging
 */

export type AuditEventType =
  | 'api_call'
  | 'api_key_created'
  | 'api_key_rotated'
  | 'api_key_revoked'
  | 'webhook_created'
  | 'webhook_updated'
  | 'webhook_deleted'
  | 'webhook_triggered'
  | 'user_login'
  | 'user_logout'
  | 'team_member_added'
  | 'team_member_removed'
  | 'team_member_role_changed'
  | 'organization_created'
  | 'organization_updated'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'billing_payment'
  | 'alert_triggered'
  | 'alert_acknowledged'
  | 'settings_changed'
  | 'export_generated'
  | 'error_occurred';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: number;
  organizationId?: string;
  apiKeyId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  duration?: number; // in milliseconds
}

export interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  eventType?: AuditEventType;
  userId?: number;
  organizationId?: string;
  status?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByStatus: Record<string, number>;
  successRate: number;
  averageResponseTime: number;
}

/**
 * Audit Logging Service
 */
export class AuditLoggingService {
  private logs: AuditLogEntry[] = [];
  private logIndex: Map<string, AuditLogEntry[]> = new Map(); // organizationId -> logs

  /**
   * Log an audit event
   */
  logEvent(
    eventType: AuditEventType,
    action: string,
    details: Record<string, any>,
    options?: {
      userId?: number;
      organizationId?: string;
      apiKeyId?: string;
      resourceType?: string;
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      status?: 'success' | 'failure';
      errorMessage?: string;
      duration?: number;
    },
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType,
      action,
      details,
      status: options?.status || 'success',
      ...options,
    };

    this.logs.push(entry);

    // Index by organization for faster queries
    if (entry.organizationId) {
      const orgLogs = this.logIndex.get(entry.organizationId) || [];
      orgLogs.push(entry);
      this.logIndex.set(entry.organizationId, orgLogs);
    }

    console.log(
      `[AuditLog] ${eventType}: ${action} (${entry.status}) - Org: ${entry.organizationId || 'N/A'}, User: ${entry.userId || 'N/A'}`,
    );

    return entry;
  }

  /**
   * Log API call
   */
  logApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    organizationId?: string,
    userId?: number,
    ipAddress?: string,
  ): AuditLogEntry {
    return this.logEvent('api_call', `${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode,
      duration,
    }, {
      organizationId,
      userId,
      ipAddress,
      status: statusCode >= 200 && statusCode < 300 ? 'success' : 'failure',
      duration,
    });
  }

  /**
   * Log API key creation
   */
  logApiKeyCreated(
    apiKeyId: string,
    keyName: string,
    organizationId: string,
    userId: number,
    tier: string,
  ): AuditLogEntry {
    return this.logEvent('api_key_created', `API key created: ${keyName}`, {
      apiKeyId,
      keyName,
      tier,
    }, {
      organizationId,
      userId,
      apiKeyId,
      resourceType: 'api_key',
      resourceId: apiKeyId,
    });
  }

  /**
   * Log API key rotation
   */
  logApiKeyRotated(apiKeyId: string, organizationId: string, userId: number): AuditLogEntry {
    return this.logEvent('api_key_rotated', `API key rotated: ${apiKeyId}`, {
      apiKeyId,
    }, {
      organizationId,
      userId,
      apiKeyId,
      resourceType: 'api_key',
      resourceId: apiKeyId,
    });
  }

  /**
   * Log API key revocation
   */
  logApiKeyRevoked(apiKeyId: string, organizationId: string, userId: number): AuditLogEntry {
    return this.logEvent('api_key_revoked', `API key revoked: ${apiKeyId}`, {
      apiKeyId,
    }, {
      organizationId,
      userId,
      apiKeyId,
      resourceType: 'api_key',
      resourceId: apiKeyId,
    });
  }

  /**
   * Log webhook creation
   */
  logWebhookCreated(
    webhookId: string,
    webhookUrl: string,
    organizationId: string,
    userId: number,
  ): AuditLogEntry {
    return this.logEvent('webhook_created', `Webhook created: ${webhookUrl}`, {
      webhookId,
      webhookUrl,
    }, {
      organizationId,
      userId,
      resourceType: 'webhook',
      resourceId: webhookId,
    });
  }

  /**
   * Log team member addition
   */
  logTeamMemberAdded(
    userId: number,
    memberEmail: string,
    role: string,
    organizationId: string,
    invitedBy: number,
  ): AuditLogEntry {
    return this.logEvent('team_member_added', `Team member added: ${memberEmail} (${role})`, {
      userId,
      memberEmail,
      role,
    }, {
      organizationId,
      userId: invitedBy,
      resourceType: 'team_member',
      resourceId: userId.toString(),
    });
  }

  /**
   * Log plan upgrade
   */
  logPlanUpgrade(
    organizationId: string,
    fromPlan: string,
    toPlan: string,
    userId: number,
  ): AuditLogEntry {
    return this.logEvent('plan_upgraded', `Plan upgraded: ${fromPlan} → ${toPlan}`, {
      fromPlan,
      toPlan,
    }, {
      organizationId,
      userId,
      resourceType: 'organization',
      resourceId: organizationId,
    });
  }

  /**
   * Log billing payment
   */
  logBillingPayment(
    organizationId: string,
    amount: number,
    period: string,
    status: 'success' | 'failure',
    userId?: number,
    errorMessage?: string,
  ): AuditLogEntry {
    return this.logEvent('billing_payment', `Payment processed: $${(amount / 100).toFixed(2)}`, {
      amount,
      period,
    }, {
      organizationId,
      userId,
      status,
      errorMessage,
      resourceType: 'billing',
      resourceId: period,
    });
  }

  /**
   * Log error
   */
  logError(
    organizationId: string,
    endpoint: string,
    errorMessage: string,
    statusCode: number,
    userId?: number,
    ipAddress?: string,
  ): AuditLogEntry {
    return this.logEvent('error_occurred', `Error: ${errorMessage}`, {
      endpoint,
      statusCode,
      errorMessage,
    }, {
      organizationId,
      userId,
      ipAddress,
      status: 'failure',
      errorMessage,
    });
  }

  /**
   * Get audit logs with filtering
   */
  getAuditLogs(filter: AuditLogFilter): AuditLogEntry[] {
    let results = this.logs;

    // Filter by organization
    if (filter.organizationId) {
      results = results.filter((log) => log.organizationId === filter.organizationId);
    }

    // Filter by event type
    if (filter.eventType) {
      results = results.filter((log) => log.eventType === filter.eventType);
    }

    // Filter by user
    if (filter.userId) {
      results = results.filter((log) => log.userId === filter.userId);
    }

    // Filter by status
    if (filter.status) {
      results = results.filter((log) => log.status === filter.status);
    }

    // Filter by date range
    if (filter.startDate) {
      results = results.filter((log) => log.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      results = results.filter((log) => log.timestamp <= filter.endDate!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get audit log statistics
   */
  getAuditStats(organizationId?: string): AuditLogStats {
    let logs = this.logs;

    if (organizationId) {
      logs = logs.filter((log) => log.organizationId === organizationId);
    }

    const eventsByType: Record<AuditEventType, number> = {} as Record<AuditEventType, number>;
    const eventsByStatus: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      // Count by type
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;

      // Count by status
      eventsByStatus[log.status] = (eventsByStatus[log.status] || 0) + 1;

      // Calculate average duration
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }
    }

    const successCount = eventsByStatus['success'] || 0;
    const totalCount = logs.length;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    const averageResponseTime = durationCount > 0 ? totalDuration / durationCount : 0;

    return {
      totalEvents: totalCount,
      eventsByType,
      eventsByStatus,
      successRate,
      averageResponseTime,
    };
  }

  /**
   * Export audit logs
   */
  exportAuditLogs(filter: AuditLogFilter, format: 'json' | 'csv' = 'json'): string {
    const logs = this.getAuditLogs(filter);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = [
        'ID',
        'Timestamp',
        'Event Type',
        'Action',
        'User ID',
        'Organization ID',
        'Status',
        'IP Address',
        'Duration (ms)',
      ];

      const rows = logs.map((log) => [
        log.id,
        log.timestamp.toISOString(),
        log.eventType,
        log.action,
        log.userId || '',
        log.organizationId || '',
        log.status,
        log.ipAddress || '',
        log.duration || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return csv;
    }
  }

  /**
   * Get recent activity for organization
   */
  getRecentActivity(organizationId: string, limit: number = 50): AuditLogEntry[] {
    return this.getAuditLogs({
      organizationId,
      limit,
    });
  }

  /**
   * Get user activity
   */
  getUserActivity(userId: number, limit: number = 50): AuditLogEntry[] {
    return this.getAuditLogs({
      userId,
      limit,
    });
  }

  /**
   * Delete old logs (retention policy)
   */
  deleteOldLogs(daysToKeep: number = 90): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialLength = this.logs.length;

    this.logs = this.logs.filter((log) => log.timestamp > cutoffDate);

    // Rebuild index
    this.logIndex.clear();
    for (const log of this.logs) {
      if (log.organizationId) {
        const orgLogs = this.logIndex.get(log.organizationId) || [];
        orgLogs.push(log);
        this.logIndex.set(log.organizationId, orgLogs);
      }
    }

    const deletedCount = initialLength - this.logs.length;
    console.log(`[AuditLog] Deleted ${deletedCount} old audit logs (kept ${daysToKeep} days)`);

    return deletedCount;
  }
}

// Export singleton instance
export const auditLoggingService = new AuditLoggingService();
