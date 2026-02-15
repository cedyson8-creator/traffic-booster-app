/**
 * Alert Aggregation Service
 * Aggregates multiple alerts into digest emails sent at scheduled intervals
 */

export interface AlertEvent {
  id: string;
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AlertDigest {
  id: string;
  organizationId: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  alerts: AlertEvent[];
  createdAt: Date;
  sentAt?: Date;
  nextSendAt: Date;
  enabled: boolean;
}

export interface DigestEmail {
  to: string;
  subject: string;
  body: string;
  alerts: AlertEvent[];
  frequency: string;
  sentAt: Date;
}

export class AlertAggregationService {
  private digests: Map<string, AlertDigest> = new Map();
  private pendingAlerts: Map<string, AlertEvent[]> = new Map();
  private sentDigests: DigestEmail[] = [];

  /**
   * Create or update alert digest configuration
   */
  createDigest(
    organizationId: string,
    frequency: 'hourly' | 'daily' | 'weekly'
  ): AlertDigest {
    const digest: AlertDigest = {
      id: `digest-${Date.now()}`,
      organizationId,
      frequency,
      alerts: [],
      createdAt: new Date(),
      nextSendAt: this.calculateNextSendTime(frequency),
      enabled: true,
    };

    this.digests.set(digest.id, digest);
    this.pendingAlerts.set(organizationId, []);
    return digest;
  }

  /**
   * Add alert to pending queue for aggregation
   */
  addAlertToPending(organizationId: string, alert: AlertEvent): void {
    if (!this.pendingAlerts.has(organizationId)) {
      this.pendingAlerts.set(organizationId, []);
    }
    this.pendingAlerts.get(organizationId)!.push(alert);
  }

  /**
   * Get pending alerts for organization
   */
  getPendingAlerts(organizationId: string): AlertEvent[] {
    return this.pendingAlerts.get(organizationId) || [];
  }

  /**
   * Calculate next send time based on frequency
   */
  private calculateNextSendTime(frequency: 'hourly' | 'daily' | 'weekly'): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(9, 0, 0, 0); // 9 AM
        break;
      case 'weekly':
        next.setDate(next.getDate() + (1 + 7 - next.getDay()) % 7);
        next.setHours(9, 0, 0, 0); // 9 AM Monday
        break;
    }

    return next;
  }

  /**
   * Send digest for organization
   */
  sendDigest(organizationId: string, recipientEmail: string): DigestEmail | null {
    const digest = Array.from(this.digests.values()).find(
      d => d.organizationId === organizationId && d.enabled
    );

    if (!digest) {
      return null;
    }

    const pendingAlerts = this.pendingAlerts.get(organizationId) || [];
    if (pendingAlerts.length === 0) {
      return null; // No alerts to send
    }

    const digestEmail: DigestEmail = {
      to: recipientEmail,
      subject: this.generateDigestSubject(digest.frequency, pendingAlerts),
      body: this.generateDigestBody(digest.frequency, pendingAlerts),
      alerts: pendingAlerts,
      frequency: digest.frequency,
      sentAt: new Date(),
    };

    // Record sent digest
    this.sentDigests.push(digestEmail);

    // Clear pending alerts
    this.pendingAlerts.set(organizationId, []);

    // Update next send time
    digest.nextSendAt = this.calculateNextSendTime(digest.frequency);
    digest.sentAt = new Date();

    return digestEmail;
  }

  /**
   * Generate digest email subject
   */
  private generateDigestSubject(frequency: string, alerts: AlertEvent[]): string {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const highCount = alerts.filter(a => a.severity === 'high').length;
    const totalCount = alerts.length;

    let subject = `Alert Digest (${frequency.charAt(0).toUpperCase() + frequency.slice(1)})`;

    if (criticalCount > 0) {
      subject += ` - ${criticalCount} Critical`;
    }
    if (highCount > 0) {
      subject += ` - ${highCount} High`;
    }

    subject += ` - ${totalCount} Total Alerts`;

    return subject;
  }

  /**
   * Generate digest email body
   */
  private generateDigestBody(frequency: string, alerts: AlertEvent[]): string {
    const groupedBySeverity = this.groupAlertsBySeverity(alerts);

    let body = `Alert Digest Report (${frequency})\n`;
    body += `Generated: ${new Date().toISOString()}\n`;
    body += `Total Alerts: ${alerts.length}\n\n`;

    for (const severity of ['critical', 'high', 'medium', 'low']) {
      const severityAlerts = groupedBySeverity[severity] || [];
      if (severityAlerts.length > 0) {
        body += `\n${severity.toUpperCase()} (${severityAlerts.length}):\n`;
        body += '---\n';
        for (const alert of severityAlerts) {
          body += `- ${alert.message}\n`;
          body += `  Time: ${alert.timestamp.toISOString()}\n`;
        }
      }
    }

    body += '\n\nPlease review your dashboard for more details.';
    return body;
  }

  /**
   * Group alerts by severity
   */
  private groupAlertsBySeverity(alerts: AlertEvent[]): Record<string, AlertEvent[]> {
    const grouped: Record<string, AlertEvent[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const alert of alerts) {
      grouped[alert.severity].push(alert);
    }

    return grouped;
  }

  /**
   * Get digest by ID
   */
  getDigest(id: string): AlertDigest | undefined {
    return this.digests.get(id);
  }

  /**
   * Get digest for organization
   */
  getOrganizationDigest(organizationId: string): AlertDigest | undefined {
    return Array.from(this.digests.values()).find(d => d.organizationId === organizationId);
  }

  /**
   * Update digest frequency
   */
  updateDigestFrequency(
    organizationId: string,
    frequency: 'hourly' | 'daily' | 'weekly'
  ): AlertDigest | null {
    const digest = this.getOrganizationDigest(organizationId);
    if (!digest) {
      return null;
    }

    digest.frequency = frequency;
    digest.nextSendAt = this.calculateNextSendTime(frequency);
    return digest;
  }

  /**
   * Enable/disable digest
   */
  setDigestEnabled(organizationId: string, enabled: boolean): AlertDigest | null {
    const digest = this.getOrganizationDigest(organizationId);
    if (!digest) {
      return null;
    }

    digest.enabled = enabled;
    return digest;
  }

  /**
   * Get digests due for sending
   */
  getDigestsDue(): AlertDigest[] {
    const now = new Date();
    return Array.from(this.digests.values()).filter(
      d => d.enabled && d.nextSendAt <= now
    );
  }

  /**
   * Get sent digest history
   */
  getSentDigestHistory(organizationId?: string, limit: number = 10): DigestEmail[] {
    let history = this.sentDigests;

    if (organizationId) {
      // Filter by organization (would need to track org ID in DigestEmail)
      // For now, return all
    }

    return history.slice(-limit).reverse();
  }

  /**
   * Get digest statistics
   */
  getDigestStats(): Record<string, unknown> {
    return {
      totalDigests: this.digests.size,
      enabledDigests: Array.from(this.digests.values()).filter(d => d.enabled).length,
      sentDigests: this.sentDigests.length,
      pendingAlerts: Array.from(this.pendingAlerts.values()).reduce((sum, alerts) => sum + alerts.length, 0),
      averageAlertsPerDigest: this.sentDigests.length > 0
        ? this.sentDigests.reduce((sum, d) => sum + d.alerts.length, 0) / this.sentDigests.length
        : 0,
    };
  }

  /**
   * Clear old sent digests (cleanup)
   */
  clearOldDigests(daysOld: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = this.sentDigests.length;
    this.sentDigests = this.sentDigests.filter(d => d.sentAt > cutoffDate);
    return initialLength - this.sentDigests.length;
  }

  /**
   * Export digests as JSON
   */
  exportDigests(): string {
    return JSON.stringify({
      digests: Array.from(this.digests.values()),
      sentHistory: this.sentDigests,
    }, null, 2);
  }

  /**
   * Test digest email generation
   */
  testDigestEmail(organizationId: string, recipientEmail: string): DigestEmail | null {
    // Create test alerts
    const testAlerts: AlertEvent[] = [
      {
        id: 'test-1',
        alertId: 'alert-1',
        severity: 'critical',
        message: 'Critical error rate exceeded 10%',
        timestamp: new Date(),
      },
      {
        id: 'test-2',
        alertId: 'alert-2',
        severity: 'high',
        message: 'API latency exceeded 2000ms',
        timestamp: new Date(),
      },
      {
        id: 'test-3',
        alertId: 'alert-3',
        severity: 'medium',
        message: 'Webhook delivery failure rate at 5%',
        timestamp: new Date(),
      },
    ];

    const digest = this.getOrganizationDigest(organizationId);
    if (!digest) {
      return null;
    }

    return {
      to: recipientEmail,
      subject: this.generateDigestSubject(digest.frequency, testAlerts),
      body: this.generateDigestBody(digest.frequency, testAlerts),
      alerts: testAlerts,
      frequency: digest.frequency,
      sentAt: new Date(),
    };
  }
}

export const alertAggregationService = new AlertAggregationService();
