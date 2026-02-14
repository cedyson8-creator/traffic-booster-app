import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';

interface Alert {
  id: number;
  alertType: 'low_success_rate' | 'high_bounce_rate' | 'delivery_failure';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  createdAt: string;
  isResolved: boolean;
}

interface AlertsNotificationProps {
  visible: boolean;
  onClose: () => void;
}

export function AlertsNotification({ visible, onClose }: AlertsNotificationProps) {
  const colors = useColors();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (visible && user) {
      loadAlerts();
    }
  }, [visible, user]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/alerts/active?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (response.ok) {
        setAlerts(alerts.filter((a) => a.id !== alertId));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_success_rate':
        return '📉';
      case 'high_bounce_rate':
        return '📧';
      case 'delivery_failure':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '80%',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 30,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                Performance Alerts
              </Text>
              {stats && (
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                  {stats.activeAlerts} active • {stats.criticalAlerts} critical
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : alerts.length === 0 ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>
                All systems operating normally
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {alerts.map((alert) => (
                <View
                  key={alert.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderLeftWidth: 4,
                    borderLeftColor: getSeverityColor(alert.severity),
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, marginRight: 6 }}>{getAlertIcon(alert.alertType)}</Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.foreground,
                          }}
                        >
                          {alert.alertType.replace(/_/g, ' ')}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: colors.background,
                            backgroundColor: getSeverityColor(alert.severity),
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            marginLeft: 6,
                          }}
                        >
                          {alert.severity.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                        {alert.message}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
                        Current: {alert.currentValue}% | Threshold: {alert.threshold}%
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => resolveAlert(alert.id)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.primary,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.background }}>
                        Resolve
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          {alerts.length > 0 && (
            <TouchableOpacity
              onPress={onClose}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                backgroundColor: colors.primary,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.background }}>
                Close
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
