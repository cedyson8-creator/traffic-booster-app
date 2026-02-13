import { Campaign, Website } from './types';
import { ABTest, ABTestMetrics } from './ab-testing-types';
import { CampaignMetrics } from './recommendations-service';

export interface ReportOptions {
  title: string;
  includeCharts: boolean;
  includeRecommendations: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  logo?: string;
  companyName?: string;
}

export interface CampaignReport {
  campaign: Campaign;
  website: Website;
  metrics: CampaignMetrics;
  recommendations?: string[];
  generatedAt: Date;
}

export interface ABTestReport {
  test: ABTest;
  metrics: ABTestMetrics;
  recommendation: string;
  generatedAt: Date;
}

/**
 * Generate CSV data for campaign report
 */
export function generateCampaignCSV(report: CampaignReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Traffic Booster Pro - Campaign Report');
  lines.push(`Generated: ${report.generatedAt.toLocaleString()}`);
  lines.push('');

  // Campaign Info
  lines.push('CAMPAIGN INFORMATION');
  lines.push(`Campaign Name,${report.campaign.name}`);
  lines.push(`Website,${report.website.name}`);
  lines.push(`Website URL,${report.website.url}`);
  lines.push(`Campaign Type,${report.campaign.type}`);
  lines.push(`Status,${report.campaign.status}`);
  lines.push(`Start Date,${new Date(report.campaign.startDate).toLocaleDateString()}`);
  lines.push('');

  // Metrics
  lines.push('CAMPAIGN METRICS');
  lines.push(`Total Visits,${report.metrics.totalVisits}`);
  lines.push(`Target Visits,${report.metrics.targetVisits}`);
  lines.push(`Conversion Rate,${report.metrics.conversionRate.toFixed(2)}%`);
  lines.push(`Cost Per Visit,${report.metrics.costPerVisit.toFixed(2)}`);
  lines.push(`ROI,${report.metrics.roi.toFixed(2)}%`);
  lines.push(`Completion,${report.metrics.completionPercentage.toFixed(2)}%`);
  lines.push('');

  // Daily Progress
  lines.push('DAILY PROGRESS');
  lines.push('Day,Visits');
  report.metrics.dailyProgress.forEach((visits, index) => {
    lines.push(`Day ${index + 1},${visits}`);
  });
  lines.push('');

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    report.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate CSV data for A/B test report
 */
export function generateABTestCSV(report: ABTestReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Traffic Booster Pro - A/B Test Report');
  lines.push(`Generated: ${report.generatedAt.toLocaleString()}`);
  lines.push('');

  // Test Info
  lines.push('TEST INFORMATION');
  lines.push(`Test Name,${report.test.name}`);
  lines.push(`Description,${report.test.description}`);
  lines.push(`Type,${report.test.type}`);
  lines.push(`Status,${report.test.status}`);
  lines.push(`Start Date,${new Date(report.test.startDate).toLocaleDateString()}`);
  lines.push('');

  // Overall Metrics
  lines.push('OVERALL METRICS');
  lines.push(`Total Visits,${report.metrics.totalVisits}`);
  lines.push(`Total Conversions,${report.metrics.totalConversions}`);
  lines.push(`Overall Conversion Rate,${report.metrics.overallConversionRate.toFixed(2)}%`);
  lines.push(`Statistical Significance,${report.metrics.statisticalSignificance.toFixed(1)}%`);
  lines.push(`Recommended Action,${report.metrics.recommendedAction}`);
  lines.push('');

  // Variation Performance
  lines.push('VARIATION PERFORMANCE');
  lines.push('Variation,Visits,Conversions,Conversion Rate,Improvement');
  report.test.variations.forEach((variation) => {
    const improvement = variation === report.test.variations[0]
      ? '0%'
      : `${(
          ((variation.conversionRate - report.test.variations[0].conversionRate) /
            report.test.variations[0].conversionRate) *
          100
        ).toFixed(1)}%`;
    lines.push(
      `${variation.name},${variation.visits},${variation.conversions},${variation.conversionRate.toFixed(
        2
      )}%,${improvement}`
    );
  });
  lines.push('');

  // Recommendation
  lines.push('RECOMMENDATION');
  lines.push(report.recommendation);

  return lines.join('\n');
}

/**
 * Generate HTML for PDF (can be converted to PDF using manus-md-to-pdf)
 */
export function generateCampaignHTML(report: CampaignReport): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Campaign Report - ${report.campaign.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #0a7ea4;
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 10px;
    }
    h2 {
      color: #0a7ea4;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      padding: 20px;
      background: #f0f7ff;
      border-left: 4px solid #0a7ea4;
      border-radius: 4px;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #0a7ea4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #0a7ea4;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .recommendation-box {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Campaign Performance Report</h1>
    
    <div class="header-info">
      <div class="info-item">
        <span class="info-label">Campaign Name</span>
        <span class="info-value">${report.campaign.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Website</span>
        <span class="info-value">${report.website.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Campaign Type</span>
        <span class="info-value">${report.campaign.type}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status</span>
        <span class="info-value">${report.campaign.status}</span>
      </div>
    </div>

    <h2>Key Metrics</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Visits</div>
        <div class="metric-value">${report.metrics.totalVisits.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Target Visits</div>
        <div class="metric-value">${report.metrics.targetVisits.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ROI</div>
        <div class="metric-value">${report.metrics.roi.toFixed(2)}%</div>
      </div>
    </div>

    <h2>Daily Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Day</th>
          <th>Visits</th>
        </tr>
      </thead>
      <tbody>
        ${report.metrics.dailyProgress
          .map(
            (visits, index) => `
          <tr>
            <td>Day ${index + 1}</td>
            <td>${visits.toLocaleString()}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    ${
      report.recommendations && report.recommendations.length > 0
        ? `
    <h2>Recommendations</h2>
    ${report.recommendations
      .map(
        (rec) => `
      <div class="recommendation-box">
        <strong>✓</strong> ${rec}
      </div>
    `
      )
      .join('')}
    `
        : ''
    }

    <div class="footer">
      <p>Report generated on ${report.generatedAt.toLocaleString()}</p>
      <p>Traffic Booster Pro - Campaign Analytics Platform</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate HTML for A/B test PDF
 */
export function generateABTestHTML(report: ABTestReport): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>A/B Test Report - ${report.test.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #0a7ea4;
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 10px;
    }
    h2 {
      color: #0a7ea4;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      padding: 20px;
      background: #f0f7ff;
      border-left: 4px solid #0a7ea4;
      border-radius: 4px;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #0a7ea4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #0a7ea4;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .winner {
      background: #e8f5e9 !important;
      font-weight: bold;
    }
    .recommendation-box {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>A/B Test Report</h1>
    
    <h2>Test Information</h2>
    <p><strong>Test Name:</strong> ${report.test.name}</p>
    <p><strong>Description:</strong> ${report.test.description}</p>
    <p><strong>Type:</strong> ${report.test.type}</p>
    <p><strong>Status:</strong> ${report.test.status}</p>

    <h2>Overall Metrics</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Visits</div>
        <div class="metric-value">${report.metrics.totalVisits.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Conversions</div>
        <div class="metric-value">${report.metrics.totalConversions.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Significance</div>
        <div class="metric-value">${report.metrics.statisticalSignificance.toFixed(1)}%</div>
      </div>
    </div>

    <h2>Variation Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Variation</th>
          <th>Visits</th>
          <th>Conversions</th>
          <th>Conversion Rate</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.test.variations
          .map(
            (variation) => `
          <tr ${variation.id === report.test.winnerId ? 'class="winner"' : ''}>
            <td>${variation.name}</td>
            <td>${variation.visits.toLocaleString()}</td>
            <td>${variation.conversions.toLocaleString()}</td>
            <td>${variation.conversionRate.toFixed(2)}%</td>
            <td>${variation.id === report.test.winnerId ? '🏆 Winner' : 'Variation'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <h2>Recommendation</h2>
    <div class="recommendation-box">
      ${report.recommendation}
    </div>

    <div class="footer">
      <p>Report generated on ${report.generatedAt.toLocaleString()}</p>
      <p>Traffic Booster Pro - A/B Testing Platform</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}
