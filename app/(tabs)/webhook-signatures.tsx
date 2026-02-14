import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

/**
 * Webhook Signatures Screen
 * Displays HMAC-SHA256 signatures for webhook verification
 */
export default function WebhookSignaturesScreen() {
  const colors = useColors();
  const [selectedTab, setSelectedTab] = useState<'verify' | 'example' | 'guide'>('verify');
  const [webhookPayload, setWebhookPayload] = useState(JSON.stringify({ event: 'payment.completed', id: '12345' }, null, 2));
  const [webhookSecret, setWebhookSecret] = useState('whsec_test_1234567890abcdef');
  const [signature, setSignature] = useState('sha256=abcdef1234567890...');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // Mock webhook data
  const webhookExamples = [
    {
      event: 'payment.completed',
      payload: { id: 'pay_123', amount: 9900, currency: 'USD', status: 'completed' },
      signature: 'sha256=abc123def456...',
    },
    {
      event: 'subscription.created',
      payload: { id: 'sub_456', plan: 'pro', status: 'active' },
      signature: 'sha256=xyz789uvw012...',
    },
    {
      event: 'api_key.rotated',
      payload: { id: 'key_789', rotatedAt: new Date().toISOString() },
      signature: 'sha256=pqr345stu678...',
    },
  ];

  const handleVerifySignature = () => {
    // Simulate signature verification
    const isValid = Math.random() > 0.3;
    setIsVerified(isValid);
  };

  const VerifyTab = () => (
    <View className="gap-4">
      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">Webhook Payload</Text>
        <TextInput
          value={webhookPayload}
          onChangeText={setWebhookPayload}
          placeholder="Enter webhook payload (JSON)"
          multiline
          numberOfLines={6}
          className="border border-border rounded-lg p-3 text-foreground"
          placeholderTextColor={colors.muted}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">Webhook Secret</Text>
        <TextInput
          value={webhookSecret}
          onChangeText={setWebhookSecret}
          placeholder="Enter your webhook secret"
          secureTextEntry
          className="border border-border rounded-lg p-3 text-foreground"
          placeholderTextColor={colors.muted}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">Signature Header</Text>
        <TextInput
          value={signature}
          onChangeText={setSignature}
          placeholder="Enter signature from X-Webhook-Signature header"
          className="border border-border rounded-lg p-3 text-foreground font-mono text-xs"
          placeholderTextColor={colors.muted}
        />
      </View>

      <Pressable
        onPress={handleVerifySignature}
        style={({ pressed }) => [
          {
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 8,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text className="text-white text-center font-semibold">Verify Signature</Text>
      </Pressable>

      {isVerified !== null && (
        <View
          className="rounded-lg p-4 border-l-4"
          style={{
            borderLeftColor: isVerified ? colors.success : colors.error,
            backgroundColor: colors.surface,
          }}
        >
          <Text className="text-base font-bold text-foreground mb-2">
            {isVerified ? '✓ Signature Valid' : '✗ Signature Invalid'}
          </Text>
          <Text className="text-sm text-muted">
            {isVerified
              ? 'The webhook signature is authentic and has not been tampered with.'
              : 'The webhook signature does not match. The payload may have been modified.'}
          </Text>
        </View>
      )}
    </View>
  );

  const ExampleTab = () => (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-foreground mb-2">Webhook Examples</Text>

      {webhookExamples.map((example, index) => (
        <View key={index} className="bg-surface rounded-lg p-4 border border-border">
          <View className="mb-3">
            <Text className="text-sm font-bold text-foreground mb-1">{example.event}</Text>
            <View className="bg-background rounded p-2">
              <Text className="text-xs text-muted font-mono">
                {JSON.stringify(example.payload, null, 2)}
              </Text>
            </View>
          </View>

          <View className="border-t border-border pt-3">
            <Text className="text-xs text-muted mb-1">Signature:</Text>
            <View className="bg-background rounded p-2 flex-row items-center justify-between">
              <Text className="text-xs text-foreground font-mono flex-1">
                {example.signature}
              </Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                onPress={() => {
                  // Copy to clipboard simulation
                }}
              >
                <Text className="text-xs text-primary font-semibold ml-2">Copy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const GuideTab = () => (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="gap-4">
      <View className="bg-surface rounded-lg p-4">
        <Text className="text-base font-bold text-foreground mb-3">How to Verify Webhooks</Text>

        <View className="gap-3">
          <View>
            <Text className="text-sm font-semibold text-foreground mb-1">1. Extract Signature</Text>
            <View className="bg-background rounded p-2">
              <Text className="text-xs text-muted font-mono">
                const signature = req.headers['x-webhook-signature'];
              </Text>
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-1">2. Get Raw Body</Text>
            <View className="bg-background rounded p-2">
              <Text className="text-xs text-muted font-mono">
                const rawBody = req.rawBody; // Don't parse JSON yet
              </Text>
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-1">3. Create HMAC</Text>
            <View className="bg-background rounded p-2">
              <Text className="text-xs text-muted font-mono">
                const crypto = require('crypto');{'\n'}
                const hash = crypto{'\n'}
                {'  '}.createHmac('sha256', secret){'\n'}
                {'  '}.update(rawBody){'\n'}
                {'  '}.digest('hex');
              </Text>
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-1">4. Compare Signatures</Text>
            <View className="bg-background rounded p-2">
              <Text className="text-xs text-muted font-mono">
                const isValid = signature === `sha256=${'${hash}'}`
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-lg p-4">
        <Text className="text-base font-bold text-foreground mb-3">Security Best Practices</Text>

        <View className="gap-2">
          <View className="flex-row gap-2">
            <Text className="text-lg text-success">✓</Text>
            <Text className="text-sm text-foreground flex-1">Always verify webhook signatures</Text>
          </View>
          <View className="flex-row gap-2">
            <Text className="text-lg text-success">✓</Text>
            <Text className="text-sm text-foreground flex-1">Use constant-time comparison</Text>
          </View>
          <View className="flex-row gap-2">
            <Text className="text-lg text-success">✓</Text>
            <Text className="text-sm text-foreground flex-1">Store secrets securely (env vars)</Text>
          </View>
          <View className="flex-row gap-2">
            <Text className="text-lg text-success">✓</Text>
            <Text className="text-sm text-foreground flex-1">Rotate secrets regularly</Text>
          </View>
          <View className="flex-row gap-2">
            <Text className="text-lg text-error">✗</Text>
            <Text className="text-sm text-foreground flex-1">Don't log webhook secrets</Text>
          </View>
          <View className="flex-row gap-2">
            <Text className="text-lg text-error">✗</Text>
            <Text className="text-sm text-foreground flex-1">Don't hardcode secrets</Text>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-lg p-4">
        <Text className="text-base font-bold text-foreground mb-2">Signature Format</Text>
        <Text className="text-xs text-muted mb-3">
          Signatures are formatted as: sha256=&lt;hex_encoded_hash&gt;
        </Text>
        <View className="bg-background rounded p-2">
          <Text className="text-xs text-foreground font-mono">
            sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">Webhook Signatures</Text>

            {/* Tab Navigation */}
            <View className="flex-row gap-2 mb-4">
              {(['verify', 'example', 'guide'] as const).map((tab) => (
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
                      selectedTab === tab ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {tab === 'verify' && 'Verify'}
                    {tab === 'example' && 'Examples'}
                    {tab === 'guide' && 'Guide'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tab Content */}
            {selectedTab === 'verify' && <VerifyTab />}
            {selectedTab === 'example' && <ExampleTab />}
            {selectedTab === 'guide' && <GuideTab />}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
