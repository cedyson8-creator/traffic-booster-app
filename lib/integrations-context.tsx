import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Integration {
  id: string;
  provider: "google_analytics" | "fiverr" | "facebook" | "twitter" | "instagram";
  isConnected: boolean;
  lastSyncedAt?: Date;
  displayName: string;
  icon: string;
}

interface IntegrationsContextType {
  integrations: Integration[];
  connectIntegration: (provider: string, credentials: Record<string, string>) => Promise<void>;
  disconnectIntegration: (provider: string) => Promise<void>;
  syncIntegration: (provider: string) => Promise<void>;
  isLoading: boolean;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: React.ReactNode }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize integrations
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const stored = await AsyncStorage.getItem("integrations");
      if (stored) {
        const parsed = JSON.parse(stored);
        setIntegrations(parsed);
      } else {
        // Initialize with default integrations (not connected)
        const defaults: Integration[] = [
          {
            id: "ga",
            provider: "google_analytics",
            isConnected: false,
            displayName: "Google Analytics",
            icon: "chart-line",
          },
          {
            id: "fiverr",
            provider: "fiverr",
            isConnected: false,
            displayName: "Fiverr",
            icon: "briefcase",
          },
          {
            id: "facebook",
            provider: "facebook",
            isConnected: false,
            displayName: "Facebook",
            icon: "facebook",
          },
          {
            id: "twitter",
            provider: "twitter",
            isConnected: false,
            displayName: "Twitter",
            icon: "twitter",
          },
          {
            id: "instagram",
            provider: "instagram",
            isConnected: false,
            displayName: "Instagram",
            icon: "instagram",
          },
        ];
        setIntegrations(defaults);
        await AsyncStorage.setItem("integrations", JSON.stringify(defaults));
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectIntegration = async (provider: string, credentials: Record<string, string>) => {
    try {
      // In a real app, this would call the backend API
      // For now, we'll just update local state
      const updated = integrations.map((int) =>
        int.provider === provider
          ? {
              ...int,
              isConnected: true,
              lastSyncedAt: new Date(),
            }
          : int
      );
      setIntegrations(updated);
      await AsyncStorage.setItem("integrations", JSON.stringify(updated));
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      throw error;
    }
  };

  const disconnectIntegration = async (provider: string) => {
    try {
      const updated = integrations.map((int) =>
        int.provider === provider
          ? {
              ...int,
              isConnected: false,
              lastSyncedAt: undefined,
            }
          : int
      );
      setIntegrations(updated);
      await AsyncStorage.setItem("integrations", JSON.stringify(updated));
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      throw error;
    }
  };

  const syncIntegration = async (provider: string) => {
    try {
      // In a real app, this would call the backend API to trigger sync
      const updated = integrations.map((int) =>
        int.provider === provider
          ? {
              ...int,
              lastSyncedAt: new Date(),
            }
          : int
      );
      setIntegrations(updated);
      await AsyncStorage.setItem("integrations", JSON.stringify(updated));
    } catch (error) {
      console.error(`Failed to sync ${provider}:`, error);
      throw error;
    }
  };

  return (
    <IntegrationsContext.Provider
      value={{
        integrations,
        connectIntegration,
        disconnectIntegration,
        syncIntegration,
        isLoading,
      }}
    >
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (!context) {
    throw new Error("useIntegrations must be used within IntegrationsProvider");
  }
  return context;
}
