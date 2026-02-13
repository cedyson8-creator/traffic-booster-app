import React, { createContext, useContext, useEffect, useState } from "react";
import {
  registerBackgroundSync,
  triggerManualSync,
  getLastSyncTime,
  getSyncHistory,
  formatLastSyncTime,
  type SyncLog,
} from "./background-sync";

interface SyncContextType {
  lastSyncTime: number | null;
  lastSyncFormatted: string;
  isSyncing: boolean;
  syncHistory: SyncLog[];
  triggerSync: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncLog[]>([]);

  // Initialize background sync on mount
  useEffect(() => {
    const initializeSync = async () => {
      try {
        await registerBackgroundSync();
        await refreshSyncStatus();
      } catch (error) {
        console.error("[SyncContext] Failed to initialize sync:", error);
      }
    };

    initializeSync();
  }, []);

  const refreshSyncStatus = async () => {
    try {
      const lastSync = await getLastSyncTime();
      setLastSyncTime(lastSync);

      const history = await getSyncHistory(10);
      setSyncHistory(history);
    } catch (error) {
      console.error("[SyncContext] Failed to refresh sync status:", error);
    }
  };

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      await triggerManualSync();
      await refreshSyncStatus();
    } catch (error) {
      console.error("[SyncContext] Manual sync failed:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const value: SyncContextType = {
    lastSyncTime,
    lastSyncFormatted: formatLastSyncTime(lastSyncTime),
    isSyncing,
    syncHistory,
    triggerSync,
    refreshSyncStatus,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
