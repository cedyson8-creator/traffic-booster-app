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

  // Animation values
  const opacityAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const { isConnected } = useWebSocket(
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

        // Trigger animation
        opacityAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
        scaleAnim.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      }
    }
  );

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
    const icons: Record<string, string> = {
      caching: '💾',
      batching: '📦',
      compression: '🗜️',
      'rate-limiting': '⏱️',
      pagination: '📄',
    };
    return icons[type] || '⚙️';
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Optimization</Text>
            <Text className="text-sm text-muted">
              {isConnected ? '🟢 Live Updates' : '🔴 Offline'}
            </Text>
          </View>

          {/* Summary Cards */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-1">Applied</Text>
                <Text className="text-2xl font-bold text-success">
                  {summary.appliedCount}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  of {summary.totalRecommendations}
                </Text>
              </View>
              <View className="flex-1 bg-surface rounded-lg p-4">
                <Text className="text-xs text-muted mb-1">Cost Savings</Text>
                <Text className="text-2xl font-bold text-primary">
                  ${(summary.totalSavings / 1000).toFixed(1)}k
                </Text>
              </View>
            </View>
            <View className="bg-surface rounded-lg p-4">
              <Text className="text-xs text-muted mb-1">Potential Savings</Text>
              <Text className="text-2xl font-bold text-warning">
                ${(summary.potentialSavings / 1000).toFixed(1)}k
              </Text>
              <Text className="text-xs text-muted mt-2">
                If all recommendations are applied
              </Text>
            </View>
          </View>

          {/* Priority Filter */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Filter by Priority</Text>
            <View className="flex-row gap-2">
              {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                <Pressable
                  key={priority}
                  onPress={() => setSelectedPriority(priority)}
                  style={({ pressed }) => [
                    {
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                  className={cn(
                    'py-2 px-3 rounded-lg border',
                    selectedPriority === priority
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium capitalize',
                      selectedPriority === priority ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {priority}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Recommendations List */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              Recommendations ({filteredRecommendations.length})
            </Text>
            {loading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <Animated.View style={animatedStyle} className="gap-3">
                {filteredRecommendations.length === 0 ? (
                  <View className="bg-surface rounded-lg p-6 items-center">
                    <Text className="text-muted">No recommendations at this priority level</Text>
                  </View>
                ) : (
                  filteredRecommendations.map((rec) => (
                    <View
                      key={rec.id}
                      className={cn(
                        'bg-surface rounded-lg p-4 border-l-4',
                        rec.applied ? 'opacity-60 border-success' : 'border-transparent'
                      )}
                    >
                      {/* Header */}
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center gap-2 flex-1">
                          <Text className="text-2xl">{getTypeIcon(rec.type)}</Text>
                          <View className="flex-1">
                            <Text className="font-semibold text-foreground capitalize">
                              {rec.type}
                            </Text>
                            {rec.applied && (
                              <Text className="text-xs text-success font-medium">✓ Applied</Text>
                            )}
                          </View>
                        </View>
                        <View
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: getPriorityColor(rec.priority) + '20' }}
                        >
                          <Text
                            className="text-xs font-semibold capitalize"
                            style={{ color: getPriorityColor(rec.priority) }}
                          >
                            {rec.priority}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text className="text-sm text-muted mb-3">{rec.description}</Text>

                      {/* Metrics */}
                      <View className="flex-row justify-between gap-2 pt-3 border-t border-border">
                        <View className="flex-1">
                          <Text className="text-xs text-muted mb-1">Est. Savings</Text>
                          <Text className="font-semibold text-foreground">
                            {rec.estimatedSavings.toFixed(0)}ms
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted mb-1">Cost Reduction</Text>
                          <Text className="font-semibold text-success">
                            ${(rec.estimatedCostReduction / 1000).toFixed(1)}k
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
