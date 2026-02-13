import { ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useIntegrations } from "@/lib/integrations-context";
import { useColors } from "@/hooks/use-colors";
import { MaterialIcons } from "@expo/vector-icons";

export default function IntegrationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { integrations, connectIntegration, disconnectIntegration, syncIntegration } =
    useIntegrations();

  const handleConnect = async (provider: string) => {
    Alert.alert(
      `Connect ${provider}`,
      `Enter your ${provider} credentials to connect your account.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Connect",
          onPress: async () => {
            try {
              await connectIntegration(provider, {
                apiKey: "demo-key",
                userId: "demo-user",
              });
              Alert.alert("Success", `${provider} connected successfully!`);
            } catch (error) {
              Alert.alert("Error", `Failed to connect ${provider}`);
            }
          },
        },
      ]
    );
  };

  const handleDisconnect = (provider: string) => {
    Alert.alert(
      "Disconnect",
      `Are you sure you want to disconnect ${provider}?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Disconnect",
          onPress: async () => {
            try {
              await disconnectIntegration(provider);
              Alert.alert("Success", `${provider} disconnected`);
            } catch (error) {
              Alert.alert("Error", `Failed to disconnect ${provider}`);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleSync = async (provider: string) => {
    try {
      await syncIntegration(provider);
      Alert.alert("Success", `${provider} data synced successfully!`);
    } catch (error) {
      Alert.alert("Error", `Failed to sync ${provider}`);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary text-base font-semibold">← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/credentials" as any)}
                className="bg-primary rounded-lg px-3 py-2"
              >
                <Text className="text-background text-xs font-semibold">Manage Keys</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">Integrations</Text>
            <Text className="text-muted">Connect your accounts to sync real traffic data</Text>
          </View>

          {/* Integration Cards */}
          {integrations.map((integration) => (
            <View
              key={integration.id}
              className="bg-surface rounded-2xl p-4 border border-border"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      integration.isConnected ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <MaterialIcons
                      name={"analytics" as any}
                      size={24}
                      color={integration.isConnected ? colors.background : colors.muted}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {integration.displayName}
                    </Text>
                    <Text className="text-sm text-muted">
                      {integration.isConnected ? "Connected" : "Not connected"}
                    </Text>
                  </View>
                </View>
                <View
                  className={`w-3 h-3 rounded-full ${
                    integration.isConnected ? "bg-success" : "bg-error"
                  }`}
                />
              </View>

              {/* Last Sync Info */}
              {integration.lastSyncedAt && (
                <Text className="text-xs text-muted mb-3">
                  Last synced: {new Date(integration.lastSyncedAt).toLocaleString()}
                </Text>
              )}

              {/* Action Buttons */}
              <View className="flex-row gap-2">
                {!integration.isConnected ? (
                  <TouchableOpacity
                    onPress={() => handleConnect(integration.displayName)}
                    className="flex-1 bg-primary rounded-lg py-2 items-center"
                  >
                    <Text className="text-background font-semibold">Connect</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => handleSync(integration.displayName)}
                      className="flex-1 bg-primary rounded-lg py-2 items-center"
                    >
                      <Text className="text-background font-semibold">Sync Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDisconnect(integration.displayName)}
                      className="flex-1 bg-error rounded-lg py-2 items-center"
                    >
                      <Text className="text-background font-semibold">Disconnect</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}

          {/* Info Box */}
          <View className="bg-surface rounded-2xl p-4 border border-border mt-4">
            <Text className="text-foreground font-semibold mb-2">How it works</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Connect your accounts to automatically sync real traffic data from Google Analytics,
              Fiverr orders, and social media engagement metrics. Your data updates every 6 hours.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
