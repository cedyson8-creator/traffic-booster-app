import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import { ReportBuilder, ReportTemplate } from './report-builder';

interface ReportCustomizationModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (metrics: string[], format: 'pdf' | 'csv' | 'json', useRealData?: boolean) => Promise<void>;
  isLoading?: boolean;
  userId?: number;
  websiteId?: number;
}

export function ReportCustomizationModal({
  visible,
  onClose,
  onExport,
  isLoading = false,
  userId,
  websiteId,
}: ReportCustomizationModalProps) {
  const colors = useColors();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [exporting, setExporting] = useState(false);
  const [useRealData, setUseRealData] = useState(false);

  const handleExport = async () => {
    if (selectedMetrics.length === 0) {
      alert('Please select at least one metric');
      return;
    }

    if (useRealData && (!userId || !websiteId)) {
      alert('Real data export requires website information');
      return;
    }

    setExporting(true);
    try {
      await onExport(selectedMetrics, exportFormat, useRealData);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={{ backgroundColor: colors.background }} className="flex-1">
        {/* Header */}
        <View
          style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}
          className="flex-row items-center justify-between p-4 border-b"
        >
          <Text className="text-lg font-bold text-foreground">Customize Report</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-lg font-semibold text-primary">✕</Text>
          </Pressable>
        </View>

        {/* Report Builder */}
        <ReportBuilder
          defaultMetrics={selectedMetrics}
          onMetricsSelected={setSelectedMetrics}
        />

        {/* Data Source Selection */}
        {userId && websiteId && (
          <View
            style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
            className="border-t p-4 gap-3"
          >
            <Text className="font-semibold text-foreground">Data Source</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setUseRealData(false)}
                style={({ pressed }) => [
                  {
                    backgroundColor: !useRealData ? colors.primary : colors.background,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="flex-1 p-3 rounded-lg border border-border items-center"
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    !useRealData ? 'text-background' : 'text-foreground'
                  )}
                >
                  📊 Mock Data
                </Text>
                <Text
                  className={cn(
                    'text-xs mt-1',
                    !useRealData ? 'text-background/70' : 'text-muted'
                  )}
                >
                  Quick preview
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setUseRealData(true)}
                style={({ pressed }) => [
                  {
                    backgroundColor: useRealData ? colors.primary : colors.background,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="flex-1 p-3 rounded-lg border border-border items-center"
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    useRealData ? 'text-background' : 'text-foreground'
                  )}
                >
                  🔗 Real Data
                </Text>
                <Text
                  className={cn(
                    'text-xs mt-1',
                    useRealData ? 'text-background/70' : 'text-muted'
                  )}
                >
                  Production
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Export Format Selection */}
        <View
          style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
          className="border-t p-4 gap-3"
        >
          <Text className="font-semibold text-foreground">Export Format</Text>
          
          <View className="flex-row gap-2">
            {(['pdf', 'csv', 'json'] as const).map((format) => (
              <Pressable
                key={format}
                onPress={() => setExportFormat(format)}
                style={({ pressed }) => [
                  {
                    backgroundColor:
                      exportFormat === format ? colors.primary : colors.background,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="flex-1 p-3 rounded-lg border border-border items-center"
              >
                <Text
                  className={cn(
                    'font-semibold uppercase text-sm',
                    exportFormat === format ? 'text-background' : 'text-foreground'
                  )}
                >
                  {format}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
          className="border-t p-4 gap-2 flex-row"
        >
          <Pressable
            onPress={onClose}
            disabled={exporting || isLoading}
            style={({ pressed }) => [
              {
                backgroundColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            className="flex-1 p-4 rounded-lg items-center"
          >
            <Text className="font-semibold text-foreground">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleExport}
            disabled={exporting || isLoading || selectedMetrics.length === 0}
            style={({ pressed }) => [
              {
                backgroundColor:
                  exporting || isLoading || selectedMetrics.length === 0
                    ? colors.border
                    : colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            className="flex-1 p-4 rounded-lg items-center"
          >
            <Text className="font-semibold text-background">
              {exporting || isLoading ? 'Exporting...' : 'Export Report'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
