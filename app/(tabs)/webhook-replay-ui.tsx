import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';

interface WebhookLog {
  id: string;
  eventType: string;
  status: 'success' | 'failed' | 'pending';
  responseTime: number;
  timestamp: Date;
  payload: Record<string, unknown>;
}

interface ReplaySession {
  logId: string;
  originalPayload: Record<string, unknown>;
  modifiedPayload: Record<string, unknown>;
  status: 'pending' | 'replaying' | 'success' | 'failed';
  response?: string;
}

/**
 * Webhook Replay UI Screen
 * Allows users to select webhook logs and replay them with optional payload modifications
 */
export default function WebhookReplayUIScreen() {
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [replaySessions, setReplaySessions] = useState<ReplaySession[]>([]);
  const [payloadEditor, setPayloadEditor] = useState<string>('');
  const [filterEventType, setFilterEventType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Mock webhook logs for demo
  const mockLogs: WebhookLog[] = [
    {
      id: 'log-1',
      eventType: 'user.created',
      status: 'success',
      responseTime: 245,
      timestamp: new Date(Date.now() - 3600000),
      payload: { userId: '123', email: 'user@example.com' },
    },
    {
      id: 'log-2',
      eventType: 'user.updated',
      status: 'failed',
      responseTime: 5000,
      timestamp: new Date(Date.now() - 1800000),
      payload: { userId: '456', changes: { email: 'newemail@example.com' } },
    },
    {
      id: 'log-3',
      eventType: 'order.created',
      status: 'success',
      responseTime: 180,
      timestamp: new Date(Date.now() - 900000),
      payload: { orderId: 'ord-789', amount: 99.99 },
    },
  ];

  const filteredLogs = mockLogs.filter(log => {
    if (filterEventType && log.eventType !== filterEventType) return false;
    if (filterStatus && log.status !== filterStatus) return false;
    return true;
  });

  const handleSelectLog = (logId: string) => {
    setSelectedLogs(prev =>
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };

  const handleReplaySelected = () => {
    const sessions: ReplaySession[] = selectedLogs.map(logId => {
      const log = mockLogs.find(l => l.id === logId);
      return {
        logId,
        originalPayload: log?.payload || {},
        modifiedPayload: log?.payload || {},
        status: 'pending',
      };
    });
    setReplaySessions(sessions);
  };

  const handleEditPayload = (logId: string, newPayload: string) => {
    try {
      const parsed = JSON.parse(newPayload);
      setReplaySessions(prev =>
        prev.map(session =>
          session.logId === logId
            ? { ...session, modifiedPayload: parsed }
            : session
        )
      );
    } catch {
      // Invalid JSON, ignore
    }
  };

  const handleExecuteReplay = (logId: string) => {
    setReplaySessions(prev =>
      prev.map(session =>
        session.logId === logId
          ? {
              ...session,
              status: 'replaying',
              response: 'Replaying webhook...',
            }
          : session
      )
    );

    // Simulate replay completion
    setTimeout(() => {
      setReplaySessions(prev =>
        prev.map(session =>
          session.logId === logId
            ? {
                ...session,
                status: 'success',
                response: 'Webhook replayed successfully (200 OK)',
              }
            : session
        )
      );
    }, 1500);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return '#22C55E';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      case 'replaying':
        return '#0a7ea4';
      default:
        return '#687076';
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Webhook Replay
            </Text>
            <Text className="text-base text-muted">
              Select and replay webhook events for testing
            </Text>
          </View>

          {/* Filters */}
          <View className="gap-3 bg-surface rounded-lg p-4">
            <Text className="font-semibold text-foreground">Filters</Text>
            <TextInput
              placeholder="Filter by event type..."
              value={filterEventType}
              onChangeText={setFilterEventType}
              className="bg-background border border-border rounded-lg p-3 text-foreground"
              placeholderTextColor="#687076"
            />
            <View className="flex-row gap-2">
              {['success', 'failed', 'pending'].map(status => (
                <Pressable
                  key={status}
                  onPress={() =>
                    setFilterStatus(filterStatus === status ? '' : status)
                  }
                  style={{
                    backgroundColor:
                      filterStatus === status ? '#0a7ea4' : '#f5f5f5',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      color: filterStatus === status ? '#fff' : '#11181C',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Webhook Logs */}
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-foreground">
                Available Webhooks ({filteredLogs.length})
              </Text>
              {selectedLogs.length > 0 && (
                <Pressable
                  onPress={handleReplaySelected}
                  style={{
                    backgroundColor: '#0a7ea4',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text className="text-white text-sm font-semibold">
                    Replay {selectedLogs.length}
                  </Text>
                </Pressable>
              )}
            </View>

            {filteredLogs.map(log => (
              <Pressable
                key={log.id}
                onPress={() => handleSelectLog(log.id)}
                style={{
                  backgroundColor: selectedLogs.includes(log.id)
                    ? '#E6F4FE'
                    : '#f5f5f5',
                  borderLeftWidth: 4,
                  borderLeftColor: getStatusColor(log.status),
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <View className="gap-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-semibold text-foreground">
                      {log.eventType}
                    </Text>
                    <Text
                      style={{
                        color: getStatusColor(log.status),
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {log.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    Response time: {log.responseTime}ms
                  </Text>
                  <Text className="text-xs text-muted font-mono">
                    {JSON.stringify(log.payload).substring(0, 50)}...
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Replay Sessions */}
          {replaySessions.length > 0 && (
            <View className="gap-3 bg-surface rounded-lg p-4">
              <Text className="font-semibold text-foreground">
                Replay Sessions
              </Text>

              {replaySessions.map(session => (
                <View key={session.logId} className="gap-3 bg-background rounded-lg p-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-semibold text-foreground">
                      {mockLogs.find(l => l.id === session.logId)?.eventType}
                    </Text>
                    <Text
                      style={{
                        color: getStatusColor(session.status),
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {session.status.toUpperCase()}
                    </Text>
                  </View>

                  <Text className="text-xs text-muted font-semibold">
                    Payload Editor
                  </Text>
                  <TextInput
                    value={JSON.stringify(session.modifiedPayload, null, 2)}
                    onChangeText={text => handleEditPayload(session.logId, text)}
                    multiline
                    numberOfLines={4}
                    className="bg-background border border-border rounded-lg p-2 font-mono text-xs text-foreground"
                    placeholderTextColor="#687076"
                  />

                  {session.response && (
                    <View className="bg-background border border-border rounded-lg p-2">
                      <Text className="text-xs text-muted">{session.response}</Text>
                    </View>
                  )}

                  {session.status === 'pending' && (
                    <Pressable
                      onPress={() => handleExecuteReplay(session.logId)}
                      style={{
                        backgroundColor: '#0a7ea4',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 6,
                      }}
                    >
                      <Text className="text-white text-sm font-semibold text-center">
                        Execute Replay
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-muted text-center">
                No webhooks match your filters
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
