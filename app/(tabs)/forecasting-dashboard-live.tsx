import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useWebSocket, type WebSocketMessage } from '@/hooks/use-websocket';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
} from 'react-native-reanimated';

interface Forecast {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

export default function ForecastingDashboardLive() {
  const colors = useColors();
  
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [trend, setTrend] = useState({
    growthRate: 0,
    volatility: 0,
    seasonality: 0,
    slope: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedConfidence, setSelectedConfidence] = useState<'low' | 'mid' | 'high'>('mid');

  // Animation values
  const opacityAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const { isConnected } = useWebSocket(
    ['forecast'],
    (message: WebSocketMessage) => {
      if (message.type === 'forecast') {
        const forecasts = (message.forecasts as Forecast[]) || [];
        const trend = message.data?.trend || {
          growthRate: 0,
          volatility: 0,
          seasonality: 0,
          slope: 0,
        };
        
        setForecasts(forecasts);
        setTrend(trend as any);
        setLoading(false);

        // Trigger animation
        opacityAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
        scaleAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      }
    }
  );

  const getConfidenceRange = (forecast: Forecast) => {
    const range = forecast.upper - forecast.lower;
    if (selectedConfidence === 'low') {
      return { lower: forecast.predicted - range * 0.25, upper: forecast.predicted + range * 0.25 };
    } else if (selectedConfidence === 'mid') {
      return { lower: forecast.lower, upper: forecast.upper };
    } else {
      return { lower: forecast.lower - range * 0.25, upper: forecast.upper + range * 0.25 };
    }
  };

  const maxValue = Math.max(...forecasts.map(f => f.upper), 1000);
  const minValue = Math.min(...forecasts.map(f => f.lower), 0);
  const range = maxValue - minValue;

  const getBarHeight = (value: number) => {
    return ((value - minValue) / range) * 200;
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Forecasting</Text>
            <Text className="text-sm text-muted">
              {isConnected ? '🟢 Live Updates' : '🔴 Offline'}
            </Text>
          </View>

          {/* Confidence Level Selector */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Confidence Level</Text>
            <View className="flex-row gap-2">
              {(['low', 'mid', 'high'] as const).map(level => (
                <Pressable
                  key={level}
                  onPress={() => setSelectedConfidence(level)}
                  style={({ pressed }) => [
                    {
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border',
                    selectedConfidence === level
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'text-center text-sm font-medium capitalize',
                      selectedConfidence === level ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Trend Metrics */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Trend Analysis</Text>
            <View className="gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface rounded-lg p-4">
                  <Text className="text-xs text-muted mb-1">Growth Rate</Text>
                  <Text className={cn(
                    'text-lg font-bold',
                    trend.growthRate > 0 ? 'text-success' : 'text-error'
                  )}>
                    {trend.growthRate > 0 ? '+' : ''}{(trend.growthRate * 100).toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-1 bg-surface rounded-lg p-4">
                  <Text className="text-xs text-muted mb-1">Volatility</Text>
                  <Text className="text-lg font-bold text-warning">
                    {(trend.volatility * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface rounded-lg p-4">
                  <Text className="text-xs text-muted mb-1">Seasonality</Text>
                  <Text className="text-lg font-bold text-primary">
                    {(trend.seasonality * 100).toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-1 bg-surface rounded-lg p-4">
                  <Text className="text-xs text-muted mb-1">Slope</Text>
                  <Text className="text-lg font-bold text-foreground">
                    {trend.slope.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Forecast Chart */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">7-Day Forecast</Text>
            {loading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <Animated.View style={animatedStyle} className="bg-surface rounded-lg p-4">
                <View className="flex-row items-flex-end justify-between gap-2 h-64">
                  {forecasts.slice(0, 7).map((forecast, idx) => {
                    const range = getConfidenceRange(forecast);
                    const barHeight = getBarHeight(forecast.predicted);
                    const upperHeight = getBarHeight(range.upper);
                    const lowerHeight = getBarHeight(range.lower);

                    return (
                      <View key={idx} className="flex-1 items-center gap-2">
                        {/* Confidence Interval */}
                        <View className="w-1 rounded-full" style={{
                          height: Math.max(upperHeight - lowerHeight, 1),
                          backgroundColor: colors.primary,
                          opacity: 0.3,
                          marginTop: Math.max(200 - upperHeight, 0),
                        }} />

                        {/* Predicted Value Bar */}
                        <View className="w-full items-center">
                          <View
                            className="rounded-t-lg w-3/4"
                            style={{
                              height: Math.max(barHeight, 2),
                              backgroundColor: colors.primary,
                            }}
                          />
                        </View>

                        {/* Label */}
                        <Text className="text-xs text-muted text-center">
                          {forecast.date}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Legend */}
                <View className="flex-row gap-4 mt-4 pt-4 border-t border-border">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-primary" />
                    <Text className="text-xs text-muted">Predicted</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-primary opacity-30" />
                    <Text className="text-xs text-muted">Confidence</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Forecast Details */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Forecast Details</Text>
            {forecasts.slice(0, 7).map((forecast, idx) => (
              <View key={idx} className="bg-surface rounded-lg p-4">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="font-semibold text-foreground">{forecast.date}</Text>
                  <Text className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {(forecast.confidence * 100).toFixed(0)}% confidence
                  </Text>
                </View>
                <View className="flex-row justify-between text-sm">
                  <View>
                    <Text className="text-xs text-muted">Predicted</Text>
                    <Text className="font-semibold text-foreground">
                      {forecast.predicted.toFixed(0)} visits
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted">Range</Text>
                    <Text className="font-semibold text-foreground">
                      {forecast.lower.toFixed(0)} - {forecast.upper.toFixed(0)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
