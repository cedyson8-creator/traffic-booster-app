import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCampaigns } from "@/lib/campaigns-context";
import type { Campaign } from "@/lib/types";

export default function CreateCampaignScreen() {
  const { websiteId } = useLocalSearchParams<{ websiteId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { addCampaign } = useCampaigns();

  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<string>("social");
  const [targetVisits, setTargetVisits] = useState(10000);
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const campaignTypes = [
    { id: 'social', label: 'Social Media', description: 'Promote on social platforms' },
    { id: 'content', label: 'Content Promotion', description: 'Share content across networks' },
    { id: 'seo', label: 'SEO Boost', description: 'Optimize search visibility' },
  ];

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !websiteId) {
      Alert.alert('Error', 'Please enter a campaign name');
      return;
    }

    try {
      setIsLoading(true);
      const estimatedCost = Math.floor(targetVisits / 100 * duration / 30);
      
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        websiteId,
        name: campaignName,
        type: campaignType as 'social' | 'content' | 'seo',
        status: 'active',
        targetVisits,
        currentVisits: 0,
        duration,
        budget: estimatedCost,
        startDate: new Date().toISOString().split('T')[0],
      };

      await addCampaign(newCampaign);
      Alert.alert('Success', 'Campaign launched successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create campaign. Please try again.');
      console.error('Error creating campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Create Campaign</Text>
          <Text className="text-base text-muted mt-1">Set up a new traffic boost campaign</Text>
        </View>

        {/* Form */}
        <View className="gap-5">
          {/* Campaign Name */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Campaign Name</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="My Campaign"
              placeholderTextColor={colors.muted}
              value={campaignName}
              onChangeText={setCampaignName}
            />
          </View>

          {/* Campaign Type */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Campaign Type</Text>
            <View className="gap-2">
              {campaignTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  className={`p-4 rounded-xl border ${
                    campaignType === type.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface border-border'
                  }`}
                  onPress={() => setCampaignType(type.id)}
                >
                  <Text
                    className={`text-base font-semibold ${
                      campaignType === type.id ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {type.label}
                  </Text>
                  <Text className="text-sm text-muted mt-1">{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Visits */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-foreground">Target Visits</Text>
              <Text className="text-lg font-bold text-primary">{targetVisits.toLocaleString()}</Text>
            </View>
            <Slider
              minimumValue={100}
              maximumValue={1000000}
              step={100}
              value={targetVisits}
              onValueChange={setTargetVisits}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">100</Text>
              <Text className="text-xs text-muted">1M</Text>
            </View>
          </View>

          {/* Duration */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-foreground">Duration (Days)</Text>
              <Text className="text-lg font-bold text-primary">{duration}</Text>
            </View>
            <Slider
              minimumValue={7}
              maximumValue={90}
              step={1}
              value={duration}
              onValueChange={setDuration}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">7 days</Text>
              <Text className="text-xs text-muted">90 days</Text>
            </View>
          </View>

          {/* Estimated Cost */}
          <View className="bg-surface border border-border rounded-xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-muted">Estimated Cost</Text>
              <Text className="text-2xl font-bold text-foreground">
                ${Math.floor(targetVisits / 100 * duration / 30)}.00
              </Text>
            </View>
            <Text className="text-xs text-muted">
              Based on {targetVisits.toLocaleString()} visits over {duration} days
            </Text>
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 border border-primary rounded-xl p-4">
            <Text className="text-sm text-foreground leading-relaxed">
              <Text className="font-semibold">Legitimate Traffic Only:</Text> All traffic is generated through 
              ethical methods including content promotion, social sharing, and SEO optimization. No bots or fake visits.
            </Text>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            className={`rounded-full py-4 mt-2 ${isLoading ? 'bg-primary/50' : 'bg-primary active:opacity-80'}`}
            onPress={handleCreateCampaign}
            disabled={isLoading}
          >
            <Text className="text-white font-semibold text-base text-center">
              {isLoading ? 'Launching...' : 'Launch Campaign'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
