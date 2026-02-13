import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { mockWebsites } from "@/lib/mock-data";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const totalWebsites = mockWebsites.length;
  const totalTraffic = mockWebsites.reduce((sum, site) => sum + site.totalVisits, 0);

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        { label: 'Push Notifications', type: 'toggle' as const, value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { label: 'Theme', type: 'info' as const, value: colorScheme === 'dark' ? 'Dark' : 'Light' },
        { label: 'Language', type: 'info' as const, value: 'English' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', type: 'link' as const },
        { label: 'Contact Support', type: 'link' as const },
        { label: 'Terms of Service', type: 'link' as const },
        { label: 'Privacy Policy', type: 'link' as const },
      ],
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Profile</Text>
          <Text className="text-base text-muted mt-1">Manage your account and settings</Text>
        </View>

        {/* User Info Card */}
        <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-3">
              <IconSymbol name="person.fill" size={40} color={colors.primary} />
            </View>
            <Text className="text-xl font-bold text-foreground">Traffic Booster User</Text>
            <Text className="text-sm text-muted mt-1">user@example.com</Text>
          </View>

          <View className="flex-row gap-3 pt-4 border-t border-border">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-foreground">{totalWebsites}</Text>
              <Text className="text-xs text-muted mt-1">Websites</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-foreground">{totalTraffic.toLocaleString()}</Text>
              <Text className="text-xs text-muted mt-1">Total Traffic</Text>
            </View>
          </View>
        </View>

        {/* Integrations Card */}
        <TouchableOpacity
          onPress={() => router.push("/integrations")}
          className="bg-surface rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
              <IconSymbol name="chevron.right" size={24} color={colors.background} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">Integrations</Text>
              <Text className="text-sm text-muted">Connect your accounts</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </TouchableOpacity>

        {/* Sync Status Card */}
        <TouchableOpacity
          onPress={() => router.push("/sync-status" as any)}
          className="bg-surface rounded-2xl p-4 border border-border mb-6 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-12 h-12 rounded-full bg-success items-center justify-center">
              <IconSymbol name="arrow.clockwise" size={24} color={colors.background} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">Sync Status</Text>
              <Text className="text-sm text-muted">View sync history</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </TouchableOpacity>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-sm font-semibold text-muted uppercase mb-3">{section.title}</Text>
            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              {section.items.map((item, index) => (
                <View key={item.label}>
                  {index > 0 && <View className="h-px bg-border mx-4" />}
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-4 active:opacity-70"
                    onPress={() => {}}
                  >
                    <Text className="text-base text-foreground">{item.label}</Text>
                    {item.type === 'toggle' && (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#ffffff"
                      />
                    )}
                    {item.type === 'info' && (
                      <Text className="text-base text-muted">{item.value}</Text>
                    )}
                    {item.type === 'link' && (
                      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity
          className="bg-error/10 border border-error rounded-full py-4 active:opacity-70"
          onPress={() => {}}
        >
          <Text className="text-error font-semibold text-base text-center">Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text className="text-xs text-muted text-center mt-6">Version 1.0.0</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
