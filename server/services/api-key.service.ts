import crypto from 'crypto';

/**
 * API Key Management Service
 * Handles API key generation, validation, and usage tracking
 */

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: number;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimit: number; // requests per hour
  createdAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  usageCount: number;
}

export interface ApiKeyUsage {
  keyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId: number;
}

/**
 * In-memory API key store (in production, use database)
 */
const apiKeyStore: Map<string, ApiKey> = new Map();
const apiKeyUsageStore: Map<string, ApiKeyUsage[]> = new Map();
const keyHashMap: Map<string, string> = new Map(); // Maps hashed key to key ID

export class ApiKeyService {
  /**
   * Generate a new API key
   */
  static generateKey(userId: number, name: string, tier: 'free' | 'pro' | 'enterprise' = 'free'): ApiKey {
    const keyId = crypto.randomBytes(8).toString('hex');
    const rawKey = `sk_${tier}_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = this.hashKey(rawKey);

    const apiKey: ApiKey = {
      id: keyId,
      key: rawKey,
      name,
      userId,
      tier,
      rateLimit: this.getRateLimitForTier(tier),
      createdAt: new Date(),
      expiresAt: null,
      isActive: true,
      lastUsedAt: null,
      usageCount: 0,
    };

    apiKeyStore.set(keyId, apiKey);
    keyHashMap.set(keyHash, keyId);
    apiKeyUsageStore.set(keyId, []);

    return apiKey;
  }

  /**
   * Validate an API key
   */
  static validateKey(rawKey: string): { valid: boolean; keyId?: string; apiKey?: ApiKey } {
    const keyHash = this.hashKey(rawKey);
    const keyId = keyHashMap.get(keyHash);

    if (!keyId) {
      return { valid: false };
    }

    const apiKey = apiKeyStore.get(keyId);

    if (!apiKey) {
      return { valid: false };
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return { valid: false };
    }

    // Check if key has expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { valid: false };
    }

    return { valid: true, keyId, apiKey };
  }

  /**
   * Get API key by ID
   */
  static getKey(keyId: string): ApiKey | null {
    return apiKeyStore.get(keyId) || null;
  }

  /**
   * List API keys for a user
   */
  static listKeys(userId: number): ApiKey[] {
    return Array.from(apiKeyStore.values()).filter((key) => key.userId === userId);
  }

  /**
   * Revoke an API key
   */
  static revokeKey(keyId: string): boolean {
    const apiKey = apiKeyStore.get(keyId);

    if (!apiKey) {
      return false;
    }

    apiKey.isActive = false;
    return true;
  }

  /**
   * Delete an API key
   */
  static deleteKey(keyId: string): boolean {
    const apiKey = apiKeyStore.get(keyId);

    if (!apiKey) {
      return false;
    }

    // Remove from all maps
    const keyHash = this.hashKey(apiKey.key);
    apiKeyStore.delete(keyId);
    keyHashMap.delete(keyHash);
    apiKeyUsageStore.delete(keyId);

    return true;
  }

  /**
   * Track API key usage
   */
  static trackUsage(keyId: string, usage: Omit<ApiKeyUsage, 'keyId' | 'timestamp'>): void {
    const apiKey = apiKeyStore.get(keyId);

    if (!apiKey) {
      return;
    }

    // Update last used time and usage count
    apiKey.lastUsedAt = new Date();
    apiKey.usageCount++;

    // Store usage record
    const usageRecord: ApiKeyUsage = {
      ...usage,
      keyId,
      timestamp: new Date(),
    };

    const usageList = apiKeyUsageStore.get(keyId) || [];
    usageList.push(usageRecord);

    // Keep only last 1000 records per key
    if (usageList.length > 1000) {
      usageList.shift();
    }

    apiKeyUsageStore.set(keyId, usageList);
  }

  /**
   * Get usage statistics for an API key
   */
  static getUsageStats(keyId: string, hoursBack: number = 24): {
    totalRequests: number;
    requestsByEndpoint: Record<string, number>;
    requestsByMethod: Record<string, number>;
    errorCount: number;
    averageResponseTime: number;
  } {
    const usageList = apiKeyUsageStore.get(keyId) || [];
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const recentUsage = usageList.filter((u) => u.timestamp > cutoffTime);

    const stats = {
      totalRequests: recentUsage.length,
      requestsByEndpoint: {} as Record<string, number>,
      requestsByMethod: {} as Record<string, number>,
      errorCount: 0,
      averageResponseTime: 0,
    };

    let totalResponseTime = 0;

    recentUsage.forEach((u) => {
      // Count by endpoint
      stats.requestsByEndpoint[u.endpoint] = (stats.requestsByEndpoint[u.endpoint] || 0) + 1;

      // Count by method
      stats.requestsByMethod[u.method] = (stats.requestsByMethod[u.method] || 0) + 1;

      // Count errors
      if (u.statusCode >= 400) {
        stats.errorCount++;
      }

      // Sum response times
      totalResponseTime += u.responseTime;
    });

    stats.averageResponseTime = recentUsage.length > 0 ? totalResponseTime / recentUsage.length : 0;

    return stats;
  }

  /**
   * Get usage history for an API key
   */
  static getUsageHistory(keyId: string, limit: number = 100): ApiKeyUsage[] {
    const usageList = apiKeyUsageStore.get(keyId) || [];
    return usageList.slice(-limit).reverse();
  }

  /**
   * Rotate an API key (generate new, keep old active for grace period)
   */
  static rotateKey(keyId: string): { oldKey: ApiKey; newKey: ApiKey } | null {
    const oldKey = apiKeyStore.get(keyId);

    if (!oldKey) {
      return null;
    }

    // Generate new key with same properties
    const newKey = this.generateKey(oldKey.userId, `${oldKey.name} (rotated)`, oldKey.tier);

    // Mark old key as inactive after 7 days
    const graceEndTime = new Date();
    graceEndTime.setDate(graceEndTime.getDate() + 7);
    oldKey.expiresAt = graceEndTime;

    return { oldKey, newKey };
  }

  /**
   * Get rate limit for tier
   */
  private static getRateLimitForTier(tier: 'free' | 'pro' | 'enterprise'): number {
    const limits: Record<string, number> = {
      free: 100,
      pro: 1000,
      enterprise: 10000,
    };
    return limits[tier] || 100;
  }

  /**
   * Hash API key for secure storage
   */
  private static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Get service statistics
   */
  static getServiceStats(): {
    totalKeys: number;
    activeKeys: number;
    totalUsageRecords: number;
  } {
    let totalUsageRecords = 0;
    apiKeyUsageStore.forEach((usage) => {
      totalUsageRecords += usage.length;
    });

    const activeKeys = Array.from(apiKeyStore.values()).filter((k) => k.isActive).length;

    return {
      totalKeys: apiKeyStore.size,
      activeKeys,
      totalUsageRecords,
    };
  }

  /**
   * Clear all API keys (testing only)
   */
  static clearAll(): void {
    apiKeyStore.clear();
    keyHashMap.clear();
    apiKeyUsageStore.clear();
  }
}
