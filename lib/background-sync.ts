import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SYNC_TASK_NAME = "traffic-booster-sync";
const SYNC_INTERVAL = 6 * 60 * 60; // 6 hours in seconds
const LAST_SYNC_KEY = "last_sync_timestamp";
const SYNC_HISTORY_KEY = "sync_history";

export interface SyncLog {
  timestamp: number;
  status: "success" | "error" | "pending";
  provider?: string;
  message?: string;
  duration?: number;
}

/**
 * Register background sync task
 */
export async function registerBackgroundSync() {
  try {
    // Define the background task
    TaskManager.defineTask(SYNC_TASK_NAME, async () => {
      try {
        const startTime = Date.now();
        console.log("[BackgroundSync] Starting sync task...");

        // Get connected integrations
        const integrationsJson = await AsyncStorage.getItem("integrations");
        const integrations = integrationsJson ? JSON.parse(integrationsJson) : [];
        const connectedIntegrations = integrations.filter((i: any) => i.isConnected);

        if (connectedIntegrations.length === 0) {
          console.log("[BackgroundSync] No connected integrations, skipping sync");
          await logSync({
            timestamp: Date.now(),
            status: "success",
            message: "No connected integrations",
            duration: Date.now() - startTime,
          });
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Sync each connected integration
        let syncedCount = 0;
        let errorCount = 0;

        for (const integration of connectedIntegrations) {
          try {
            await syncIntegrationData(integration);
            syncedCount++;
            await logSync({
              timestamp: Date.now(),
              status: "success",
              provider: integration.provider,
              message: `Successfully synced ${integration.provider}`,
              duration: Date.now() - startTime,
            });
          } catch (error) {
            errorCount++;
            console.error(`[BackgroundSync] Error syncing ${integration.provider}:`, error);
            await logSync({
              timestamp: Date.now(),
              status: "error",
              provider: integration.provider,
              message: `Failed to sync ${integration.provider}`,
              duration: Date.now() - startTime,
            });
          }
        }

        // Update last sync timestamp
        await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

        console.log(
          `[BackgroundSync] Sync complete: ${syncedCount} succeeded, ${errorCount} failed`
        );

        return errorCount === 0
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.Failed;
      } catch (error) {
        console.error("[BackgroundSync] Task error:", error);
        await logSync({
          timestamp: Date.now(),
          status: "error",
          message: "Background sync task failed",
        });
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
      minimumInterval: SYNC_INTERVAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log("[BackgroundSync] Background sync registered successfully");
    return true;
  } catch (error) {
    console.error("[BackgroundSync] Failed to register background sync:", error);
    return false;
  }
}

/**
 * Unregister background sync task
 */
export async function unregisterBackgroundSync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(SYNC_TASK_NAME);
    console.log("[BackgroundSync] Background sync unregistered");
    return true;
  } catch (error) {
    console.error("[BackgroundSync] Failed to unregister background sync:", error);
    return false;
  }
}

/**
 * Manually trigger sync
 */
export async function triggerManualSync() {
  try {
    console.log("[BackgroundSync] Triggering manual sync...");
    const startTime = Date.now();

    const integrationsJson = await AsyncStorage.getItem("integrations");
    const integrations = integrationsJson ? JSON.parse(integrationsJson) : [];
    const connectedIntegrations = integrations.filter((i: any) => i.isConnected);

    let syncedCount = 0;
    let errorCount = 0;

    for (const integration of connectedIntegrations) {
      try {
        await syncIntegrationData(integration);
        syncedCount++;
      } catch (error) {
        errorCount++;
        console.error(`[BackgroundSync] Error syncing ${integration.provider}:`, error);
      }
    }

    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    const duration = Date.now() - startTime;
    await logSync({
      timestamp: Date.now(),
      status: errorCount === 0 ? "success" : "error",
      message: `Manual sync: ${syncedCount} succeeded, ${errorCount} failed`,
      duration,
    });

    console.log(`[BackgroundSync] Manual sync complete (${duration}ms)`);
    return { syncedCount, errorCount, duration };
  } catch (error) {
    console.error("[BackgroundSync] Manual sync failed:", error);
    throw error;
  }
}

/**
 * Sync data for a single integration
 */
async function syncIntegrationData(integration: any) {
  console.log(`[BackgroundSync] Syncing ${integration.provider}...`);

  // Simulate API calls to each platform
  // In production, these would make real API calls using the stored credentials
  switch (integration.provider) {
    case "google_analytics":
      // Fetch Google Analytics data
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("[BackgroundSync] Google Analytics data synced");
      break;

    case "fiverr":
      // Fetch Fiverr orders and earnings
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("[BackgroundSync] Fiverr data synced");
      break;

    case "facebook":
      // Fetch Facebook page metrics
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("[BackgroundSync] Facebook data synced");
      break;

    case "twitter":
      // Fetch Twitter metrics
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("[BackgroundSync] Twitter data synced");
      break;

    case "instagram":
      // Fetch Instagram metrics
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("[BackgroundSync] Instagram data synced");
      break;

    default:
      throw new Error(`Unknown provider: ${integration.provider}`);
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp) : null;
  } catch (error) {
    console.error("[BackgroundSync] Failed to get last sync time:", error);
    return null;
  }
}

/**
 * Get sync history
 */
export async function getSyncHistory(limit: number = 10): Promise<SyncLog[]> {
  try {
    const historyJson = await AsyncStorage.getItem(SYNC_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    return history.slice(-limit).reverse();
  } catch (error) {
    console.error("[BackgroundSync] Failed to get sync history:", error);
    return [];
  }
}

/**
 * Clear sync history
 */
export async function clearSyncHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_HISTORY_KEY);
    console.log("[BackgroundSync] Sync history cleared");
  } catch (error) {
    console.error("[BackgroundSync] Failed to clear sync history:", error);
  }
}

/**
 * Log sync event
 */
async function logSync(log: SyncLog): Promise<void> {
  try {
    const historyJson = await AsyncStorage.getItem(SYNC_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];

    // Keep only last 50 logs
    history.push(log);
    if (history.length > 50) {
      history.shift();
    }

    await AsyncStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("[BackgroundSync] Failed to log sync:", error);
  }
}

/**
 * Check if background sync is available
 */
export async function isBackgroundSyncAvailable(): Promise<boolean> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    return status === BackgroundFetch.BackgroundFetchStatus.Available;
  } catch (error) {
    console.error("[BackgroundSync] Failed to check status:", error);
    return false;
  }
}

/**
 * Format last sync time for display
 */
export function formatLastSyncTime(timestamp: number | null): string {
  if (!timestamp) return "Never";

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
