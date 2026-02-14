import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface BouncedEmail {
  id: number;
  email: string;
  reason: string;
  bounceType: 'permanent' | 'temporary';
  bouncedAt: string;
}

interface BounceManagementModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function BounceManagementModal({ visible, onClose, userId }: BounceManagementModalProps) {
  const colors = useColors();
  const [bouncedEmails, setBouncedEmails] = useState<BouncedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      loadBouncedEmails();
    }
  }, [visible]);

  const loadBouncedEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/delivery-analytics/bounced?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBouncedEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Error loading bounced emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmail = async (emailId: number) => {
    Alert.alert(
      'Remove Bounced Email',
      'This email will be removed from future sends. Continue?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            setRemoving(emailId);
            try {
              const response = await fetch(`/api/delivery-analytics/bounced/${emailId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
              });
              if (response.ok) {
                setBouncedEmails(bouncedEmails.filter(e => e.id !== emailId));
              }
            } catch (error) {
              console.error('Error removing bounced email:', error);
            } finally {
              setRemoving(null);
            }
          },
        },
      ]
    );
  };

  const handleExportBounces = async () => {
    try {
      const csv = ['Email,Bounce Type,Reason,Date'];
      bouncedEmails.forEach(email => {
        csv.push(`"${email.email}","${email.bounceType}","${email.reason}","${email.bouncedAt}"`);
      });
      // In a real app, this would download the CSV
      Alert.alert('Export', `${bouncedEmails.length} bounced emails ready to export`);
    } catch (error) {
      console.error('Error exporting bounces:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.surface,
            paddingVertical: 16,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
              Bounced Emails ({bouncedEmails.length})
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 16, color: colors.primary }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {bouncedEmails.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>
              No bounced emails. Great job! 🎉
            </Text>
          </View>
        ) : (
          <FlatList
            data={bouncedEmails}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                      {item.email}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
                      Type: {item.bounceType === 'permanent' ? '🔴 Permanent' : '🟡 Temporary'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                      Reason: {item.reason}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {new Date(item.bouncedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveEmail(item.id)}
                    disabled={removing === item.id}
                    style={{
                      backgroundColor: colors.error + '20',
                      borderRadius: 6,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                      {removing === item.id ? '...' : '🗑️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* Footer Actions */}
        {bouncedEmails.length > 0 && (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TouchableOpacity
              onPress={handleExportBounces}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                📥 Export Bounced List (CSV)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}
