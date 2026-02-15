import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';

interface AlertRule {
  id: string;
  name: string;
  triggerType: 'error_rate' | 'api_latency' | 'webhook_failure' | 'quota_exceeded' | 'failed_auth';
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  threshold: number;
  channels: ('email' | 'slack' | 'discord' | 'webhook')[];
  enabled: boolean;
}

/**
 * Alert Rule Builder UI Screen
 * Allows users to create and configure custom alert rules visually
 */
export default function AlertRuleBuilderScreen() {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'rule-1',
      name: 'High Error Rate',
      triggerType: 'error_rate',
      operator: '>',
      threshold: 5,
      channels: ['email', 'slack'],
      enabled: true,
    },
  ]);

  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    triggerType: 'error_rate',
    operator: '>',
    threshold: 5,
    channels: [],
  });

  const [showBuilder, setShowBuilder] = useState(false);

  const triggerTypes = [
    { value: 'error_rate', label: 'Error Rate (%)', unit: '%' },
    { value: 'api_latency', label: 'API Latency (ms)', unit: 'ms' },
    { value: 'webhook_failure', label: 'Webhook Failures (%)', unit: '%' },
    { value: 'quota_exceeded', label: 'Quota Usage (%)', unit: '%' },
    { value: 'failed_auth', label: 'Failed Auth (count)', unit: 'attempts' },
  ];

  const operators = ['>', '<', '==', '!=', '>=', '<='];
  const channels = ['email', 'slack', 'discord', 'webhook'];

  const getTriggerLabel = (type: string): string => {
    const trigger = triggerTypes.find(t => t.value === type);
    return trigger?.label || type;
  };

  const getTriggerUnit = (type: string): string => {
    const trigger = triggerTypes.find(t => t.value === type);
    return trigger?.unit || '';
  };

  const handleAddRule = () => {
    if (!newRule.name || newRule.channels?.length === 0) {
      return;
    }

    const rule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      triggerType: newRule.triggerType as any,
      operator: newRule.operator as any,
      threshold: newRule.threshold || 5,
      channels: newRule.channels as any,
      enabled: true,
    };

    setRules([...rules, rule]);
    setNewRule({
      triggerType: 'error_rate',
      operator: '>',
      threshold: 5,
      channels: [],
    });
    setShowBuilder(false);
  };

  const handleToggleChannel = (channel: string) => {
    const channels = newRule.channels || [];
    setNewRule({
      ...newRule,
      channels: channels.includes(channel as any)
        ? channels.filter(c => c !== channel)
        : [...channels, channel as any],
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Alert Rules
            </Text>
            <Text className="text-base text-muted">
              Create and manage custom alert rules
            </Text>
          </View>

          {/* Active Rules */}
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-foreground">
                Rules ({rules.length})
              </Text>
              <Pressable
                onPress={() => setShowBuilder(!showBuilder)}
                style={{
                  backgroundColor: '#0a7ea4',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <Text className="text-white text-sm font-semibold">
                  {showBuilder ? 'Cancel' : '+ New Rule'}
                </Text>
              </Pressable>
            </View>

            {rules.map(rule => (
              <View
                key={rule.id}
                className="bg-surface rounded-lg p-4 gap-3"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 gap-2">
                    <Text className="font-semibold text-foreground">
                      {rule.name}
                    </Text>
                    <Text className="text-sm text-muted">
                      {getTriggerLabel(rule.triggerType)} {rule.operator}{' '}
                      {rule.threshold}
                      {getTriggerUnit(rule.triggerType)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleToggleRule(rule.id)}
                    style={{
                      backgroundColor: rule.enabled ? '#22C55E' : '#E5E7EB',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: rule.enabled ? '#fff' : '#687076',
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {rule.enabled ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                </View>

                <View className="flex-row gap-2 flex-wrap">
                  {rule.channels.map(channel => (
                    <View
                      key={channel}
                      style={{
                        backgroundColor: '#E6F4FE',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Text className="text-xs font-semibold text-primary">
                        {channel}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => handleDeleteRule(rule.id)}
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    paddingTop: 12,
                  }}
                >
                  <Text className="text-sm text-error font-semibold">
                    Delete Rule
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Rule Builder */}
          {showBuilder && (
            <View className="bg-surface rounded-lg p-4 gap-4">
              <Text className="font-semibold text-foreground text-lg">
                Create New Rule
              </Text>

              {/* Rule Name */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Rule Name
                </Text>
                <TextInput
                  placeholder="e.g., High Error Rate"
                  value={newRule.name || ''}
                  onChangeText={text => setNewRule({ ...newRule, name: text })}
                  className="bg-background border border-border rounded-lg p-3 text-foreground"
                  placeholderTextColor="#687076"
                />
              </View>

              {/* Trigger Type */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  When
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {triggerTypes.map(trigger => (
                      <Pressable
                        key={trigger.value}
                        onPress={() =>
                          setNewRule({ ...newRule, triggerType: trigger.value as any })
                        }
                        style={{
                          backgroundColor:
                            newRule.triggerType === trigger.value
                              ? '#0a7ea4'
                              : '#f5f5f5',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              newRule.triggerType === trigger.value
                                ? '#fff'
                                : '#11181C',
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {trigger.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Operator and Threshold */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Condition
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-1">
                        {operators.map(op => (
                          <Pressable
                            key={op}
                            onPress={() =>
                              setNewRule({ ...newRule, operator: op as any })
                            }
                            style={{
                              backgroundColor:
                                newRule.operator === op ? '#0a7ea4' : '#f5f5f5',
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  newRule.operator === op ? '#fff' : '#11181C',
                                fontSize: 12,
                                fontWeight: '600',
                              }}
                            >
                              {op}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <TextInput
                    placeholder="5"
                    value={String(newRule.threshold || '')}
                    onChangeText={text =>
                      setNewRule({ ...newRule, threshold: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    className="bg-background border border-border rounded-lg p-3 w-16 text-foreground"
                    placeholderTextColor="#687076"
                  />
                  <Text className="text-sm text-muted self-center">
                    {getTriggerUnit(newRule.triggerType as string)}
                  </Text>
                </View>
              </View>

              {/* Notification Channels */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Notify Via
                </Text>
                <View className="flex-row gap-2 flex-wrap">
                  {channels.map(channel => (
                    <Pressable
                      key={channel}
                      onPress={() => handleToggleChannel(channel)}
                      style={{
                        backgroundColor: (newRule.channels || []).includes(
                          channel as any
                        )
                          ? '#0a7ea4'
                          : '#f5f5f5',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: (newRule.channels || []).includes(channel as any)
                            ? '#fff'
                            : '#11181C',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {channel}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Create Button */}
              <Pressable
                onPress={handleAddRule}
                style={{
                  backgroundColor:
                    newRule.name && (newRule.channels || []).length > 0
                      ? '#22C55E'
                      : '#E5E7EB',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderRadius: 6,
                }}
              >
                <Text className="text-white text-sm font-semibold text-center">
                  Create Rule
                </Text>
              </Pressable>
            </View>
          )}

          {/* Empty State */}
          {rules.length === 0 && !showBuilder && (
            <View className="items-center justify-center py-12">
              <Text className="text-muted text-center">
                No alert rules configured yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
