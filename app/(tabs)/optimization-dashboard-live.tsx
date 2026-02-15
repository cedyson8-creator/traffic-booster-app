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

interface Recommendation {
  id: string;
  type: 'caching' | 'batching' | 'compression' | 'rate-limiting' | 'pagination';
  description: string;
  estimatedSavings: number;
  estimatedCostReduction: number;
  priority: 'low' | 'medium' | 'high';
  applied: boolean;
}

interface OptimizationUpdate {
  type: 'optimization';
  recommendations: Recommendation[];
  summary: {
    appliedCount: number;
    totalRecommendations: number;
    totalSavings: number;
    potentialSavings: number;
  };
  timestamp: number;
}

export default function OptimizationDashboardLive() {
  const colors = useColors();
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState({
    appliedCount: 0,
    totalRecommendations: 0,
    totalSavings: 0,
    potentialSavings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
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
    ['optimization'],
    (message: WebSocketMessage) => {
      if (message.type === 'optimization') {
        const data = message as unknown as OptimizationUpdate;
        setRecommendations(data.recommendations || []);
        setSummary(data.summary || {
          appliedCount: 0,
          totalRecommendations: 0,
          totalSavings: 0,
          potentialSavings: 0,
        });
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
        subscribe(['optimization']);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredRecommendations = selectedPriority === 'all'
    ? recommendations
    : recommendations.filter(r => r.priority === selectedPriority);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'caching':
        return '💾';
      case 'batching':
        return '📦';
      case 'compression':
        return '🗜️';
      case 'rate-limiting':
        return '⏱️';
      case 'pagination':
        return '📄';
      default:
        return '⚙️';
    }
  };

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
              <Text className="text-3xl font-bold text-foreground">Optimization</Text>
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
              {isConnected ? 'Real-time cost optimization' : 'Offline - last update: ' + (lastUpdate ? lastUpdate.toLocaleTimeString() : 'never')}
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

          {/* Summary Cards */}
          {!loading && summary.totalRecommendations > 0 && (
            <Animated.View entering={SlideInRight} className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Savings Summary</Text>
              <View className="flex-row gap-2">
                <View className="flex-1 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Text className="text-xs text-muted">Applied</Text>
                  <Text className="text-lg font-bold text-primary">{summary.appliedCount}/{summary.totalRecommendations}</Text>
                </View>
                <View className="flex-1 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Text className="text-xs text-muted">Potential Savings</Text>
                  <Text className="text-lg font-bold text-primary">${summary.potentialSavings}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Priority Filter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Filter by Priority</Text>
            <View className="flex-row gap-2">
              {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                <TouchableOpacity
                  key={priority}
                  onPress={() => setSelectedPriority(priority)}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{
                    backgroundColor: selectedPriority === priority ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text
                    className="font-semibold text-sm"
                    style={{
                      color: selectedPriority === priority ? colors.background : colors.foreground,
                    }}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recommendations */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              💡 Recommendations ({filteredRecommendations.length})
            </Text>
            {loading ? (
              <View
                className="p-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-muted">Loading recommendations...</Text>
              </View>
            ) : filteredRecommendations.length === 0 ? (
              <View
                className="p-6 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-muted text-center">
                  {isConnected ? 'No recommendations available' : 'Offline - no data'}
                </Text>
              </View>
            ) : (
              filteredRecommendations.map((rec, idx) => (
                <Animated.View
                  key={rec.id}
                  entering={FadeIn.delay(idx * 50)}
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: getPriorityColor(rec.priority),
                    backgroundColor: colors.surface,
                    opacity: rec.applied ? 0.6 : 1,
                  }}
                >
                  <View className="gap-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-lg">{getTypeIcon(rec.type)}</Text>
                          <Text className="font-semibold text-foreground flex-1">
                            {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                          </Text>
                        </View>
                        <Text className="text-sm text-muted">{rec.description}</Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className="text-xs font-bold px-2 py-1 rounded"
                          style={{
                            color: colors.background,
                            backgroundColor: getPriorityColor(rec.priority),
                          }}
                        >
                          {rec.priority.toUpperCase()}
                        </Text>
                        {rec.applied && (
                          <Text className="text-xs text-success mt-1">✓ Applied</Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row justify-between pt-2 border-t" style={{ borderTopColor: colors.border }}>
                      <View>
                        <Text className="text-xs text-muted">Est. Savings</Text>
                        <Text className="font-semibold text-primary">${rec.estimatedSavings}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-muted">Cost Reduction</Text>
                        <Text className="font-semibold text-primary">{rec.estimatedCostReduction}%</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
