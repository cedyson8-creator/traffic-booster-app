import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSync } from "@/lib/sync-context";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";

export default function SyncStatusScreen() {
  const router = useRouter();
  const colors = useColors();
  const { lastSyncFormatted, isSyncing, syncHistory, triggerSync } = useSync();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-2">Sync Status</Text>
            <Text className="text-muted">Automated data synchronization</Text>
          </View>

          {/* Current Status */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <View className="flex-row items-center gap-4 mb-4">
              {isSyncing ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <View className="w-16 h-16 rounded-full bg-success/10 items-center justify-center">
                  <MaterialIcons name="check-circle" size={32} color={colors.success} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  {isSyncing ? "Syncing..." : "Sync Active"}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Last sync: {lastSyncFormatted}
                </Text>
              </View>
            </View>

            <View className="pt-4 border-t border-border">
              <Text className="text-xs text-muted mb-2">SYNC INTERVAL</Text>
              <Text className="text-base font-semibold text-foreground">Every 6 hours</Text>
              <Text className="text-xs text-muted mt-2">
                Data automatically syncs from all connected integrations
              </Text>
            </View>
          </View>

          {/* Manual Sync Button */}
          <TouchableOpacity
            onPress={triggerSync}
            disabled={isSyncing}
            className={`rounded-full py-4 flex-row items-center justify-center gap-2 ${
              isSyncing ? "bg-border opacity-50" : "bg-primary"
            }`}
          >
            {isSyncing ? (
              <>
                <ActivityIndicator size="small" color={colors.background} />
                <Text className="text-background font-semibold">Syncing...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="refresh" size={20} color={colors.background} />
                <Text className="text-background font-semibold">Sync Now</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sync Features */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">What Gets Synced</Text>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row gap-3">
                <MaterialIcons name="analytics" size={24} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Google Analytics</Text>
                  <Text className="text-sm text-muted mt-1">Traffic, visitors, bounce rate</Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row gap-3">
                <MaterialIcons name="work" size={24} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Fiverr</Text>
                  <Text className="text-sm text-muted mt-1">Orders, earnings, gigs</Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row gap-3">
                <MaterialIcons name="share" size={24} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Social Media</Text>
                  <Text className="text-sm text-muted mt-1">
                    Followers, engagement, reach
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sync History */}
          {syncHistory.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Recent Syncs</Text>

              <View className="bg-surface rounded-2xl border border-border overflow-hidden">
                {syncHistory.map((log, index) => (
                  <View key={index}>
                    {index > 0 && <View className="h-px bg-border" />}
                    <View className="p-4 flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View
                            className={`w-2 h-2 rounded-full ${
                              log.status === "success" ? "bg-success" : "bg-error"
                            }`}
                          />
                          <Text className="text-sm font-semibold text-foreground">
                            {log.provider || "System"}
                          </Text>
                        </View>
                        <Text className="text-xs text-muted">
                          {new Date(log.timestamp).toLocaleString()}
                        </Text>
                        {log.duration && (
                          <Text className="text-xs text-muted mt-1">
                            Duration: {(log.duration / 1000).toFixed(2)}s
                          </Text>
                        )}
                      </View>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          log.status === "success"
                            ? "bg-success/10"
                            : log.status === "error"
                              ? "bg-error/10"
                              : "bg-warning/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            log.status === "success"
                              ? "text-success"
                              : log.status === "error"
                                ? "text-error"
                                : "text-warning"
                          }`}
                        >
                          {log.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Info */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <View className="flex-row gap-3">
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Background Sync</Text>
                <Text className="text-xs text-muted mt-1">
                  Syncing continues even when the app is closed. Make sure background app refresh is enabled in your device settings.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
