import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  params?: Record<string, string>;
  requestBody?: Record<string, string>;
  response?: Record<string, string>;
  example?: string;
}

const API_ENDPOINTS: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/api/webhooks',
    description: 'Get all webhooks for organization',
    response: { webhooks: 'Array of webhook objects', total: 'Total count' },
    example: 'curl -H "Authorization: Bearer TOKEN" https://api.example.com/api/webhooks',
  },
  {
    method: 'POST',
    path: '/api/webhooks',
    description: 'Create a new webhook',
    requestBody: { url: 'Webhook URL', events: 'Array of event types', active: 'Boolean' },
    response: { id: 'Webhook ID', url: 'Webhook URL', createdAt: 'Creation timestamp' },
    example: 'curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d \'{"url":"https://example.com/webhook","events":["email.sent"]}\' https://api.example.com/api/webhooks',
  },
  {
    method: 'GET',
    path: '/api/webhooks/:id',
    description: 'Get webhook by ID',
    params: { id: 'Webhook ID' },
    response: { id: 'Webhook ID', url: 'Webhook URL', events: 'Event types', active: 'Boolean' },
    example: 'curl -H "Authorization: Bearer TOKEN" https://api.example.com/api/webhooks/webhook-123',
  },
  {
    method: 'PUT',
    path: '/api/webhooks/:id',
    description: 'Update webhook',
    params: { id: 'Webhook ID' },
    requestBody: { url: 'Webhook URL', events: 'Array of event types', active: 'Boolean' },
    response: { id: 'Webhook ID', updated: 'Updated timestamp' },
    example: 'curl -X PUT -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d \'{"active":false}\' https://api.example.com/api/webhooks/webhook-123',
  },
  {
    method: 'DELETE',
    path: '/api/webhooks/:id',
    description: 'Delete webhook',
    params: { id: 'Webhook ID' },
    response: { success: 'Boolean', deleted: 'Webhook ID' },
    example: 'curl -X DELETE -H "Authorization: Bearer TOKEN" https://api.example.com/api/webhooks/webhook-123',
  },
  {
    method: 'GET',
    path: '/api/webhooks/:id/logs',
    description: 'Get webhook delivery logs',
    params: { id: 'Webhook ID', limit: 'Number of logs (default 50)' },
    response: { logs: 'Array of log objects', total: 'Total count' },
    example: 'curl -H "Authorization: Bearer TOKEN" https://api.example.com/api/webhooks/webhook-123/logs?limit=100',
  },
  {
    method: 'POST',
    path: '/api/webhooks/:id/test',
    description: 'Send test webhook',
    params: { id: 'Webhook ID' },
    requestBody: { event: 'Event type', payload: 'Test payload object' },
    response: { statusCode: 'HTTP status', responseTime: 'Response time in ms', success: 'Boolean' },
    example: 'curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d \'{"event":"test.event"}\' https://api.example.com/api/webhooks/webhook-123/test',
  },
  {
    method: 'GET',
    path: '/api/api-keys',
    description: 'Get all API keys for organization',
    response: { keys: 'Array of API key objects', total: 'Total count' },
    example: 'curl -H "Authorization: Bearer TOKEN" https://api.example.com/api/api-keys',
  },
  {
    method: 'POST',
    path: '/api/api-keys',
    description: 'Create new API key',
    requestBody: { name: 'Key name', permissions: 'Array of permissions', expiresIn: 'Days until expiration' },
    response: { id: 'Key ID', key: 'Secret key (only shown once)', createdAt: 'Creation timestamp' },
    example: 'curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d \'{"name":"My Key","permissions":["read:webhooks","write:webhooks"]}\' https://api.example.com/api/api-keys',
  },
];

export default function APIDocsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);

  const filteredEndpoints = API_ENDPOINTS.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return '#3b82f6';
      case 'POST':
        return '#10b981';
      case 'PUT':
        return '#f59e0b';
      case 'DELETE':
        return '#ef4444';
      case 'PATCH':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">API Documentation</Text>
            <Text className="text-base text-muted">
              Interactive API reference with examples and authentication details
            </Text>
          </View>

          {/* Search */}
          <TextInput
            placeholder="Search endpoints..."
            placeholderTextColor="#9BA1A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="w-full bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
          />

          {/* Endpoints List */}
          {selectedEndpoint ? (
            <View className="gap-4">
              <Pressable
                onPress={() => setSelectedEndpoint(null)}
                className="flex-row items-center gap-2 mb-4"
              >
                <Text className="text-primary text-base font-semibold">← Back to List</Text>
              </Pressable>

              {/* Endpoint Details */}
              <View className="bg-surface rounded-lg p-4 gap-4 border border-border">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{ backgroundColor: getMethodColor(selectedEndpoint.method) }}
                    className="px-3 py-1 rounded"
                  >
                    <Text className="text-white font-bold text-sm">{selectedEndpoint.method}</Text>
                  </View>
                  <Text className="text-lg font-mono text-foreground flex-1">{selectedEndpoint.path}</Text>
                </View>

                <Text className="text-base text-foreground">{selectedEndpoint.description}</Text>

                {selectedEndpoint.params && (
                  <View className="gap-2">
                    <Text className="font-semibold text-foreground">Parameters:</Text>
                    {Object.entries(selectedEndpoint.params).map(([key, value]) => (
                      <Text key={key} className="text-sm text-muted ml-2">
                        • <Text className="font-mono">{key}</Text>: {value}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedEndpoint.requestBody && (
                  <View className="gap-2">
                    <Text className="font-semibold text-foreground">Request Body:</Text>
                    {Object.entries(selectedEndpoint.requestBody).map(([key, value]) => (
                      <Text key={key} className="text-sm text-muted ml-2">
                        • <Text className="font-mono">{key}</Text>: {value}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedEndpoint.response && (
                  <View className="gap-2">
                    <Text className="font-semibold text-foreground">Response:</Text>
                    {Object.entries(selectedEndpoint.response).map(([key, value]) => (
                      <Text key={key} className="text-sm text-muted ml-2">
                        • <Text className="font-mono">{key}</Text>: {value}
                      </Text>
                    ))}
                  </View>
                )}

                {selectedEndpoint.example && (
                  <View className="gap-2">
                    <Text className="font-semibold text-foreground">Example:</Text>
                    <View className="bg-background rounded p-3 border border-border">
                      <Text className="text-xs font-mono text-muted">{selectedEndpoint.example}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View className="gap-2">
              {filteredEndpoints.length > 0 ? (
                filteredEndpoints.map((endpoint, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedEndpoint(endpoint)}
                    className="bg-surface rounded-lg p-4 border border-border active:opacity-70"
                  >
                    <View className="flex-row items-center gap-3 mb-2">
                      <View
                        style={{ backgroundColor: getMethodColor(endpoint.method) }}
                        className="px-3 py-1 rounded"
                      >
                        <Text className="text-white font-bold text-xs">{endpoint.method}</Text>
                      </View>
                      <Text className="text-sm font-mono text-foreground flex-1">{endpoint.path}</Text>
                    </View>
                    <Text className="text-sm text-muted">{endpoint.description}</Text>
                  </Pressable>
                ))
              ) : (
                <View className="items-center justify-center py-8">
                  <Text className="text-muted text-base">No endpoints found</Text>
                </View>
              )}
            </View>
          )}

          {/* Authentication Info */}
          <View className="bg-surface rounded-lg p-4 gap-2 border border-border mt-4">
            <Text className="font-semibold text-foreground">Authentication</Text>
            <Text className="text-sm text-muted">
              All API requests require an Authorization header with a Bearer token:
            </Text>
            <View className="bg-background rounded p-3 border border-border mt-2">
              <Text className="text-xs font-mono text-muted">
                Authorization: Bearer YOUR_API_KEY
              </Text>
            </View>
          </View>

          {/* Rate Limiting Info */}
          <View className="bg-surface rounded-lg p-4 gap-2 border border-border">
            <Text className="font-semibold text-foreground">Rate Limiting</Text>
            <Text className="text-sm text-muted">
              Free tier: 100 requests/hour{'\n'}
              Pro tier: 1,000 requests/hour{'\n'}
              Enterprise: 10,000 requests/hour
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
