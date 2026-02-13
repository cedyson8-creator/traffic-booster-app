import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Websites table
export const websites = mysqlTable("websites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  category: mysqlEnum("category", ["blog", "ecommerce", "portfolio", "business", "other"]).notNull(),
  verified: boolean("verified").default(false).notNull(),
  totalVisits: int("totalVisits").default(0).notNull(),
  monthlyVisits: int("monthlyVisits").default(0).notNull(),
  weeklyGrowth: int("weeklyGrowth").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Campaigns table
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  websiteId: int("websiteId").notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["social", "content", "seo"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  targetVisits: int("targetVisits").notNull(),
  currentVisits: int("currentVisits").default(0).notNull(),
  duration: int("duration").notNull(),
  budget: int("budget").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Integration Credentials table
export const integrationCredentials = mysqlTable("integration_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["google_analytics", "fiverr", "facebook", "twitter", "instagram"]).notNull(),
  credentialData: json("credentialData").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Traffic Metrics table
export const trafficMetrics = mysqlTable("traffic_metrics", {
  id: int("id").autoincrement().primaryKey(),
  websiteId: int("websiteId").notNull(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  visits: int("visits").default(0).notNull(),
  uniqueVisitors: int("uniqueVisitors").default(0).notNull(),
  bounceRate: int("bounceRate").default(0).notNull(),
  avgSessionDuration: int("avgSessionDuration").default(0).notNull(),
  source: mysqlEnum("source", ["direct", "social", "referral", "search", "other"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Integration Sync Log table
export const integrationSyncLog = mysqlTable("integration_sync_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["google_analytics", "fiverr", "facebook", "twitter", "instagram"]).notNull(),
  websiteId: int("websiteId"),
  status: mysqlEnum("status", ["success", "failed", "pending"]).notNull(),
  errorMessage: text("errorMessage"),
  syncedRecords: int("syncedRecords").default(0).notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

// Export types
export type Website = typeof websites.$inferSelect;
export type InsertWebsite = typeof websites.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type IntegrationCredential = typeof integrationCredentials.$inferSelect;
export type InsertIntegrationCredential = typeof integrationCredentials.$inferInsert;
export type TrafficMetric = typeof trafficMetrics.$inferSelect;
export type InsertTrafficMetric = typeof trafficMetrics.$inferInsert;
export type IntegrationSyncLog = typeof integrationSyncLog.$inferSelect;
export type InsertIntegrationSyncLog = typeof integrationSyncLog.$inferInsert;
