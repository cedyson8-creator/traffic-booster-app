import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export interface TrafficReport {
  websiteId: string;
  websiteName: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalVisits: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
  dailyData: Array<{
    date: string;
    visits: number;
    uniqueVisitors: number;
  }>;
  campaigns: Array<{
    name: string;
    visits: number;
    conversions: number;
    roi: number;
  }>;
}

interface ExportDialogProps {
  visible: boolean;
  onClose: () => void;
  report: TrafficReport | null;
}

/**
 * Export dialog component for downloading traffic reports
 * Supports PDF, CSV, and JSON formats
 */
export function ExportDialog({ visible, onClose, report }: ExportDialogProps) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  const handleExport = async () => {
    if (!report) return;

    setLoading(true);
    try {
      // Call the export API
      const response = await fetch(`http://localhost:3000/api/export/${selectedFormat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the file content
      const blob = await response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const fileUri = `${FileSystem.documentDirectory}traffic-report-${Date.now()}.${selectedFormat}`;
          
          // Write file
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: 'base64',
          });

          // Share the file
          await shareAsync(fileUri, {
            mimeType: selectedFormat === 'pdf' ? 'application/pdf' : 'text/plain',
            dialogTitle: `Share Traffic Report`,
          });
        } catch (shareError) {
          console.error('Share error:', shareError);
          Alert.alert('Success', `Report exported as ${selectedFormat.toUpperCase()}`);
        }
      };
      reader.readAsDataURL(blob);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        className="flex-1 bg-black/50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <View
          className="absolute bottom-0 w-full rounded-t-3xl p-6"
          style={{ backgroundColor: colors.background }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-foreground">
                Export Report
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text className="text-2xl text-foreground">✕</Text>
              </Pressable>
            </View>

            {/* Format selection */}
            <Text className="text-lg font-semibold text-foreground mb-3">
              Select Format
            </Text>

            {/* PDF Option */}
            <Pressable
              onPress={() => setSelectedFormat('pdf')}
              style={({ pressed }) => [
                {
                  backgroundColor: selectedFormat === 'pdf' ? colors.primary : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="p-4 rounded-lg mb-3 flex-row items-center"
            >
              <View
                className="w-6 h-6 rounded-full border-2 items-center justify-center mr-3"
                style={{
                  borderColor: selectedFormat === 'pdf' ? colors.primary : colors.border,
                }}
              >
                {selectedFormat === 'pdf' && (
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">PDF Report</Text>
                <Text className="text-sm text-muted">Professional formatted document</Text>
              </View>
            </Pressable>

            {/* CSV Option */}
            <Pressable
              onPress={() => setSelectedFormat('csv')}
              style={({ pressed }) => [
                {
                  backgroundColor: selectedFormat === 'csv' ? colors.primary : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="p-4 rounded-lg mb-3 flex-row items-center"
            >
              <View
                className="w-6 h-6 rounded-full border-2 items-center justify-center mr-3"
                style={{
                  borderColor: selectedFormat === 'csv' ? colors.primary : colors.border,
                }}
              >
                {selectedFormat === 'csv' && (
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">CSV Export</Text>
                <Text className="text-sm text-muted">Spreadsheet compatible format</Text>
              </View>
            </Pressable>

            {/* JSON Option */}
            <Pressable
              onPress={() => setSelectedFormat('json')}
              style={({ pressed }) => [
                {
                  backgroundColor: selectedFormat === 'json' ? colors.primary : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="p-4 rounded-lg mb-6 flex-row items-center"
            >
              <View
                className="w-6 h-6 rounded-full border-2 items-center justify-center mr-3"
                style={{
                  borderColor: selectedFormat === 'json' ? colors.primary : colors.border,
                }}
              >
                {selectedFormat === 'json' && (
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">JSON Data</Text>
                <Text className="text-sm text-muted">Raw data format for developers</Text>
              </View>
            </Pressable>

            {/* Export button */}
            <Pressable
              onPress={handleExport}
              disabled={loading}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.8 : 1,
                },
              ]}
              className="p-4 rounded-lg items-center mb-3"
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="font-semibold text-background">
                  Download {selectedFormat.toUpperCase()}
                </Text>
              )}
            </Pressable>

            {/* Cancel button */}
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
              className="p-4 rounded-lg items-center"
            >
              <Text className="font-semibold text-foreground">Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
