import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

/**
 * Search sessions - tracks each research query
 */
export const searches = mysqlTable("searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  niche: varchar("niche", { length: 255 }),
  resultCount: int("resultCount").default(0),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Search = typeof searches.$inferSelect;
export type InsertSearch = typeof searches.$inferInsert;

/**
 * Topics - individual content ideas discovered from aggregated sources
 */
export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  searchId: int("searchId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  contentAngle: mysqlEnum("contentAngle", ["question", "problem", "trend", "seasonal"]).notNull(),
  trendScore: decimal("trendScore", { precision: 5, scale: 2 }).notNull(), // 0-100
  sources: json("sources").notNull(), // Array of source names
  suggestedFormats: json("suggestedFormats").notNull(), // Array: video, blog, reel
  whyTrending: text("whyTrending"),
  exampleQuestions: json("exampleQuestions"), // Array of questions
  relatedKeywords: json("relatedKeywords"), // Array of related terms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

/**
 * Collections - user-created folders for organizing topics
 */
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * Collection items - topics saved to collections
 */
export const collectionItems = mysqlTable("collectionItems", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull(),
  topicId: int("topicId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type CollectionItem = typeof collectionItems.$inferSelect;
export type InsertCollectionItem = typeof collectionItems.$inferInsert;

/**
 * Trend monitoring - keywords to monitor for recurring research
 */
export const trendMonitoring = mysqlTable("trendMonitoring", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  niche: varchar("niche", { length: 255 }),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly"]).default("weekly").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrendMonitoring = typeof trendMonitoring.$inferSelect;
export type InsertTrendMonitoring = typeof trendMonitoring.$inferInsert;

/**
 * Notifications - alerts for new trending topics
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  monitoringId: int("monitoringId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: mysqlEnum("type", ["new_trend", "monitoring_update", "system"]).default("system").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedTopicIds: json("relatedTopicIds"), // Array of topic IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
