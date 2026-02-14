import { ScrollView, Text, View, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * API Keys Dashboard Screen
 * Manage API keys, view usage, and configure permissions
 */

interface APIKey {
  id: string;
  name: string;
  key: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  lastUsedAt?: string;
  usage: {
    requests: number;
    limit: number;
    percentUsed: number;
  };
  isActive: boolean;
}

export default function APIKeysDashboardScreen() {
  const colors = useColors();
  const [keys, setKeys] = useState<APIKey[]>([
    {
      id: 'key_1',
      name: 'Production API Key',
      key: 'sk_live_abc123def456',
      tier: 'pro',
      createdAt: '2025-01-15',
      lastUsedAt: '2 minutes ago',
      usage: { requests: 8500, limit: 10000, percentUsed: 85 },
      isActive: true,
    },
    {
      id: 'key_2',
      name: 'Development Key',
      key: 'sk_test_xyz789uvw012',
      tier: 'free',
      createdAt: '2025-02-01',
      lastUsedAt: '1 hour ago',
      usage: { requests: 450, limit: 1000, percentUsed: 45 },
      isActive: true,
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const selectedKey = keys.find((k) => k.id === selectedKeyId);

  const handleCreateKey = () => {
    if (newKeyName.trim()) {
      const newKey: APIKey = {
        id: `key_${Date.now()}`,
        name: newKeyName,
        key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
        tier: 'pro',
        createdAt: new Date().toLocaleDateString(),
        usage: { requests: 0, limit: 10000, percentUsed: 0 },
        isActive: true,
      };
      setKeys([...keys, newKey]);
      setNewKeyName('');
      setShowCreateModal(false);
    }
  };

  const handleRevokeKey = (id: string) => {
    setKeys(keys.map((k) => (k.id === id ? { ...k, isActive: false } : k)));
    setShowDetails(false);
  };

  const handleRotateKey = (id: string) => {
    setKeys(
      keys.map((k) =>
        k.id === id
          ? {
              ...k,
              key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
              createdAt: new Date().toLocaleDateString(),
            }
          : k,
      ),
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return colors.primary;
      case 'pro':
        return colors.success;
      case 'free':
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const KeyCard = ({ apiKey }: { apiKey: APIKey }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedKeyId(apiKey.id);
        setShowDetails(true);
      }}
      className="bg-surface rounded-lg p-4 mb-3 border border-border"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{apiKey.name}</Text>
          <Text className="text-muted text-xs">Created {apiKey.createdAt}</Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: getTierColor(apiKey.tier) + '20' }}
        >
          <Text className="text-xs font-semibold" style={{ color: getTierColor(apiKey.tier) }}>
            {apiKey.tier.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-muted text-sm">Usage</Text>
          <Text className="text-foreground font-semibold">
            {apiKey.usage.requests} / {apiKey.usage.limit}
          </Text>
        </View>
        <View className="h-2 bg-border rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${apiKey.usage.percentUsed}%`,
              backgroundColor: apiKey.usage.percentUsed > 80 ? colors.error : colors.success,
            }}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-xs">
          {apiKey.lastUsedAt ? `Last used ${apiKey.lastUsedAt}` : 'Never used'}
        </Text>
        <View
          className="px-2 py-1 rounded"
          style={{ backgroundColor: apiKey.isActive ? colors.success + '20' : colors.error + '20' }}
        >
          <Text className="text-xs font-semibold" style={{ color: apiKey.isActive ? colors.success : colors.error }}>
            {apiKey.isActive ? 'Active' : 'Revoked'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">API Keys</Text>
            <Text className="text-muted">Manage your API keys and monitor usage</Text>
          </View>

          {/* Create Key Button */}
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-primary rounded-lg p-4 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="add" size={20} color={colors.background} />
            <Text className="text-background font-semibold">Create New Key</Text>
          </TouchableOpacity>

          {/* API Keys List */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Your Keys</Text>
            {keys.map((key) => (
              <KeyCard key={key.id} apiKey={key} />
            ))}
          </View>

          {/* Usage Summary */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-lg font-semibold text-foreground">Usage Summary</Text>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-foreground">Total Requests (24h)</Text>
              <Text className="font-semibold text-primary">
                {keys.reduce((sum, k) => sum + k.usage.requests, 0).toLocaleString()}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-foreground">Active Keys</Text>
              <Text className="font-semibold text-success">{keys.filter((k) => k.isActive).length}</Text>
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-foreground">Tier Distribution</Text>
              <Text className="font-semibold text-primary">
                {keys.filter((k) => k.tier === 'pro').length} Pro, {keys.filter((k) => k.tier === 'free').length} Free
              </Text>
            </View>
          </View>

          {/* Best Practices */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-2">
            <Text className="text-lg font-semibold text-foreground">Security Tips</Text>
            <Text className="text-muted text-sm">• Rotate keys regularly for security</Text>
            <Text className="text-muted text-sm">• Use separate keys for development and production</Text>
            <Text className="text-muted text-sm">• Monitor usage to avoid rate limits</Text>
            <Text className="text-muted text-sm">• Revoke keys you no longer need</Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Key Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-foreground">Create New Key</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              <Text className="text-foreground font-semibold">Key Name</Text>
              <TextInput
                placeholder="e.g., Production API Key"
                placeholderTextColor={colors.muted}
                value={newKeyName}
                onChangeText={setNewKeyName}
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            <View className="gap-2">
              <Text className="text-foreground font-semibold">Tier</Text>
              <View className="bg-surface border border-border rounded-lg p-3">
                <Text className="text-foreground">Pro (10,000 requests/month)</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleCreateKey} className="bg-primary rounded-lg p-4">
              <Text className="text-background font-semibold text-center">Create Key</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowCreateModal(false)} className="bg-surface rounded-lg p-4">
              <Text className="text-foreground font-semibold text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Key Details Modal */}
      <Modal visible={showDetails && !!selectedKey} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-foreground">{selectedKey?.name}</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedKey && (
              <>
                <View className="bg-surface rounded-lg p-4 gap-2">
                  <Text className="text-muted text-xs">API Key</Text>
                  <Text className="text-foreground font-mono text-sm">{selectedKey.key}</Text>
                </View>

                <View className="bg-surface rounded-lg p-4 gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">Created</Text>
                    <Text className="text-muted">{selectedKey.createdAt}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">Tier</Text>
                    <Text className="font-semibold" style={{ color: getTierColor(selectedKey.tier) }}>
                      {selectedKey.tier.toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">Status</Text>
                    <Text style={{ color: selectedKey.isActive ? colors.success : colors.error }}>
                      {selectedKey.isActive ? 'Active' : 'Revoked'}
                    </Text>
                  </View>
                </View>

                {selectedKey.isActive && (
                  <TouchableOpacity
                    onPress={() => handleRotateKey(selectedKey.id)}
                    className="bg-surface rounded-lg p-4 border border-border"
                  >
                    <Text className="text-primary font-semibold text-center">Rotate Key</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => handleRevokeKey(selectedKey.id)}
                  className="bg-error/10 rounded-lg p-4"
                >
                  <Text className="text-error font-semibold text-center">
                    {selectedKey.isActive ? 'Revoke Key' : 'Key Revoked'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowDetails(false)} className="bg-surface rounded-lg p-4">
                  <Text className="text-foreground font-semibold text-center">Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
