import { View, Text } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnimatedChartProps {
  data: DataPoint[];
  height?: number;
  maxValue?: number;
  showLabels?: boolean;
  showValues?: boolean;
  barColor?: string;
  animationDuration?: number;
}

export function AnimatedChart({
  data,
  height = 200,
  maxValue,
  showLabels = true,
  showValues = true,
  barColor,
  animationDuration = 500,
}: AnimatedChartProps) {
  const colors = useColors();
  const finalBarColor = barColor || colors.primary;

  // Calculate max value if not provided
  const calculatedMaxValue = maxValue || Math.max(...data.map(d => d.value), 100);

  return (
    <View className="w-full items-center">
      {/* Chart Container */}
      <View className="flex-row items-flex-end justify-between gap-2 w-full" style={{ height }}>
        {data.map((point, idx) => {
          // Animated bar height
          const barHeightAnim = useSharedValue(0);

          useEffect(() => {
            barHeightAnim.value = withTiming(
              (point.value / calculatedMaxValue) * height,
              { duration: animationDuration, easing: Easing.out(Easing.quad) }
            );
          }, [point.value]);

          const animatedBarStyle = useAnimatedStyle(() => ({
            height: barHeightAnim.value,
          }));

          return (
            <View key={idx} className="flex-1 items-center justify-flex-end gap-2">
              {/* Animated Bar */}
              <Animated.View
                style={[
                  animatedBarStyle,
                  {
                    backgroundColor: point.color || finalBarColor,
                  } as any,
                ]}
                className="w-full rounded-t-lg"
              />

              {/* Value Label (optional) */}
              {showValues && (
                <Text className="text-xs font-semibold text-foreground">
                  {point.value.toFixed(0)}
                </Text>
              )}

              {/* X-axis Label */}
              {showLabels && (
                <Text className="text-xs text-muted text-center">{point.label}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Y-axis Reference Lines */}
      <View className="w-full mt-2 gap-1">
        {[0.25, 0.5, 0.75, 1].map((ratio, idx) => (
          <View key={idx} className="flex-row items-center gap-2">
            <Text className="text-xs text-muted w-10 text-right">
              {(calculatedMaxValue * ratio).toFixed(0)}
            </Text>
            <View className="flex-1 h-px bg-border opacity-30" />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Animated Line Chart Component
 * Visualizes trend data with animated line drawing
 */
interface LineChartProps {
  data: DataPoint[];
  height?: number;
  maxValue?: number;
  lineColor?: string;
  animationDuration?: number;
}

export function AnimatedLineChart({
  data,
  height = 150,
  maxValue,
  lineColor,
  animationDuration = 800,
}: LineChartProps) {
  const colors = useColors();
  const finalLineColor = lineColor || colors.primary;

  const calculatedMaxValue = maxValue || Math.max(...data.map(d => d.value), 100);

  // Animation for line chart
  const lineOpacityAnim = useSharedValue(0);

  useEffect(() => {
    lineOpacityAnim.value = withTiming(1, {
      duration: animationDuration,
      easing: Easing.out(Easing.quad),
    });
  }, [data]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    opacity: lineOpacityAnim.value,
  }));

  return (
    <View className="w-full items-center gap-2">
      <Animated.View
        style={[
          animatedLineStyle,
          {
            width: '100%',
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 16,
            height: height + 40,
          } as any,
        ]}
      >
        <Text className="text-xs text-muted mb-2">Trend Over Time</Text>
        {/* Simplified line representation using bars */}
        <View className="flex-row items-flex-end justify-between gap-1 flex-1">
          {data.map((point, idx) => (
            <View
              key={idx}
              className="flex-1 rounded-t-sm"
              style={{
                height: (point.value / calculatedMaxValue) * (height - 20),
                backgroundColor: finalLineColor,
                opacity: 0.7 + (idx / data.length) * 0.3,
              }}
            />
          ))}
        </View>
      </Animated.View>

      {/* Legend */}
      <View className="flex-row items-center gap-2">
        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: finalLineColor }} />
        <Text className="text-xs text-muted">Trend</Text>
      </View>
    </View>
  );
}

/**
 * Animated Gauge Component
 * Shows progress/percentage with animation
 */
interface GaugeProps {
  value: number;
  maxValue?: number;
  label?: string;
  color?: string;
  size?: number;
  animationDuration?: number;
}

export function AnimatedGauge({
  value,
  maxValue = 100,
  label,
  color,
  size = 120,
  animationDuration = 600,
}: GaugeProps) {
  const colors = useColors();
  const finalColor = color || colors.primary;

  const percentage = (value / maxValue) * 100;

  // Animated gauge value
  const gaugeValueAnim = useSharedValue(0);

  useEffect(() => {
    gaugeValueAnim.value = withTiming(percentage, {
      duration: animationDuration,
      easing: Easing.out(Easing.quad),
    });
  }, [percentage]);

  const animatedGaugeStyle = useAnimatedStyle(() => ({
    opacity: gaugeValueAnim.value / 100,
  }));

  return (
    <View className="items-center gap-2">
      <View style={{ width: size, height: size, position: 'relative' }}>
        {/* Background Circle */}
        <View
          className="absolute"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 4,
            borderColor: colors.border,
          } as any}
        />

        {/* Animated Progress Circle */}
        <Animated.View
          style={[
            animatedGaugeStyle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 4,
              borderColor: finalColor,
              position: 'absolute' as const,
            } as any,
          ]}
        />

        {/* Center Text */}
        <View style={{ position: 'absolute', inset: 0 } as any} className="items-center justify-center">
          <Text className="text-2xl font-bold text-foreground">
            {percentage.toFixed(0)}%
          </Text>
          {label && <Text className="text-xs text-muted">{label}</Text>}
        </View>
      </View>
    </View>
  );
}
