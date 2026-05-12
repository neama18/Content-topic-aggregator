import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createSearch,
  getSearchById,
  getUserSearchHistory,
  updateSearchStatus,
  createTopic,
  getTopicsBySearchId,
  getTopicById,
  createCollection,
  getUserCollections,
  getCollectionWithItems,
  addTopicToCollection,
  removeTopicFromCollection,
  updateCollection,
  deleteCollection,
  createTrendMonitoring,
  getUserTrendMonitoring,
  updateTrendMonitoring,
  deleteTrendMonitoring,
  getTrendMonitoringById,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} from "./db";
import { aggregateTopicData } from "./aggregationService";
import { generateContentBriefs } from "./llmAnalysisService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Search & Research ============
  research: router({
    /**
     * Start a new research session
     */
    startSearch: protectedProcedure
      .input(
        z.object({
          keyword: z.string().min(1).max(255),
          niche: z.string().max(255).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const search = await createSearch(ctx.user.id, input.keyword, input.niche);
        const searchId = (search as any).insertId || search[0];

        try {
          // Aggregate data from all sources
          const aggregatedTopics = await aggregateTopicData(input.keyword, input.niche);

          // Generate creative briefs using LLM
          const briefs = await generateContentBriefs(
            input.keyword,
            input.niche,
            aggregatedTopics
          );

          // Save topics to database
          for (const brief of briefs) {
            await createTopic({
              searchId,
              userId: ctx.user.id,
              title: brief.title,
              description: brief.description,
              contentAngle: brief.contentAngle,
              trendScore: brief.trendScore,
              sources: brief.sources,
              suggestedFormats: brief.suggestedFormats,
              whyTrending: brief.whyTrending,
              exampleQuestions: brief.exampleQuestions,
              relatedKeywords: brief.relatedKeywords,
            });
          }

          // Update search status
          await updateSearchStatus(searchId, "completed", briefs.length);

          return {
            searchId,
            topicCount: briefs.length,
            status: "completed",
          };
        } catch (error) {
          console.error("Research error:", error);
          await updateSearchStatus(searchId, "failed");
          throw error;
        }
      }),

    /**
     * Get search results by ID
     */
    getResults: protectedProcedure
      .input(z.object({ searchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const search = await getSearchById(input.searchId);
        if (!search || search.userId !== ctx.user.id) {
          throw new Error("Search not found");
        }

        const topics = await getTopicsBySearchId(input.searchId);
        return {
          search,
          topics,
        };
      }),

    /**
     * Get search history
     */
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return getUserSearchHistory(ctx.user.id, input.limit);
      }),

    /**
     * Get single topic detail
     */
    getTopicDetail: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        const topic = await getTopicById(input.topicId);
        if (!topic || topic.userId !== ctx.user.id) {
          throw new Error("Topic not found");
        }
        return topic;
      }),
  }),

  // ============ Collections ============
  collections: router({
    /**
     * Create a new collection
     */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCollection(ctx.user.id, input.name, input.description, input.color);
      }),

    /**
     * Get all user collections
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCollections(ctx.user.id);
    }),

    /**
     * Get collection with items
     */
    getWithItems: protectedProcedure
      .input(z.object({ collectionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await getCollectionWithItems(input.collectionId);
        if (!result || result.collection.userId !== ctx.user.id) {
          throw new Error("Collection not found");
        }
        return result;
      }),

    /**
     * Add topic to collection
     */
    addTopic: protectedProcedure
      .input(
        z.object({
          collectionId: z.number(),
          topicId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify collection belongs to user
        const collection = await getCollectionWithItems(input.collectionId);
        if (!collection || collection.collection.userId !== ctx.user.id) {
          throw new Error("Collection not found");
        }

        return addTopicToCollection(input.collectionId, input.topicId);
      }),

    /**
     * Remove topic from collection
     */
    removeTopic: protectedProcedure
      .input(
        z.object({
          collectionId: z.number(),
          topicId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const collection = await getCollectionWithItems(input.collectionId);
        if (!collection || collection.collection.userId !== ctx.user.id) {
          throw new Error("Collection not found");
        }

        return removeTopicFromCollection(input.collectionId, input.topicId);
      }),

    /**
     * Update collection
     */
    update: protectedProcedure
      .input(
        z.object({
          collectionId: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const collection = await getCollectionWithItems(input.collectionId);
        if (!collection || collection.collection.userId !== ctx.user.id) {
          throw new Error("Collection not found");
        }

        return updateCollection(input.collectionId, {
          name: input.name,
          description: input.description,
          color: input.color,
        });
      }),

    /**
     * Delete collection
     */
    delete: protectedProcedure
      .input(z.object({ collectionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const collection = await getCollectionWithItems(input.collectionId);
        if (!collection || collection.collection.userId !== ctx.user.id) {
          throw new Error("Collection not found");
        }

        return deleteCollection(input.collectionId);
      }),
  }),

  // ============ Trend Monitoring ============
  monitoring: router({
    /**
     * Create trend monitoring for a keyword
     */
    create: protectedProcedure
      .input(
        z.object({
          keyword: z.string().min(1).max(255),
          niche: z.string().optional(),
          frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).default("weekly"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createTrendMonitoring(
          ctx.user.id,
          input.keyword,
          input.niche,
          input.frequency
        );
      }),

    /**
     * Get user's trend monitoring list
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserTrendMonitoring(ctx.user.id);
    }),

    /**
     * Get single trend monitoring
     */
    getById: protectedProcedure
      .input(z.object({ monitoringId: z.number() }))
      .query(async ({ ctx, input }) => {
        const monitoring = await getTrendMonitoringById(input.monitoringId);
        if (!monitoring || monitoring.userId !== ctx.user.id) {
          throw new Error("Monitoring not found");
        }
        return monitoring;
      }),

    /**
     * Update trend monitoring
     */
    update: protectedProcedure
      .input(
        z.object({
          monitoringId: z.number(),
          frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const monitoring = await getTrendMonitoringById(input.monitoringId);
        if (!monitoring || monitoring.userId !== ctx.user.id) {
          throw new Error("Monitoring not found");
        }

        return updateTrendMonitoring(input.monitoringId, {
          frequency: input.frequency,
          isActive: input.isActive,
        });
      }),

    /**
     * Delete trend monitoring
     */
    delete: protectedProcedure
      .input(z.object({ monitoringId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const monitoring = await getTrendMonitoringById(input.monitoringId);
        if (!monitoring || monitoring.userId !== ctx.user.id) {
          throw new Error("Monitoring not found");
        }

        return deleteTrendMonitoring(input.monitoringId);
      }),
  }),

  // ============ Notifications ============
  notifications: router({
    /**
     * Get user notifications
     */
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return getUserNotifications(ctx.user.id, input.limit);
      }),

    /**
     * Mark notification as read
     */
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return markNotificationAsRead(input.notificationId);
      }),
  }),

  // ============ Export ============
  export: router({
    /**
     * Export topics as CSV
     */
    toCSV: protectedProcedure
      .input(z.object({ searchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const search = await getSearchById(input.searchId);
        if (!search || search.userId !== ctx.user.id) {
          throw new Error("Search not found");
        }

        const topics = await getTopicsBySearchId(input.searchId);

        // Generate CSV
        const headers = [
          "Title",
          "Content Angle",
          "Trend Score",
          "Sources",
          "Suggested Formats",
          "Why Trending",
          "Example Questions",
          "Related Keywords",
        ];

        const rows = topics.map(t => [
          `"${t.title.replace(/"/g, '""')}"`,
          t.contentAngle,
          t.trendScore,
          `"${t.sources.join(", ")}"`,
          `"${t.suggestedFormats.join(", ")}"`,
          `"${t.whyTrending?.replace(/"/g, '""') || ''}"`,
          `"${t.exampleQuestions.join("; ")}"`,
          `"${t.relatedKeywords.join(", ")}"`,
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        return {
          csv,
          filename: `topics-${search.keyword}-${new Date().toISOString().split('T')[0]}.csv`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
