import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

interface Recommendation {
  id: string;
  type: 'caching' | 'batching' | 'compression' | 'rate-limiting' | 'pagination';
  description: string;
  estimatedSavings: number;
  estimatedCostReduction: number;
  priority: 'low' | 'medium' | 'high';
  implementation: string;
  applied?: boolean;
}

export default function OptimizationRecommendations() {
  const colors = useColors();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 'cache-1',
      type: 'caching',
      description: 'Implement response caching for frequently accessed endpoints',
      estimatedSavings: 30,
      estimatedCostReduction: 450,
      priority: 'high',
      implementation: 'Add Redis caching layer with 5-minute TTL for GET requests',
      applied: false,
    },
    {
      id: 'batch-1',
      type: 'batching',
      description: 'Batch multiple API requests into single calls',
      estimatedSavings: 25,
      estimatedCostReduction: 375,
      priority: 'high',
      implementation: 'Implement batch endpoint accepting up to 100 requests per call',
      applied: false,
    },
    {
      id: 'compress-1',
      type: 'compression',
      description: 'Enable gzip compression for API responses',
      estimatedSavings: 20,
      estimatedCostReduction: 300,
      priority: 'medium',
      implementation: 'Enable gzip compression for all JSON responses',
      applied: true,
    },
    {
      id: 'paginate-1',
      type: 'pagination',
      description: 'Implement pagination for list endpoints',
      estimatedSavings: 18,
      estimatedCostReduction: 270,
      priority: 'medium',
      implementation: 'Add limit/offset pagination with default limit of 50',
      applied: false,
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        return '🚦';
      case 'pagination':
        return '📄';
      default:
        return '⚙️';
    }
  };

  const handleApply = (id: string) => {
    setRecommendations(recs =>
      recs.map(rec => (rec.id === id ? { ...rec, applied: !rec.applied } : rec))
    );
  };

  const appliedCount = recommendations.filter(r => r.applied).length;
  const totalSavings = recommendations
    .filter(r => r.applied)
    .reduce((sum, r) => sum + r.estimatedCostReduction, 0);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Optimization Recommendations</Text>
            <Text className="text-sm text-muted">Apply recommendations to reduce costs</Text>
          </View>

          {/* Summary Stats */}
          <View className="flex-row gap-3">
            <View
              className="flex-1 p-4 rounded-lg"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-xs text-muted mb-1">Applied</Text>
              <Text className="text-2xl font-bold text-foreground">{appliedCount}</Text>
              <Text className="text-xs text-muted mt-1">of {recommendations.length}</Text>
            </View>
            <View
              className="flex-1 p-4 rounded-lg"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-xs text-muted mb-1">Est. Savings</Text>
              <Text className="text-2xl font-bold text-success">${totalSavings}</Text>
              <Text className="text-xs text-muted mt-1">per month</Text>
            </View>
          </View>

          {/* Recommendations List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">💡 Recommendations</Text>
            {recommendations.map(rec => (
              <Pressable
                key={rec.id}
                onPress={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              >
                <View
                  className={`p-4 rounded-lg border ${rec.applied ? 'opacity-60' : ''}`}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: rec.applied ? colors.success : colors.border,
                    borderWidth: 1,
                  }}
                >
                  <View className="gap-3">
                    {/* Header */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 gap-2">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">{getTypeIcon(rec.type)}</Text>
                          <View className="flex-1">
                            <Text className="font-semibold text-foreground">{rec.description}</Text>
                            {rec.applied && (
                              <Text className="text-xs text-success mt-1">✓ Applied</Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View className="items-end gap-2">
                        <Text
                          className="text-xs font-bold px-2 py-1 rounded"
                          style={{
                            color: colors.background,
                            backgroundColor: getPriorityColor(rec.priority),
                          }}
                        >
                          {rec.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Stats */}
                    <View className="flex-row gap-4 pt-2 border-t border-border">
                      <View>
                        <Text className="text-xs text-muted mb-1">Savings</Text>
                        <Text className="text-lg font-bold text-foreground">{rec.estimatedSavings}%</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-muted mb-1">Cost Reduction</Text>
                        <Text className="text-lg font-bold text-success">${rec.estimatedCostReduction}</Text>
                      </View>
                    </View>

                    {/* Expanded Details */}
                    {expandedId === rec.id && (
                      <View className="pt-3 border-t border-border gap-3">
                        <View className="gap-2">
                          <Text className="text-sm font-semibold text-foreground">Implementation</Text>
                          <Text className="text-sm text-muted leading-relaxed">{rec.implementation}</Text>
                        </View>

                        {/* Apply Button */}
                        <Pressable
                          onPress={() => handleApply(rec.id)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            backgroundColor: rec.applied ? colors.success : colors.primary,
                            marginTop: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.background,
                              textAlign: 'center',
                              fontWeight: '600',
                              fontSize: 14,
                            }}
                          >
                            {rec.applied ? '✓ Applied' : 'Apply Optimization'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Auto-Apply Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🤖 Quick Actions</Text>
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: colors.primary,
              }}
            >
              <Text
                style={{
                  color: colors.background,
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: 16,
                }}
              >
                Apply All High-Priority Recommendations
              </Text>
            </Pressable>

            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: 16,
                }}
              >
                View Optimization History
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
