import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  websites,
  campaigns,
  integrationCredentials,
  trafficMetrics,
  integrationSyncLog,
  InsertWebsite,
  InsertCampaign,
  InsertIntegrationCredential,
  InsertTrafficMetric,
  InsertIntegrationSyncLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Website operations
 */
export async function getUserWebsites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(websites).where(eq(websites.userId, userId));
}

export async function createWebsite(data: InsertWebsite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(websites).values(data);
  return true;
}

export async function updateWebsite(id: number, data: Partial<InsertWebsite>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(websites).set(data).where(eq(websites.id, id));
}

export async function deleteWebsite(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(websites).where(eq(websites.id, id));
}

/**
 * Campaign operations
 */
export async function getUserCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId));
}

export async function getWebsiteCampaigns(websiteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.websiteId, websiteId));
}

export async function createCampaign(data: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(campaigns).values(data);
  return true;
}

export async function updateCampaign(id: number, data: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

/**
 * Integration Credentials operations
 */
export async function getUserIntegrations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationCredentials).where(eq(integrationCredentials.userId, userId));
}

export async function getIntegrationByProvider(userId: number, provider: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(integrationCredentials)
    .where(and(eq(integrationCredentials.userId, userId), eq(integrationCredentials.provider, provider as any)));
  return result[0] || null;
}

export async function createIntegration(data: InsertIntegrationCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(integrationCredentials).values(data);
  return true;
}

export async function updateIntegration(id: number, data: Partial<InsertIntegrationCredential>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(integrationCredentials).set(data).where(eq(integrationCredentials.id, id));
}

export async function deleteIntegration(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(integrationCredentials).where(eq(integrationCredentials.id, id));
}

/**
 * Traffic Metrics operations
 */
export async function getWebsiteMetrics(websiteId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db
    .select()
    .from(trafficMetrics)
    .where(and(eq(trafficMetrics.websiteId, websiteId)))
    .orderBy(trafficMetrics.date);
}

export async function createTrafficMetric(data: InsertTrafficMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trafficMetrics).values(data);
  return true;
}

export async function createMultipleMetrics(data: InsertTrafficMetric[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trafficMetrics).values(data);
  return true;
}

/**
 * Integration Sync Log operations
 */
export async function logIntegrationSync(data: InsertIntegrationSyncLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(integrationSyncLog).values(data);
  return true;
}

export async function getIntegrationSyncHistory(userId: number, provider: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(integrationSyncLog)
    .where(and(eq(integrationSyncLog.userId, userId), eq(integrationSyncLog.provider, provider as any)))
    .orderBy(integrationSyncLog.syncedAt)
    .limit(limit);
}
