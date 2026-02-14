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

// Scheduled Reports table
export const scheduledReports = mysqlTable("scheduled_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  websiteId: int("websiteId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  metrics: json("metrics").notNull(), // Array of metric names
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly"]).notNull(),
  dayOfWeek: mysqlEnum("dayOfWeek", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  dayOfMonth: int("dayOfMonth"),
  isActive: boolean("isActive").default(true).notNull(),
  nextSendAt: timestamp("nextSendAt").notNull(),
  lastSentAt: timestamp("lastSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Email Delivery Logs table
export const emailDeliveryLogs = mysqlTable("email_delivery_logs", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "bounced"]).notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;
// Performance alerts table
export const performanceAlerts = mysqlTable("performance_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scheduleId: int("scheduleId"),
  alertType: mysqlEnum("alertType", ["low_success_rate", "high_bounce_rate", "delivery_failure"]).notNull(),
  threshold: int("threshold").notNull(),
  currentValue: int("currentValue").notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  message: text("message").notNull(),
  isResolved: boolean("isResolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

// Webhook events table for tracking delivery events
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  logId: int("logId").notNull(),
  eventType: mysqlEnum("eventType", ["delivered", "opened", "clicked", "bounced", "complained"]).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Export types
export type EmailDeliveryLog = typeof emailDeliveryLogs.$inferSelect;
export type InsertEmailDeliveryLog = typeof emailDeliveryLogs.$inferInsert;
export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

// Subscription Plans table
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Free, Pro, Enterprise
  stripePriceId: varchar("stripePriceId", { length: 255 }).unique(),
  monthlyPrice: int("monthlyPrice").notNull(), // in cents
  yearlyPrice: int("yearlyPrice"),
  description: text("description"),
  features: json("features").notNull(), // Array of feature names
  maxWebsites: int("maxWebsites").notNull(),
  maxSchedules: int("maxSchedules").notNull(),
  maxEmailsPerMonth: int("maxEmailsPerMonth").notNull(),
  maxApiCallsPerDay: int("maxApiCallsPerDay").notNull(),
  priority: int("priority").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// User Subscriptions table
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  planId: int("planId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  canceledAt: timestamp("canceledAt"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Usage Tracking table
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  emailsSent: int("emailsSent").default(0).notNull(),
  apiCalls: int("apiCalls").default(0).notNull(),
  schedulesCreated: int("schedulesCreated").default(0).notNull(),
  reportsGenerated: int("reportsGenerated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Invoices table
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }).unique(),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["draft", "open", "paid", "void", "uncollectible"]).notNull(),
  paidAt: timestamp("paidAt"),
  dueDate: timestamp("dueDate"),
  invoiceUrl: text("invoiceUrl"),
  pdfUrl: text("pdfUrl"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Payment History table
export const paymentHistory = mysqlTable("payment_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["succeeded", "processing", "requires_payment_method", "requires_confirmation", "requires_action", "requires_capture", "canceled"]).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 255 }),
  description: text("description"),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Export types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;
