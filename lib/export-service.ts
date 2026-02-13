import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { Campaign, Website } from './types';
import { ABTest, ABTestMetrics } from './ab-testing-types';
import { CampaignMetrics } from './recommendations-service';
import {
  generateCampaignCSV,
  generateABTestCSV,
  generateCampaignHTML,
  generateABTestHTML,
  CampaignReport,
  ABTestReport,
} from './report-generator';

/**
 * Export campaign report as CSV
 */
export async function exportCampaignAsCSV(
  campaign: Campaign,
  website: Website,
  metrics: CampaignMetrics,
  recommendations?: string[]
): Promise<string> {
  try {
    const report: CampaignReport = {
      campaign,
      website,
      metrics,
      recommendations,
      generatedAt: new Date(),
    };

    const csv = generateCampaignCSV(report);
    const fileName = `campaign-${campaign.id}-${Date.now()}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csv);

    if (Platform.OS === 'web') {
      // For web, create a blob and download
      downloadFileWeb(csv, fileName, 'text/csv');
      return filePath;
    }

    return filePath;
  } catch (error) {
    console.error('[ExportService] Failed to export campaign as CSV:', error);
    throw error;
  }
}

/**
 * Export campaign report as PDF (HTML)
 */
export async function exportCampaignAsPDF(
  campaign: Campaign,
  website: Website,
  metrics: CampaignMetrics,
  recommendations?: string[]
): Promise<string> {
  try {
    const report: CampaignReport = {
      campaign,
      website,
      metrics,
      recommendations,
      generatedAt: new Date(),
    };

    const html = generateCampaignHTML(report);
    const fileName = `campaign-${campaign.id}-${Date.now()}.html`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, html);

    if (Platform.OS === 'web') {
      downloadFileWeb(html, fileName, 'text/html');
      return filePath;
    }

    return filePath;
  } catch (error) {
    console.error('[ExportService] Failed to export campaign as PDF:', error);
    throw error;
  }
}

/**
 * Export A/B test report as CSV
 */
export async function exportABTestAsCSV(
  test: ABTest,
  metrics: ABTestMetrics,
  recommendation: string
): Promise<string> {
  try {
    const report: ABTestReport = {
      test,
      metrics,
      recommendation,
      generatedAt: new Date(),
    };

    const csv = generateABTestCSV(report);
    const fileName = `ab-test-${test.id}-${Date.now()}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csv);

    if (Platform.OS === 'web') {
      downloadFileWeb(csv, fileName, 'text/csv');
      return filePath;
    }

    return filePath;
  } catch (error) {
    console.error('[ExportService] Failed to export A/B test as CSV:', error);
    throw error;
  }
}

/**
 * Export A/B test report as PDF (HTML)
 */
export async function exportABTestAsPDF(
  test: ABTest,
  metrics: ABTestMetrics,
  recommendation: string
): Promise<string> {
  try {
    const report: ABTestReport = {
      test,
      metrics,
      recommendation,
      generatedAt: new Date(),
    };

    const html = generateABTestHTML(report);
    const fileName = `ab-test-${test.id}-${Date.now()}.html`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, html);

    if (Platform.OS === 'web') {
      downloadFileWeb(html, fileName, 'text/html');
      return filePath;
    }

    return filePath;
  } catch (error) {
    console.error('[ExportService] Failed to export A/B test as PDF:', error);
    throw error;
  }
}

/**
 * Download file on web platform
 */
function downloadFileWeb(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share file (native only)
 */
export async function shareFile(filePath: string, fileName: string): Promise<void> {
  if (Platform.OS === 'web') {
    console.warn('[ExportService] Share is not supported on web');
    return;
  }

  try {
    // This would use react-native-share or similar library
    console.log('[ExportService] Sharing file:', filePath);
  } catch (error) {
    console.error('[ExportService] Failed to share file:', error);
    throw error;
  }
}
