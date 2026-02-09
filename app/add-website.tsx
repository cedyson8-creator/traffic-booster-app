import { ScrollView, Text, View, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function AddWebsiteScreen() {
  const colors = useColors();
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [category, setCategory] = useState<string>("blog");

  const categories = [
    { id: 'blog', label: 'Blog' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'business', label: 'Business' },
    { id: 'other', label: 'Other' },
  ];

  const handleAddWebsite = () => {
    // In a real app, this would verify and add the website
    router.back();
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">Add Website</Text>
          <Text className="text-base text-muted mt-1">Enter your website details to start tracking</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          {/* Website URL */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Website URL</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="https://example.com"
              placeholderTextColor={colors.muted}
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Website Name */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Website Name</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="My Awesome Site"
              placeholderTextColor={colors.muted}
              value={websiteName}
              onChangeText={setWebsiteName}
            />
          </View>

          {/* Category */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  className={`px-4 py-2 rounded-full border ${
                    category === cat.id
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      category === cat.id ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Box */}
          <View className="bg-surface border border-border rounded-xl p-4 mt-2">
            <Text className="text-sm text-muted leading-relaxed">
              After adding your website, you'll need to verify ownership by adding a meta tag or DNS record. 
              This ensures you have permission to track and boost traffic for this site.
            </Text>
          </View>

          {/* Add Button */}
          <TouchableOpacity
            className="bg-primary rounded-full py-4 mt-4 active:opacity-80"
            onPress={handleAddWebsite}
          >
            <Text className="text-white font-semibold text-base text-center">Verify & Add Website</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
