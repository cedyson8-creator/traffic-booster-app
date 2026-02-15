import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useWebSocket, type WebSocketMessage } from '@/hooks/use-websocket';
import { useColors } from '@/hooks/use-colors';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  FadeIn,
  SlideInRight,
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Animation values
  const opacityAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const { isConnected, subscribe } = useWebSocket(
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
        setLastUpdate(new Date());

        // Trigger animation
        opacityAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
        scaleAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      }
    }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (subscribe) {
        subscribe(['forecast']);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

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

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View className="p-4 gap-6">
          {/* Header */}
          <Animated.View entering={FadeIn} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-foreground">Forecasting</Text>
              <View
                className="px-2 py-1 rounded"
                style={{
                  backgroundColor: isConnected ? colors.success : colors.error,
                }}
              >
                <Text className="text-xs font-bold text-background">
                  {isConnected ? '🔴 LIVE' : '⚪ OFFLINE'}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-muted">
              {isConnected ? '7-day usage forecast' : 'Offline - last update: ' + (lastUpdate ? lastUpdate.toLocaleTimeString() : 'never')}
            </Text>
          </Animated.View>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg items-center"
            style={{
              backgroundColor: colors.primary,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <Text className="text-background font-semibold">
              {refreshing ? '⟳ Refreshing...' : '⟳ Manual Refresh'}
            </Text>
          </TouchableOpacity>

          {/* Confidence Level Filter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Confidence Level</Text>
            <View className="flex-row gap-2">
              {(['low', 'mid', 'high'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setSelectedConfidence(level)}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{
                    backgroundColor: selectedConfidence === level ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text
                    className="font-semibold text-sm"
                    style={{
                      color: selectedConfidence === level ? colors.background : colors.foreground,
                    }}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trend Summary */}
          {!loading && forecasts.length > 0 && (
            <Animated.View entering={SlideInRight} className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Trend Analysis</Text>
              <View className="flex-row gap-2">
                <View className="flex-1 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Text className="text-xs text-muted">Growth Rate</Text>
                  <Text className="text-lg font-bold text-primary">{trend.growthRate.toFixed(2)}%</Text>
                </View>
                <View className="flex-1 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Text className="text-xs text-muted">Volatility</Text>
                  <Text className="text-lg font-bold text-primary">{(trend.volatility * 100).toFixed(1)}%</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Forecasts */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              📊 7-Day Forecast ({forecasts.length} days)
            </Text>
            {loading ? (
              <View
                className="p-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-muted">Loading forecast data...</Text>
              </View>
            ) : forecasts.length === 0 ? (
              <View
                className="p-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-muted text-center">
                  {isConnected ? 'Waiting for forecast...' : 'Offline - no forecast data'}
                </Text>
              </View>
            ) : (
              forecasts.map((forecast, idx) => {
                const confRange = getConfidenceRange(forecast);
                const barHeight = ((forecast.predicted - minValue) / range) * 100;
                const confidencePercent = Math.round(forecast.confidence * 100);

                return (
                  <Animated.View
                    key={idx}
                    entering={FadeIn.delay(idx * 50)}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <View className="gap-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">{forecast.date}</Text>
                          <Text className="text-xs text-muted mt-1">Confidence: {confidencePercent}%</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-lg font-bold text-primary">{forecast.predicted}</Text>
                          <Text className="text-xs text-muted">predicted</Text>
                        </View>
                      </View>

                      {/* Confidence Interval Bar */}
                      <View className="gap-1">
                        <View className="h-8 rounded bg-opacity-20" style={{ backgroundColor: colors.primary }}>
                          <View
                            className="h-full rounded flex-row items-center justify-center"
                            style={{
                              width: `${Math.max(barHeight, 5)}%`,
                              backgroundColor: colors.primary,
                            }}
                          >
                            {barHeight > 15 && (
                              <Text className="text-xs font-bold text-background">{forecast.predicted}</Text>
                            )}
                          </View>
                        </View>
                        <View className="flex-row justify-between text-xs text-muted">
                          <Text className="text-xs text-muted">{confRange.lower.toFixed(0)}</Text>
                          <Text className="text-xs text-muted">{confRange.upper.toFixed(0)}</Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
