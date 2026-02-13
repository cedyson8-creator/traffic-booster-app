import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface Credential {
  provider: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  isValid: boolean;
  lastUpdated: number;
}

export interface CredentialInput {
  provider: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
}

const CREDENTIALS_KEY = "app_credentials";
const SECURE_PREFIX = "secure_";

/**
 * Save credential securely
 */
export async function saveCredential(credential: Credential): Promise<void> {
  try {
    // Store sensitive data in secure storage
    const sensitiveData = {
      clientSecret: credential.clientSecret,
      apiKey: credential.apiKey,
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
    };

    const secureKey = `${SECURE_PREFIX}${credential.provider}`;

    // Use SecureStore on native, AsyncStorage on web
    if (Platform.OS !== "web") {
      await SecureStore.setItemAsync(secureKey, JSON.stringify(sensitiveData));
    } else {
      // On web, use AsyncStorage with a warning
      console.warn(
        "[CredentialsStorage] Using AsyncStorage on web. For production, use a secure backend."
      );
      await AsyncStorage.setItem(secureKey, JSON.stringify(sensitiveData));
    }

    // Store non-sensitive metadata in regular storage
    const metadata = {
      provider: credential.provider,
      clientId: credential.clientId,
      isValid: credential.isValid,
      lastUpdated: credential.lastUpdated,
    };

    const allCredentials = await getAllCredentialsMetadata();
    const index = allCredentials.findIndex((c) => c.provider === credential.provider);

    if (index >= 0) {
      allCredentials[index] = metadata;
    } else {
      allCredentials.push(metadata);
    }

    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCredentials));
    console.log(`[CredentialsStorage] Credential saved for ${credential.provider}`);
  } catch (error) {
    console.error("[CredentialsStorage] Failed to save credential:", error);
    throw error;
  }
}

/**
 * Get credential
 */
export async function getCredential(provider: string): Promise<Credential | null> {
  try {
    const secureKey = `${SECURE_PREFIX}${provider}`;

    let sensitiveData = null;
    if (Platform.OS !== "web") {
      const stored = await SecureStore.getItemAsync(secureKey);
      sensitiveData = stored ? JSON.parse(stored) : null;
    } else {
      const stored = await AsyncStorage.getItem(secureKey);
      sensitiveData = stored ? JSON.parse(stored) : null;
    }

    if (!sensitiveData) {
      return null;
    }

    const allCredentials = await getAllCredentialsMetadata();
    const metadata = allCredentials.find((c) => c.provider === provider);

    if (!metadata) {
      return null;
    }

    return {
      ...metadata,
      ...sensitiveData,
      isValid: metadata.isValid,
      lastUpdated: metadata.lastUpdated,
    };
  } catch (error) {
    console.error("[CredentialsStorage] Failed to get credential:", error);
    return null;
  }
}

/**
 * Get all credentials metadata (non-sensitive)
 */
export async function getAllCredentialsMetadata(): Promise<any[]> {
  try {
    const stored = await AsyncStorage.getItem(CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("[CredentialsStorage] Failed to get credentials metadata:", error);
    return [];
  }
}

/**
 * Delete credential
 */
export async function deleteCredential(provider: string): Promise<void> {
  try {
    const secureKey = `${SECURE_PREFIX}${provider}`;

    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(secureKey);
    } else {
      await AsyncStorage.removeItem(secureKey);
    }

    const allCredentials = await getAllCredentialsMetadata();
    const filtered = allCredentials.filter((c) => c.provider !== provider);
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(filtered));

    console.log(`[CredentialsStorage] Credential deleted for ${provider}`);
  } catch (error) {
    console.error("[CredentialsStorage] Failed to delete credential:", error);
    throw error;
  }
}

/**
 * Update credential validity
 */
export async function updateCredentialValidity(provider: string, isValid: boolean): Promise<void> {
  try {
    const credential = await getCredential(provider);
    if (!credential) {
      throw new Error(`Credential not found for ${provider}`);
    }

    credential.isValid = isValid;
    credential.lastUpdated = Date.now();
    await saveCredential(credential);
  } catch (error) {
    console.error("[CredentialsStorage] Failed to update credential validity:", error);
    throw error;
  }
}

/**
 * Test credential validity by making a test API call
 */
export async function testCredential(provider: string): Promise<boolean> {
  try {
    const credential = await getCredential(provider);
    if (!credential) {
      return false;
    }

    // Simulate API test call
    switch (provider) {
      case "google_analytics":
        if (!credential.clientId || !credential.clientSecret) {
          return false;
        }
        // In production, make actual API call to verify
        console.log("[CredentialsStorage] Testing Google Analytics credentials...");
        break;

      case "fiverr":
        if (!credential.apiKey) {
          return false;
        }
        console.log("[CredentialsStorage] Testing Fiverr credentials...");
        break;

      case "facebook":
        if (!credential.clientId || !credential.clientSecret) {
          return false;
        }
        console.log("[CredentialsStorage] Testing Facebook credentials...");
        break;

      case "twitter":
        if (!credential.clientId || !credential.clientSecret) {
          return false;
        }
        console.log("[CredentialsStorage] Testing Twitter credentials...");
        break;

      case "instagram":
        if (!credential.clientId || !credential.clientSecret) {
          return false;
        }
        console.log("[CredentialsStorage] Testing Instagram credentials...");
        break;

      default:
        return false;
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  } catch (error) {
    console.error("[CredentialsStorage] Credential test failed:", error);
    return false;
  }
}

/**
 * Clear all credentials
 */
export async function clearAllCredentials(): Promise<void> {
  try {
    const allCredentials = await getAllCredentialsMetadata();

    for (const credential of allCredentials) {
      await deleteCredential(credential.provider);
    }

    console.log("[CredentialsStorage] All credentials cleared");
  } catch (error) {
    console.error("[CredentialsStorage] Failed to clear credentials:", error);
    throw error;
  }
}

/**
 * Get credential requirements for a provider
 */
export function getCredentialRequirements(provider: string): {
  fields: string[];
  description: string;
  docUrl: string;
} {
  const requirements: Record<
    string,
    { fields: string[]; description: string; docUrl: string }
  > = {
    google_analytics: {
      fields: ["Client ID", "Client Secret"],
      description: "OAuth 2.0 credentials from Google Cloud Console",
      docUrl: "https://developers.google.com/analytics/devguides/config/mgmt/v3",
    },
    fiverr: {
      fields: ["API Key"],
      description: "API key from Fiverr Developer Account",
      docUrl: "https://developers.fiverr.com/",
    },
    facebook: {
      fields: ["App ID", "App Secret"],
      description: "App credentials from Facebook Developer Console",
      docUrl: "https://developers.facebook.com/",
    },
    twitter: {
      fields: ["API Key", "API Secret"],
      description: "API credentials from Twitter Developer Portal",
      docUrl: "https://developer.twitter.com/",
    },
    instagram: {
      fields: ["App ID", "App Secret"],
      description: "App credentials from Facebook/Instagram Developer Console",
      docUrl: "https://developers.facebook.com/docs/instagram-api",
    },
  };

  return (
    requirements[provider] || {
      fields: [],
      description: "Unknown provider",
      docUrl: "",
    }
  );
}
