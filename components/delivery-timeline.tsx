import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface DeliveryEvent {
  id: number;
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  timestamp: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    url?: string;
  };
}

interface DeliveryTimelineProps {
  logId: number;
  userId: string;
}

const eventIcons: Record<string, string> = {
  sent: '📤',
  delivered: '✅',
  opened: '👁️',
  clicked: '🔗',
  bounced: '❌',
  complained: '⚠️',
};

const eventColors: Record<string, string> = {
  sent: '#3B82F6',
  delivered: '#10B981',
  opened: '#F59E0B',
  clicked: '#8B5CF6',
  bounced: '#EF4444',
  complained: '#DC2626',
};

export function DeliveryTimeline({ logId, userId }: DeliveryTimelineProps) {
  const colors = useColors();
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [logId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/webhooks/events/${logId}?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading delivery events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 14 }}>
          No delivery events yet
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ maxHeight: 300 }}>
      <View style={{ padding: 16 }}>
        {/* Timeline Container */}
        <View style={{ position: 'relative' }}>
          {/* Vertical Line */}
          <View
            style={{
              position: 'absolute',
              left: 20,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: colors.border,
            }}
          />

          {/* Events */}
          {events.map((event, index) => (
            <View key={event.id} style={{ marginBottom: 20, marginLeft: 60 }}>
              {/* Event Dot */}
              <View
                style={{
                  position: 'absolute',
                  left: -44,
                  top: 2,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: eventColors[event.event] || colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: colors.background,
                }}
              >
                <Text style={{ fontSize: 18 }}>{eventIcons[event.event]}</Text>
              </View>

              {/* Event Card */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Event Title */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, textTransform: 'capitalize' }}>
                    {event.event}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </Text>
                </View>

                {/* Event Date */}
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
                  {new Date(event.timestamp).toLocaleDateString()}
                </Text>

                {/* Event Metadata */}
                {event.metadata && (
                  <View style={{ backgroundColor: colors.background, borderRadius: 6, padding: 8, marginTop: 8 }}>
                    {event.metadata.userAgent && (
                      <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
                        Device: {event.metadata.userAgent.substring(0, 50)}...
                      </Text>
                    )}
                    {event.metadata.ipAddress && (
                      <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
                        IP: {event.metadata.ipAddress}
                      </Text>
                    )}
                    {event.metadata.url && (
                      <Text style={{ fontSize: 11, color: colors.primary }}>
                        Link: {event.metadata.url}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
