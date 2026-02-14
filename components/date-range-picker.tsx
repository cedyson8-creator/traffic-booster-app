import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date;
  end: Date;
}

export type DateRangePreset = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'custom';

interface DateRangePickerProps {
  selectedRange: DateRange;
  onSelectRange: (range: DateRange) => void;
}

const PRESETS = [
  { id: 'last7days' as DateRangePreset, label: 'Last 7 Days' },
  { id: 'last30days' as DateRangePreset, label: 'Last 30 Days' },
  { id: 'last90days' as DateRangePreset, label: 'Last 90 Days' },
  { id: 'lastYear' as DateRangePreset, label: 'Last Year' },
];

function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case 'last7days':
      start.setDate(end.getDate() - 7);
      break;
    case 'last30days':
      start.setDate(end.getDate() - 30);
      break;
    case 'last90days':
      start.setDate(end.getDate() - 90);
      break;
    case 'lastYear':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'custom':
      break;
  }

  return { start, end };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DateRangePicker({
  selectedRange,
  onSelectRange,
}: DateRangePickerProps) {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('last30days');

  const handlePresetSelect = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    const range = getDateRangeFromPreset(preset);
    onSelectRange(range);
    setShowPicker(false);
  };

  return (
    <View>
      {/* Date Range Button */}
      <Pressable
        onPress={() => setShowPicker(!showPicker)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        className="flex-row items-center justify-between px-4 py-3 rounded-lg border"
      >
        <View className="flex-1">
          <Text className="text-xs text-muted">Date Range</Text>
          <Text className="text-sm font-semibold text-foreground mt-1">
            {formatDate(selectedRange.start)} - {formatDate(selectedRange.end)}
          </Text>
        </View>
        <Text
          className="text-lg text-muted ml-2"
          style={{
            transform: [{ rotate: showPicker ? '180deg' : '0deg' }],
          }}
        >
          ▼
        </Text>
      </Pressable>

      {/* Date Range Picker Modal */}
      {showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          {/* Overlay */}
          <Pressable
            onPress={() => setShowPicker(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            {/* Picker Menu */}
            <View
              style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-96"
            >
              {/* Header */}
              <View
                style={{ borderBottomColor: colors.border }}
                className="flex-row items-center justify-between px-4 py-4 border-b"
              >
                <Text className="text-lg font-bold text-foreground">Select Date Range</Text>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Text className="text-lg font-semibold text-primary">✕</Text>
                </Pressable>
              </View>

              {/* Preset Options */}
              <ScrollView className="flex-1">
                {PRESETS.map((preset) => (
                  <Pressable
                    key={preset.id}
                    onPress={() => handlePresetSelect(preset.id)}
                    style={({ pressed }) => [
                      {
                        backgroundColor:
                          selectedPreset === preset.id
                            ? colors.primary + '20'
                            : 'transparent',
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    className="px-4 py-4 border-b border-border"
                  >
                    <View className="flex-row items-center gap-3">
                      {/* Radio Button */}
                      {selectedPreset === preset.id && (
                        <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                          <Text className="text-background text-xs font-bold">✓</Text>
                        </View>
                      )}
                      {selectedPreset !== preset.id && (
                        <View className="w-5 h-5 rounded-full border-2 border-border" />
                      )}

                      {/* Label */}
                      <Text
                        className={cn(
                          'font-semibold text-base',
                          selectedPreset === preset.id
                            ? 'text-primary'
                            : 'text-foreground'
                        )}
                      >
                        {preset.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                {/* Custom Range Info */}
                <View className="px-4 py-4 bg-background/50">
                  <Text className="text-xs text-muted">
                    💡 Custom date ranges coming soon. Currently showing preset ranges.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
