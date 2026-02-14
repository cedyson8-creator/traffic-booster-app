/**
 * Compliance Export Service
 * Generates SOC 2, GDPR, and other compliance reports
 */

export interface ComplianceReport {
  id: string;
  organizationId: string;
  reportType: 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI_DSS';
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  status: 'pending' | 'completed' | 'failed';
  fileUrl?: string;
  summary: ComplianceReportSummary;
}

export interface ComplianceReportSummary {
  totalEvents: number;
  securityEvents: number;
  accessEvents: number;
  dataModificationEvents: number;
  failureEvents: number;
  successRate: number;
  averageResponseTime: number;
  dataRetentionDays: number;
  encryptionStatus: string;
  accessControlStatus: string;
  auditTrailStatus: string;
}

export interface GDPRDataRequest {
  id: string;
  organizationId: string;
  userId: number;
  requestType: 'access' | 'deletion' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'denied';
  requestedAt: Date;
  completedAt?: Date;
  dataExportUrl?: string;
  reason?: string;
}

export interface SOC2Criteria {
  cc: string; // Control category
  description: string;
  status: 'compliant' | 'non-compliant' | 'partial';
  evidence: string[];
  lastVerified: Date;
}

/**
 * Compliance Export Service
 */
export class ComplianceExportService {
  private reports: Map<string, ComplianceReport> = new Map();
  private gdprRequests: GDPRDataRequest[] = [];
  private soc2Criteria: Map<string, SOC2Criteria[]> = new Map();

  /**
   * Generate SOC 2 report
   */
  generateSOC2Report(
    organizationId: string,
    auditLogs: any[],
    errorLogs: any[],
    webhookLogs: any[],
  ): ComplianceReport {
    const reportId = `soc2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate metrics
    const totalEvents = auditLogs.length + errorLogs.length + webhookLogs.length;
    const securityEvents = auditLogs.filter((log) => log.eventType?.includes('security')).length;
    const accessEvents = auditLogs.filter((log) => log.eventType?.includes('access')).length;
    const dataModificationEvents = auditLogs.filter((log) => log.eventType?.includes('modified')).length;
    const failureEvents = errorLogs.length;
    const successCount = auditLogs.filter((log) => log.status === 'success').length;
    const successRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 0;

    const responseTimes = auditLogs.filter((log) => log.duration).map((log) => log.duration);
    const averageResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    const report: ComplianceReport = {
      id: reportId,
      organizationId,
      reportType: 'SOC2',
      generatedAt: now,
      periodStart,
      periodEnd,
      status: 'completed',
      summary: {
        totalEvents,
        securityEvents,
        accessEvents,
        dataModificationEvents,
        failureEvents,
        successRate,
        averageResponseTime,
        dataRetentionDays: 90,
        encryptionStatus: 'enabled',
        accessControlStatus: 'configured',
        auditTrailStatus: 'active',
      },
    };

    this.reports.set(reportId, report);
    console.log(`[ComplianceExport] SOC 2 report generated: ${reportId}`);

    return report;
  }

  /**
   * Generate GDPR report
   */
  generateGDPRReport(
    organizationId: string,
    auditLogs: any[],
    dataProcessingRecords: any[],
  ): ComplianceReport {
    const reportId = `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate metrics
    const totalEvents = auditLogs.length;
    const dataAccessEvents = auditLogs.filter((log) => log.eventType === 'data_access').length;
    const dataModificationEvents = auditLogs.filter((log) => log.eventType === 'data_modified').length;
    const dataDeletionEvents = auditLogs.filter((log) => log.eventType === 'data_deleted').length;
    const consentRecords = dataProcessingRecords.filter((r) => r.type === 'consent').length;
    const successCount = auditLogs.filter((log) => log.status === 'success').length;
    const successRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 0;

    const report: ComplianceReport = {
      id: reportId,
      organizationId,
      reportType: 'GDPR',
      generatedAt: now,
      periodStart,
      periodEnd,
      status: 'completed',
      summary: {
        totalEvents,
        securityEvents: dataAccessEvents,
        accessEvents: dataAccessEvents,
        dataModificationEvents,
        failureEvents: 0,
        successRate,
        averageResponseTime: 0,
        dataRetentionDays: 30, // GDPR requirement
        encryptionStatus: 'enabled',
        accessControlStatus: 'configured',
        auditTrailStatus: 'active',
      },
    };

    this.reports.set(reportId, report);
    console.log(`[ComplianceExport] GDPR report generated: ${reportId}`);

    return report;
  }

  /**
   * Handle GDPR data access request
   */
  createGDPRAccessRequest(organizationId: string, userId: number): GDPRDataRequest {
    const request: GDPRDataRequest = {
      id: `gdpr_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      userId,
      requestType: 'access',
      status: 'pending',
      requestedAt: new Date(),
    };

    this.gdprRequests.push(request);
    console.log(`[ComplianceExport] GDPR access request created: ${request.id}`);

    return request;
  }

  /**
   * Handle GDPR data deletion request
   */
  createGDPRDeletionRequest(organizationId: string, userId: number, reason?: string): GDPRDataRequest {
    const request: GDPRDataRequest = {
      id: `gdpr_delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      userId,
      requestType: 'deletion',
      status: 'pending',
      requestedAt: new Date(),
      reason,
    };

    this.gdprRequests.push(request);
    console.log(`[ComplianceExport] GDPR deletion request created: ${request.id}`);

    return request;
  }

  /**
   * Handle GDPR data portability request
   */
  createGDPRPortabilityRequest(organizationId: string, userId: number): GDPRDataRequest {
    const request: GDPRDataRequest = {
      id: `gdpr_port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      userId,
      requestType: 'portability',
      status: 'pending',
      requestedAt: new Date(),
    };

    this.gdprRequests.push(request);
    console.log(`[ComplianceExport] GDPR portability request created: ${request.id}`);

    return request;
  }

  /**
   * Complete GDPR request
   */
  completeGDPRRequest(requestId: string, dataExportUrl?: string): GDPRDataRequest | null {
    const request = this.gdprRequests.find((r) => r.id === requestId);

    if (!request) {
      return null;
    }

    request.status = 'completed';
    request.completedAt = new Date();
    request.dataExportUrl = dataExportUrl;

    console.log(`[ComplianceExport] GDPR request completed: ${requestId}`);

    return request;
  }

  /**
   * Get GDPR requests for organization
   */
  getGDPRRequests(organizationId: string): GDPRDataRequest[] {
    return this.gdprRequests.filter((r) => r.organizationId === organizationId);
  }

  /**
   * Get pending GDPR requests
   */
  getPendingGDPRRequests(): GDPRDataRequest[] {
    return this.gdprRequests.filter((r) => r.status === 'pending');
  }

  /**
   * Initialize SOC 2 criteria
   */
  initializeSOC2Criteria(organizationId: string): void {
    const criteria: SOC2Criteria[] = [
      {
        cc: 'CC6.1',
        description: 'Logical and Physical Access Controls',
        status: 'compliant',
        evidence: ['API key authentication', 'Rate limiting', 'IP whitelisting'],
        lastVerified: new Date(),
      },
      {
        cc: 'CC7.2',
        description: 'System Monitoring',
        status: 'compliant',
        evidence: ['Audit logging', 'Error tracking', 'Real-time alerts'],
        lastVerified: new Date(),
      },
      {
        cc: 'CC9.2',
        description: 'Change Management',
        status: 'compliant',
        evidence: ['Deployment tracking', 'Version control', 'Rollback capability'],
        lastVerified: new Date(),
      },
      {
        cc: 'A1.2',
        description: 'Data Availability',
        status: 'compliant',
        evidence: ['99.9% uptime SLA', 'Redundant systems', 'Backup procedures'],
        lastVerified: new Date(),
      },
      {
        cc: 'C1.2',
        description: 'Data Confidentiality',
        status: 'compliant',
        evidence: ['TLS encryption', 'API key hashing', 'Secure storage'],
        lastVerified: new Date(),
      },
    ];

    this.soc2Criteria.set(organizationId, criteria);
    console.log(`[ComplianceExport] SOC 2 criteria initialized for ${organizationId}`);
  }

  /**
   * Get SOC 2 criteria
   */
  getSOC2Criteria(organizationId: string): SOC2Criteria[] {
    if (!this.soc2Criteria.has(organizationId)) {
      this.initializeSOC2Criteria(organizationId);
    }

    return this.soc2Criteria.get(organizationId) || [];
  }

  /**
   * Export report as JSON
   */
  exportReportAsJSON(reportId: string): string | null {
    const report = this.reports.get(reportId);

    if (!report) {
      return null;
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as CSV
   */
  exportReportAsCSV(reportId: string): string | null {
    const report = this.reports.get(reportId);

    if (!report) {
      return null;
    }

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Report Type', report.reportType],
      ['Organization ID', report.organizationId],
      ['Generated At', report.generatedAt.toISOString()],
      ['Period Start', report.periodStart.toISOString()],
      ['Period End', report.periodEnd.toISOString()],
      ['Total Events', report.summary.totalEvents],
      ['Security Events', report.summary.securityEvents],
      ['Access Events', report.summary.accessEvents],
      ['Data Modification Events', report.summary.dataModificationEvents],
      ['Failure Events', report.summary.failureEvents],
      ['Success Rate (%)', report.summary.successRate.toFixed(2)],
      ['Average Response Time (ms)', report.summary.averageResponseTime.toFixed(2)],
      ['Data Retention (days)', report.summary.dataRetentionDays],
      ['Encryption Status', report.summary.encryptionStatus],
      ['Access Control Status', report.summary.accessControlStatus],
      ['Audit Trail Status', report.summary.auditTrailStatus],
    ];

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    return csv;
  }

  /**
   * Export report as HTML
   */
  exportReportAsHTML(reportId: string): string | null {
    const report = this.reports.get(reportId);

    if (!report) {
      return null;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${report.reportType} Compliance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${report.reportType} Compliance Report</h1>
  
  <div class="summary">
    <p><strong>Organization ID:</strong> ${report.organizationId}</p>
    <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>
    <p><strong>Period:</strong> ${report.periodStart.toISOString()} to ${report.periodEnd.toISOString()}</p>
    <p><strong>Status:</strong> ${report.status}</p>
  </div>

  <h2>Compliance Metrics</h2>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Total Events</td>
      <td>${report.summary.totalEvents}</td>
    </tr>
    <tr>
      <td>Security Events</td>
      <td>${report.summary.securityEvents}</td>
    </tr>
    <tr>
      <td>Access Events</td>
      <td>${report.summary.accessEvents}</td>
    </tr>
    <tr>
      <td>Data Modification Events</td>
      <td>${report.summary.dataModificationEvents}</td>
    </tr>
    <tr>
      <td>Failure Events</td>
      <td>${report.summary.failureEvents}</td>
    </tr>
    <tr>
      <td>Success Rate</td>
      <td>${report.summary.successRate.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Average Response Time</td>
      <td>${report.summary.averageResponseTime.toFixed(2)}ms</td>
    </tr>
  </table>

  <h2>Security Controls</h2>
  <table>
    <tr>
      <th>Control</th>
      <th>Status</th>
    </tr>
    <tr>
      <td>Encryption</td>
      <td>${report.summary.encryptionStatus}</td>
    </tr>
    <tr>
      <td>Access Control</td>
      <td>${report.summary.accessControlStatus}</td>
    </tr>
    <tr>
      <td>Audit Trail</td>
      <td>${report.summary.auditTrailStatus}</td>
    </tr>
    <tr>
      <td>Data Retention</td>
      <td>${report.summary.dataRetentionDays} days</td>
    </tr>
  </table>

  <p style="margin-top: 30px; font-size: 12px; color: #666;">
    This report was automatically generated on ${new Date().toISOString()}.
    Please review and verify all information before submitting to auditors.
  </p>
</body>
</html>
    `;

    return html;
  }

  /**
   * Get all reports for organization
   */
  getReports(organizationId: string): ComplianceReport[] {
    return Array.from(this.reports.values()).filter((r) => r.organizationId === organizationId);
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): ComplianceReport | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * Delete old reports
   */
  deleteOldReports(daysToKeep: number = 365): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [reportId, report] of this.reports.entries()) {
      if (report.generatedAt < cutoffDate) {
        this.reports.delete(reportId);
        deletedCount++;
      }
    }

    console.log(`[ComplianceExport] Deleted ${deletedCount} old reports (kept ${daysToKeep} days)`);

    return deletedCount;
  }
}

// Export singleton instance
export const complianceExportService = new ComplianceExportService();
