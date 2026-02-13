import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSegmentation } from "@/lib/segmentation-context";
import { AudienceSegment } from "@/lib/segmentation-types";

export default function AudienceSegmentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { segments, deleteSegment, suggestLookalike, addSegment } = useSegmentation();
  const [loading, setLoading] = useState(false);

  const handleCreateSegment = () => {
    router.push("/add-website");
  };

  const handleViewSegment = (segmentId: string) => {
    router.push("/add-website");
  };

  const handleDeleteSegment = (segmentId: string) => {
    Alert.alert("Delete Segment", "Are you sure you want to delete this segment?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteSegment(segmentId);
          } catch (error) {
            Alert.alert("Error", "Failed to delete segment");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleCreateLookalike = async (segmentId: string) => {
    try {
      setLoading(true);
      const lookalike = await suggestLookalike(segmentId);
      if (lookalike) {
        await addSegment(lookalike);
        Alert.alert("Success", "Lookalike segment created successfully");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create lookalike segment");
    } finally {
      setLoading(false);
    }
  };

  const renderSegmentCard = ({ item }: { item: AudienceSegment }) => (
    <TouchableOpacity
      onPress={() => handleViewSegment(item.id)}
      className="bg-surface border border-border rounded-xl p-4 mb-3"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{item.name}</Text>
          <Text className="text-xs text-muted mt-1">{item.description}</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleCreateLookalike(item.id)}
            className="bg-primary/10 p-2 rounded-lg"
          >
            <MaterialIcons name="content-copy" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteSegment(item.id)}
            className="bg-error/10 p-2 rounded-lg"
          >
            <MaterialIcons name="delete" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics Grid */}
      <View className="grid grid-cols-4 gap-2">
        <View className="bg-background rounded-lg p-2">
          <Text className="text-xs text-muted">Size</Text>
          <Text className="text-sm font-bold text-foreground mt-1">
            {(item.size / 1000).toFixed(1)}K
          </Text>
        </View>
        <View className="bg-background rounded-lg p-2">
          <Text className="text-xs text-muted">Engagement</Text>
          <Text className="text-sm font-bold text-foreground mt-1">{item.engagement}%</Text>
        </View>
        <View className="bg-background rounded-lg p-2">
          <Text className="text-xs text-muted">Conv. Rate</Text>
          <Text className="text-sm font-bold text-foreground mt-1">
            {item.conversionRate.toFixed(1)}%
          </Text>
        </View>
        <View className="bg-background rounded-lg p-2">
          <Text className="text-xs text-muted">Status</Text>
          <Text className={`text-sm font-bold mt-1 ${item.isActive ? "text-success" : "text-muted"}`}>
            {item.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {/* Traffic Sources */}
      {item.trafficSources.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {item.trafficSources.map((source) => (
            <View key={source} className="bg-primary/10 rounded-full px-3 py-1">
              <Text className="text-xs font-semibold text-primary capitalize">{source}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-1">
              Audience Segments
            </Text>
            <Text className="text-muted">
              {segments.length} segment{segments.length !== 1 ? "s" : ""} created
            </Text>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreateSegment}
            className="bg-primary rounded-lg p-4 flex-row items-center justify-center gap-2"
          >
            <MaterialIcons name="add" size={24} color={colors.background} />
            <Text className="text-background font-bold">Create New Segment</Text>
          </TouchableOpacity>

          {/* Segments List */}
          {segments.length > 0 ? (
            <View>
              <Text className="text-sm font-bold text-foreground mb-3 uppercase">
                Your Segments
              </Text>
              <FlatList
                data={segments}
                renderItem={renderSegmentCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          ) : (
            <View className="bg-surface border border-border rounded-xl p-8 items-center">
              <MaterialIcons name="people" size={48} color={colors.muted} />
              <Text className="text-foreground font-bold mt-4">No Segments Yet</Text>
              <Text className="text-muted text-center mt-2">
                Create your first audience segment to start targeting specific traffic sources and
                demographics.
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert("Info", "Segment builder coming soon!")}
                className="mt-4 bg-primary/10 rounded-lg px-6 py-2"
              >
                <Text className="text-primary font-semibold">Create Segment</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips */}
          <View className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <View className="flex-row gap-3">
              <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="font-bold text-foreground">Pro Tip</Text>
                <Text className="text-xs text-muted mt-1">
                  Use lookalike segments to expand your reach to similar audiences. Copy any segment
                  and modify it for better targeting.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
