import React, { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface ConnectedAccount {
  platform: 'facebook' | 'tiktok' | 'instagram';
  username: string;
  connected: boolean;
  followers?: number;
  lastSync?: string;
}

export default function SocialMediaConnectScreen() {
  const colors = useColors();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    { platform: 'facebook', username: '', connected: false },
    { platform: 'tiktok', username: '', connected: false },
    { platform: 'instagram', username: '', connected: false },
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleConnectFacebook = async () => {
    setLoading('facebook');
    try {
      // In a real app, this would open Facebook's OAuth dialog
      // For now, we'll simulate the connection
      Alert.alert(
        'Facebook Connection',
        'This will open Facebook login to authorize your account.',
        [
          {
            text: 'Cancel',
            onPress: () => setLoading(null),
            style: 'cancel',
          },
          {
            text: 'Connect',
            onPress: async () => {
              // Simulate successful connection
              await new Promise(resolve => setTimeout(resolve, 1500));
              setConnectedAccounts(prev =>
                prev.map(acc =>
                  acc.platform === 'facebook'
                    ? { ...acc, connected: true, username: 'Your Facebook Page', followers: 15420 }
                    : acc
                )
              );
              Alert.alert('Success', 'Facebook account connected successfully!');
              setLoading(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to connect Facebook account');
      setLoading(null);
    }
  };

  const handleConnectTikTok = async () => {
    setLoading('tiktok');
    try {
      Alert.alert(
        'TikTok Connection',
        'This will open TikTok login to authorize your account.',
        [
          {
            text: 'Cancel',
            onPress: () => setLoading(null),
            style: 'cancel',
          },
          {
            text: 'Connect',
            onPress: async () => {
              await new Promise(resolve => setTimeout(resolve, 1500));
              setConnectedAccounts(prev =>
                prev.map(acc =>
                  acc.platform === 'tiktok'
                    ? { ...acc, connected: true, username: '@your_tiktok_handle', followers: 125680 }
                    : acc
                )
              );
              Alert.alert('Success', 'TikTok account connected successfully!');
              setLoading(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to connect TikTok account');
      setLoading(null);
    }
  };

  const handleConnectInstagram = async () => {
    setLoading('instagram');
    try {
      Alert.alert(
        'Instagram Connection',
        'This will open Instagram login to authorize your business account.',
        [
          {
            text: 'Cancel',
            onPress: () => setLoading(null),
            style: 'cancel',
          },
          {
            text: 'Connect',
            onPress: async () => {
              await new Promise(resolve => setTimeout(resolve, 1500));
              setConnectedAccounts(prev =>
                prev.map(acc =>
                  acc.platform === 'instagram'
                    ? { ...acc, connected: true, username: 'your_instagram_business', followers: 45230 }
                    : acc
                )
              );
              Alert.alert('Success', 'Instagram account connected successfully!');
              setLoading(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to connect Instagram account');
      setLoading(null);
    }
  };

  const handleDisconnect = (platform: string) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect your ${platform} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setConnectedAccounts(prev =>
              prev.map(acc =>
                acc.platform === platform
                  ? { ...acc, connected: false, username: '', followers: undefined }
                  : acc
              )
            );
          },
        },
      ]
    );
  };

  const renderPlatformCard = (account: ConnectedAccount) => {
    const isLoading = loading === account.platform;
    const platformColors: Record<string, string> = {
      facebook: '#1877F2',
      tiktok: '#000000',
      instagram: '#E4405F',
    };

    const platformEmoji: Record<string, string> = {
      facebook: '📘',
      tiktok: '🎵',
      instagram: '📷',
    };

    return (
      <View
        key={account.platform}
        className="mb-4 rounded-2xl p-4 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <Text className="text-2xl mr-3">{platformEmoji[account.platform]}</Text>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground capitalize">
                {account.platform}
              </Text>
              {account.connected && (
                <Text className="text-sm text-muted mt-1">{account.username}</Text>
              )}
            </View>
          </View>
          {account.connected && (
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: '#10B981' }}
            >
              <Text className="text-xs font-semibold text-white">Connected</Text>
            </View>
          )}
        </View>

        {account.connected && account.followers && (
          <View className="mb-3 pb-3 border-t" style={{ borderTopColor: colors.border }}>
            <Text className="text-sm text-muted mt-3">
              Followers: <Text className="font-semibold text-foreground">{account.followers.toLocaleString()}</Text>
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() =>
            account.connected
              ? handleDisconnect(account.platform)
              : account.platform === 'facebook'
              ? handleConnectFacebook()
              : account.platform === 'tiktok'
              ? handleConnectTikTok()
              : handleConnectInstagram()
          }
          disabled={isLoading}
          className={cn(
            'py-3 px-4 rounded-lg items-center justify-center',
            account.connected
              ? 'bg-red-500'
              : 'bg-primary'
          )}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">
              {account.connected ? 'Disconnect' : 'Connect Account'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Connect Social Media
          </Text>
          <Text className="text-base text-muted">
            Link your social media accounts to track analytics and manage campaigns
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted mb-3 uppercase">
            Available Platforms
          </Text>
          {connectedAccounts.map(account => renderPlatformCard(account))}
        </View>

        <View
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm text-muted leading-relaxed">
            <Text className="font-semibold text-foreground">Privacy & Security:</Text> We only access the data you authorize. Your credentials are encrypted and never stored on our servers.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
