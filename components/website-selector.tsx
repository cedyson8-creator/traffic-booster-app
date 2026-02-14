import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, FlatList } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface Website {
  id: string;
  name: string;
  url: string;
}

interface WebsiteSelectorProps {
  websites: Website[];
  selectedWebsiteId: string | null;
  onSelectWebsite: (websiteId: string) => void;
}

export function WebsiteSelector({
  websites,
  selectedWebsiteId,
  onSelectWebsite,
}: WebsiteSelectorProps) {
  const colors = useColors();
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);

  return (
    <View className="relative">
      {/* Selector Button */}
      <Pressable
        onPress={() => setShowDropdown(!showDropdown)}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        className="flex-row items-center justify-between px-4 py-3 rounded-lg border"
      >
        <View className="flex-1">
          <Text className="text-xs text-muted">Website</Text>
          <Text
            className="text-sm font-semibold text-foreground mt-1"
            numberOfLines={1}
          >
            {selectedWebsite?.name || 'Select a website'}
          </Text>
        </View>
        <Text
          className="text-lg text-muted ml-2"
          style={{
            transform: [{ rotate: showDropdown ? '180deg' : '0deg' }],
          }}
        >
          ▼
        </Text>
      </Pressable>

      {/* Dropdown Modal */}
      {showDropdown && (
        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          {/* Overlay */}
          <Pressable
            onPress={() => setShowDropdown(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            {/* Dropdown Menu */}
            <View
              style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-96"
            >
              {/* Header */}
              <View
                style={{ borderBottomColor: colors.border }}
                className="flex-row items-center justify-between px-4 py-4 border-b"
              >
                <Text className="text-lg font-bold text-foreground">Select Website</Text>
                <Pressable
                  onPress={() => setShowDropdown(false)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Text className="text-lg font-semibold text-primary">✕</Text>
                </Pressable>
              </View>

              {/* Website List */}
              <ScrollView className="flex-1">
                {websites.length === 0 ? (
                  <View className="p-4 items-center">
                    <Text className="text-muted">No websites found</Text>
                  </View>
                ) : (
                  websites.map((website) => (
                    <Pressable
                      key={website.id}
                      onPress={() => {
                        onSelectWebsite(website.id);
                        setShowDropdown(false);
                      }}
                      style={({ pressed }) => [
                        {
                          backgroundColor:
                            selectedWebsiteId === website.id
                              ? colors.primary + '20'
                              : 'transparent',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                      className="px-4 py-4 border-b border-border"
                    >
                      <View className="flex-row items-center gap-3">
                        {/* Checkmark */}
                        {selectedWebsiteId === website.id && (
                          <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                            <Text className="text-background text-xs font-bold">✓</Text>
                          </View>
                        )}
                        {selectedWebsiteId !== website.id && (
                          <View className="w-5 h-5 rounded-full border-2 border-border" />
                        )}

                        {/* Website Info */}
                        <View className="flex-1">
                          <Text
                            className={cn(
                              'font-semibold',
                              selectedWebsiteId === website.id
                                ? 'text-primary'
                                : 'text-foreground'
                            )}
                          >
                            {website.name}
                          </Text>
                          <Text className="text-xs text-muted mt-1">{website.url}</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
