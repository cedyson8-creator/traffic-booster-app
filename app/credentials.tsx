import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getCredential,
  saveCredential,
  deleteCredential,
  testCredential,
  getCredentialRequirements,
  getAllCredentialsMetadata,
  type Credential,
} from "@/lib/credentials-storage";

const PROVIDERS = [
  { id: "google_analytics", name: "Google Analytics", icon: "analytics" },
  { id: "fiverr", name: "Fiverr", icon: "work" },
  { id: "facebook", name: "Facebook", icon: "share" },
  { id: "twitter", name: "Twitter", icon: "share" },
  { id: "instagram", name: "Instagram", icon: "image" },
];

export default function CredentialsScreen() {
  const router = useRouter();
  const colors = useColors();

  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Credential>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<any[]>([]);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const metadata = await getAllCredentialsMetadata();
      setSavedCredentials(metadata);

      const loaded: Record<string, Credential> = {};
      for (const provider of PROVIDERS) {
        const cred = await getCredential(provider.id);
        if (cred) {
          loaded[provider.id] = cred;
        }
      }
      setCredentials(loaded);
    } catch (error) {
      console.error("Failed to load credentials:", error);
    }
  };

  const handleSelectProvider = (providerId: string) => {
    setActiveProvider(providerId);
    const requirements = getCredentialRequirements(providerId);
    const newFormData: Record<string, string> = {};

    requirements.fields.forEach((field) => {
      const key = field.toLowerCase().replace(/\s+/g, "");
      newFormData[key] = "";
    });

    setFormData(newFormData);
  };

  const handleSaveCredential = async () => {
    if (!activeProvider) return;

    try {
      setLoading(true);
      const requirements = getCredentialRequirements(activeProvider);

      const credential: Credential = {
        provider: activeProvider,
        isValid: false,
        lastUpdated: Date.now(),
      };

      // Map form data to credential fields
      if (formData.clientid) credential.clientId = formData.clientid;
      if (formData.clientsecret) credential.clientSecret = formData.clientsecret;
      if (formData.apikey) credential.apiKey = formData.apikey;
      if (formData.apisecret) credential.clientSecret = formData.apisecret;

      // Validate required fields
      const hasAllRequired = requirements.fields.every((field) => {
        const key = field.toLowerCase().replace(/\s+/g, "");
        return formData[key]?.trim().length > 0;
      });

      if (!hasAllRequired) {
        Alert.alert("Missing Fields", "Please fill in all required fields");
        setLoading(false);
        return;
      }

      await saveCredential(credential);
      Alert.alert("Success", `${PROVIDERS.find((p) => p.id === activeProvider)?.name} credentials saved`);

      setActiveProvider(null);
      setFormData({});
      await loadCredentials();
    } catch (error) {
      Alert.alert("Error", "Failed to save credentials");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCredential = async (providerId: string) => {
    try {
      setTesting(true);
      const isValid = await testCredential(providerId);

      if (isValid) {
        Alert.alert("Success", "Credentials are valid!");
      } else {
        Alert.alert("Invalid", "Credentials failed validation");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to test credentials");
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteCredential = async (providerId: string) => {
    Alert.alert(
      "Delete Credentials",
      `Are you sure you want to delete ${PROVIDERS.find((p) => p.id === providerId)?.name} credentials?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteCredential(providerId);
              Alert.alert("Deleted", "Credentials removed");
              await loadCredentials();
            } catch (error) {
              Alert.alert("Error", "Failed to delete credentials");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-2">API Credentials</Text>
            <Text className="text-muted">Securely manage your API keys</Text>
          </View>

          {/* Provider List */}
          <View className="gap-3">
            {PROVIDERS.map((provider) => {
              const saved = savedCredentials.find((c) => c.provider === provider.id);
              const isActive = activeProvider === provider.id;

              return (
                <View key={provider.id}>
                  <TouchableOpacity
                    onPress={() => handleSelectProvider(provider.id)}
                    className={`rounded-2xl p-4 border flex-row items-center justify-between ${
                      isActive
                        ? "bg-primary/10 border-primary"
                        : saved
                          ? "bg-success/5 border-success"
                          : "bg-surface border-border"
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          isActive
                            ? "bg-primary"
                            : saved
                              ? "bg-success"
                              : "bg-border"
                        }`}
                      >
                        <MaterialIcons
                          name={provider.icon as any}
                          size={24}
                          color={
                            isActive || saved ? colors.background : colors.muted
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {provider.name}
                        </Text>
                        <Text className="text-xs text-muted mt-1">
                          {saved ? "✓ Configured" : "Not configured"}
                        </Text>
                      </View>
                    </View>
                    {saved && (
                      <View className="bg-success/20 rounded-full px-3 py-1">
                        <Text className="text-xs font-semibold text-success">
                          Active
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Form for Active Provider */}
                  {isActive && (
                    <View className="bg-surface rounded-2xl p-4 border border-primary/20 mt-3">
                      <Text className="text-sm font-semibold text-foreground mb-3">
                        {provider.name} Credentials
                      </Text>

                      {/* Requirements Info */}
                      <View className="bg-primary/5 rounded-lg p-3 mb-4">
                        <Text className="text-xs text-muted mb-2">
                          {getCredentialRequirements(provider.id).description}
                        </Text>
                        <TouchableOpacity>
                          <Text className="text-xs text-primary font-semibold">
                            View Documentation →
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Form Fields */}
                      {getCredentialRequirements(provider.id).fields.map(
                        (field) => {
                          const key = field.toLowerCase().replace(/\s+/g, "");
                          return (
                            <View key={key} className="mb-3">
                              <Text className="text-xs font-semibold text-foreground mb-2">
                                {field}
                              </Text>
                              <TextInput
                                placeholder={`Enter your ${field.toLowerCase()}`}
                                placeholderTextColor={colors.muted}
                                secureTextEntry={
                                  field.includes("Secret") ||
                                  field.includes("Key")
                                }
                                value={formData[key] || ""}
                                onChangeText={(text) =>
                                  setFormData({ ...formData, [key]: text })
                                }
                                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                              />
                            </View>
                          );
                        }
                      )}

                      {/* Action Buttons */}
                      <View className="flex-row gap-3 mt-4">
                        <TouchableOpacity
                          onPress={handleSaveCredential}
                          disabled={loading}
                          className={`flex-1 rounded-lg py-3 items-center justify-center ${
                            loading ? "bg-border" : "bg-primary"
                          }`}
                        >
                          {loading ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.background}
                            />
                          ) : (
                            <Text className="text-background font-semibold">
                              Save
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setActiveProvider(null)}
                          className="flex-1 rounded-lg py-3 items-center justify-center bg-border"
                        >
                          <Text className="text-foreground font-semibold">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Saved Credential Actions */}
                  {saved && !isActive && (
                    <View className="flex-row gap-2 mt-2">
                      <TouchableOpacity
                        onPress={() => handleTestCredential(provider.id)}
                        disabled={testing}
                        className="flex-1 bg-success/10 rounded-lg py-2 items-center"
                      >
                        {testing ? (
                          <ActivityIndicator size="small" color={colors.success} />
                        ) : (
                          <Text className="text-success text-xs font-semibold">
                            Test
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteCredential(provider.id)}
                        className="flex-1 bg-error/10 rounded-lg py-2 items-center"
                      >
                        <Text className="text-error text-xs font-semibold">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Security Info */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20 mt-4">
            <View className="flex-row gap-3">
              <MaterialIcons name="lock" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  Secure Storage
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Your credentials are encrypted and stored securely on your device.
                  Never shared with third parties.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
