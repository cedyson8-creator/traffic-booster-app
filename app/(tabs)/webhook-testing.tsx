import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

/**
 * Webhook Testing Screen
 * Allows users to test webhooks, view retry history, and configure retry policies
 */
export default function WebhookTestingScreen() {
  const colors = useColors();
  const [selectedTab, setSelectedTab] = useState<'test' | 'history' | 'config'>('test');
  const [webhookUrl, setWebhookUrl] = useState('https://example.com/webhook');
  const [testPayload, setTestPayload] = useState(JSON.stringify({ event: 'test', timestamp: new Date().toISOString() }, null, 2));
  const [testResult, setTestResult] = useState<{ status: number; time: number; success: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data - in production, fetch from API
  const retryHistory = [
    { id: 1, timestamp: new Date(Date.now() - 3600000), status: 'failed', statusCode: 500, responseTime: 150 },
    { id: 2, timestamp: new Date(Date.now() - 1800000), status: 'success', statusCode: 200, responseTime: 100 },
    { id: 3, timestamp: new Date(Date.now() - 900000), status: 'failed', statusCode: 408, responseTime: 5000 },
  ];

  const retryConfig = {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 3600000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  };

  const handleTestWebhook = async () => {
    setLoading(true);
    try {
      // Simulate webhook test
      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));
      const endTime = Date.now();

      const success = Math.random() > 0.3;
      setTestResult({
        status: success ? 200 : 500,
        time: endTime - startTime,
        success,
      });
    } finally {
      setLoading(false);
    }
  };

  const TestTab = () => (
    <View className="gap-4">
      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">Webhook URL</Text>
        <TextInput
          value={webhookUrl}
          onChangeText={setWebhookUrl}
          placeholder="https://example.com/webhook"
          className="border border-border rounded-lg p-3 text-foreground"
          placeholderTextColor={colors.muted}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">Test Payload</Text>
        <TextInput
          value={testPayload}
          onChangeText={setTestPayload}
          placeholder="Enter JSON payload"
          multiline
          numberOfLines={6}
          className="border border-border rounded-lg p-3 text-foreground"
          placeholderTextColor={colors.muted}
        />
      </View>

      <Pressable
        onPress={handleTestWebhook}
        disabled={loading}
        style={({ pressed }) => [
          {
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 8,
            opacity: pressed || loading ? 0.7 : 1,
          },
        ]}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Testing...' : 'Send Test Webhook'}
        </Text>
      </Pressable>

      {testResult && (
        <View
          className="rounded-lg p-4 border-l-4"
          style={{
            borderLeftColor: testResult.success ? colors.success : colors.error,
            backgroundColor: colors.surface,
          }}
        >
          <Text className="text-base font-bold text-foreground mb-2">
            {testResult.success ? 'Success' : 'Failed'}
          </Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Status Code:</Text>
              <Text className="text-sm font-semibold text-foreground">{testResult.status}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">Response Time:</Text>
              <Text className="text-sm font-semibold text-foreground">{testResult.time}ms</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const HistoryTab = () => (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-foreground mb-2">Recent Attempts</Text>

      {retryHistory.map((attempt) => (
        <View key={attempt.id} className="bg-surface rounded-lg p-4 border border-border">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Attempt #{attempt.id}
              </Text>
              <Text className="text-xs text-muted mt-1">
                {attempt.timestamp.toLocaleString()}
              </Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor:
                  attempt.status === 'success' ? colors.success : colors.error,
              }}
            >
              <Text className="text-xs font-semibold text-white">
                {attempt.status === 'success' ? '✓' : '✗'}
              </Text>
            </View>
          </View>

          <View className="border-t border-border pt-2 mt-2">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-muted">Status Code:</Text>
              <Text className="text-xs font-semibold text-foreground">
                {attempt.statusCode}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">Response Time:</Text>
              <Text className="text-xs font-semibold text-foreground">
                {attempt.responseTime}ms
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const ConfigTab = () => (
    <View className="gap-4">
      <View className="bg-surface rounded-lg p-4">
        <Text className="text-base font-bold text-foreground mb-4">Retry Configuration</Text>

        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Max Retries</Text>
            <Text className="text-base font-semibold text-foreground">
              {retryConfig.maxRetries}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Initial Delay</Text>
            <Text className="text-base font-semibold text-foreground">
              {retryConfig.initialDelayMs}ms
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Max Delay</Text>
            <Text className="text-base font-semibold text-foreground">
              {retryConfig.maxDelayMs / 1000 / 60}min
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Backoff Multiplier</Text>
            <Text className="text-base font-semibold text-foreground">
              {retryConfig.backoffMultiplier}x
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-muted">Jitter Factor</Text>
            <Text className="text-base font-semibold text-foreground">
              {(retryConfig.jitterFactor * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-lg p-4">
        <Text className="text-base font-bold text-foreground mb-3">Retry Schedule</Text>
        <View className="gap-2">
          {[1, 2, 3, 4, 5].map((attempt) => {
            const delay = retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
            const cappedDelay = Math.min(delay, retryConfig.maxDelayMs);
            return (
              <View key={attempt} className="flex-row justify-between">
                <Text className="text-xs text-muted">Retry #{attempt}</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {cappedDelay < 1000 ? `${cappedDelay}ms` : `${(cappedDelay / 1000).toFixed(1)}s`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          {
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 8,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text className="text-white text-center font-semibold">Edit Configuration</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">Webhook Testing</Text>

            {/* Tab Navigation */}
            <View className="flex-row gap-2 mb-4">
              {(['test', 'history', 'config'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor:
                        selectedTab === tab ? colors.primary : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    className={`text-center font-semibold text-xs ${
                      selectedTab === tab
                        ? 'text-white'
                        : 'text-foreground'
                    }`}
                  >
                    {tab === 'test' && 'Test'}
                    {tab === 'history' && 'History'}
                    {tab === 'config' && 'Config'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tab Content */}
            {selectedTab === 'test' && <TestTab />}
            {selectedTab === 'history' && <HistoryTab />}
            {selectedTab === 'config' && <ConfigTab />}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
