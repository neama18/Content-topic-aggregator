import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  searches, topics, collections, collectionItems,
  trendMonitoring, notifications
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
      values.role = 'admin';
      updateSet.role = 'admin';
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

// ============ Search queries ============

export async function createSearch(userId: number, keyword: string, niche?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(searches).values({
    userId,
    keyword,
    niche,
    status: 'pending',
  });

  return result;
}

export async function getSearchById(searchId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(searches).where(eq(searches.id, searchId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserSearchHistory(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(searches)
    .where(eq(searches.userId, userId))
    .orderBy(desc(searches.createdAt))
    .limit(limit);
}

export async function updateSearchStatus(searchId: number, status: 'pending' | 'completed' | 'failed', resultCount?: number) {
  const db = await getDb();
  if (!db) return null;

  const updateData: Record<string, unknown> = { status };
  if (resultCount !== undefined) {
    updateData.resultCount = resultCount;
  }

  return db.update(searches).set(updateData).where(eq(searches.id, searchId));
}

// ============ Topic queries ============

export async function createTopic(data: {
  searchId: number;
  userId: number;
  title: string;
  description?: string;
  contentAngle: 'question' | 'problem' | 'trend' | 'seasonal';
  trendScore: number;
  sources: string[];
  suggestedFormats: string[];
  whyTrending?: string;
  exampleQuestions?: string[];
  relatedKeywords?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(topics).values({
    searchId: data.searchId,
    userId: data.userId,
    title: data.title,
    description: data.description,
    contentAngle: data.contentAngle,
    trendScore: data.trendScore.toString() as any,
    sources: JSON.stringify(data.sources) as any,
    suggestedFormats: JSON.stringify(data.suggestedFormats) as any,
    whyTrending: data.whyTrending,
    exampleQuestions: data.exampleQuestions ? JSON.stringify(data.exampleQuestions) : null,
    relatedKeywords: data.relatedKeywords ? JSON.stringify(data.relatedKeywords) : null,
  });
}

export async function getTopicsBySearchId(searchId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(topics)
    .where(eq(topics.searchId, searchId))
    .orderBy(desc(topics.trendScore));

  return results.map(t => ({
    ...t,
    sources: JSON.parse(t.sources as unknown as string),
    suggestedFormats: JSON.parse(t.suggestedFormats as unknown as string),
    exampleQuestions: t.exampleQuestions ? JSON.parse(t.exampleQuestions as unknown as string) : [],
    relatedKeywords: t.relatedKeywords ? JSON.parse(t.relatedKeywords as unknown as string) : [],
  }));
}

export async function getTopicById(topicId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1);
  if (!result.length) return null;

  const t = result[0];
  return {
    ...t,
    sources: JSON.parse(t.sources as unknown as string),
    suggestedFormats: JSON.parse(t.suggestedFormats as unknown as string),
    exampleQuestions: t.exampleQuestions ? JSON.parse(t.exampleQuestions as unknown as string) : [],
    relatedKeywords: t.relatedKeywords ? JSON.parse(t.relatedKeywords as unknown as string) : [],
  };
}

// ============ Collection queries ============

export async function createCollection(userId: number, name: string, description?: string, color?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(collections).values({
    userId,
    name,
    description,
    color,
  });
}

export async function getUserCollections(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(desc(collections.createdAt));
}

export async function getCollectionWithItems(collectionId: number) {
  const db = await getDb();
  if (!db) return null;

  const collection = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection.length) return null;

  const items = await db
    .select()
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collectionId));

  return {
    collection: collection[0],
    items,
  };
}

export async function addTopicToCollection(collectionId: number, topicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(collectionItems).values({
    collectionId,
    topicId,
  });
}

export async function removeTopicFromCollection(collectionId: number, topicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(collectionItems)
    .where(and(
      eq(collectionItems.collectionId, collectionId),
      eq(collectionItems.topicId, topicId)
    ));
}

export async function updateCollection(collectionId: number, data: { name?: string; description?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.color !== undefined) updateData.color = data.color;

  if (Object.keys(updateData).length === 0) {
    return null; // Nothing to update
  }

  return db.update(collections).set(updateData).where(eq(collections.id, collectionId));
}

export async function deleteCollection(collectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all items in the collection first
  await db.delete(collectionItems).where(eq(collectionItems.collectionId, collectionId));

  // Then delete the collection
  return db.delete(collections).where(eq(collections.id, collectionId));
}

// ============ Trend Monitoring queries ============

export async function createTrendMonitoring(userId: number, keyword: string, niche?: string, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' = 'weekly') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const nextRunAt = new Date();
  nextRunAt.setDate(nextRunAt.getDate() + 1); // Run tomorrow

  return db.insert(trendMonitoring).values({
    userId,
    keyword,
    niche,
    frequency,
    nextRunAt,
  });
}

export async function getUserTrendMonitoring(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(trendMonitoring)
    .where(and(
      eq(trendMonitoring.userId, userId),
      eq(trendMonitoring.isActive, true)
    ))
    .orderBy(desc(trendMonitoring.createdAt));
}

export async function updateTrendMonitoringRun(monitoringId: number) {
  const db = await getDb();
  if (!db) return null;

  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 7); // Default to weekly

  return db.update(trendMonitoring).set({
    lastRunAt: new Date(),
    nextRunAt: nextRun,
  }).where(eq(trendMonitoring.id, monitoringId));
}

export async function updateTrendMonitoring(monitoringId: number, data: { frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'; isActive?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (Object.keys(updateData).length === 0) {
    return null; // Nothing to update
  }

  return db.update(trendMonitoring).set(updateData).where(eq(trendMonitoring.id, monitoringId));
}

export async function deleteTrendMonitoring(monitoringId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(trendMonitoring).where(eq(trendMonitoring.id, monitoringId));
}

export async function getTrendMonitoringById(monitoringId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(trendMonitoring).where(eq(trendMonitoring.id, monitoringId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============ Notification queries ============

export async function createNotification(userId: number, title: string, message?: string, type: 'new_trend' | 'monitoring_update' | 'system' = 'system', monitoringId?: number, relatedTopicIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(notifications).values({
    userId,
    title,
    message,
    type,
    monitoringId,
    relatedTopicIds: relatedTopicIds ? JSON.stringify(relatedTopicIds) : null,
  });
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return results.map(n => ({
    ...n,
    relatedTopicIds: n.relatedTopicIds ? JSON.parse(n.relatedTopicIds as unknown as string) : [],
  }));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return null;

  return db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}
