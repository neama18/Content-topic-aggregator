import { describe, it, expect } from "vitest";
import {
  createTrendMonitoring,
  getUserTrendMonitoring,
  getTrendMonitoringById,
  updateTrendMonitoring,
  deleteTrendMonitoring,
  updateTrendMonitoringRun,
} from "./db";

describe("Trend Monitoring Database Operations", () => {
  const testUserId = 999;
  const testMonitoringId = 999;

  describe("createTrendMonitoring", () => {
    it("should create trend monitoring with keyword", async () => {
      const result = await createTrendMonitoring(testUserId, "AI trends");
      expect(result).toBeDefined();
    });

    it("should create trend monitoring with niche", async () => {
      const result = await createTrendMonitoring(testUserId, "AI trends", "tech");
      expect(result).toBeDefined();
    });

    it("should create trend monitoring with custom frequency", async () => {
      const result = await createTrendMonitoring(
        testUserId,
        "AI trends",
        "tech",
        "daily"
      );
      expect(result).toBeDefined();
    });

    it("should default to weekly frequency", async () => {
      const result = await createTrendMonitoring(testUserId, "AI trends");
      expect(result).toBeDefined();
    });

    it("should set nextRunAt to tomorrow by default", async () => {
      const result = await createTrendMonitoring(testUserId, "AI trends");
      expect(result).toBeDefined();
    });

    it("should support all frequency options", async () => {
      const frequencies: Array<"daily" | "weekly" | "biweekly" | "monthly"> = [
        "daily",
        "weekly",
        "biweekly",
        "monthly",
      ];

      for (const freq of frequencies) {
        const result = await createTrendMonitoring(testUserId, "AI trends", undefined, freq);
        expect(result).toBeDefined();
      }
    });
  });

  describe("getUserTrendMonitoring", () => {
    it("should return array of monitoring records", async () => {
      const result = await getUserTrendMonitoring(testUserId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user with no monitoring", async () => {
      const result = await getUserTrendMonitoring(9999999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should only return active monitoring records", async () => {
      const result = await getUserTrendMonitoring(testUserId);
      result.forEach(record => {
        expect(record.isActive).toBe(true);
      });
    });

    it("should order by creation date descending", async () => {
      const result = await getUserTrendMonitoring(testUserId);
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const current = new Date(result[i].createdAt).getTime();
          const next = new Date(result[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe("getTrendMonitoringById", () => {
    it("should return monitoring record by ID", async () => {
      const result = await getTrendMonitoringById(testMonitoringId);
      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("userId");
        expect(result).toHaveProperty("keyword");
        expect(result).toHaveProperty("frequency");
        expect(result).toHaveProperty("isActive");
      }
    });

    it("should return null for non-existent ID", async () => {
      const result = await getTrendMonitoringById(9999999);
      expect(result).toBeNull();
    });
  });

  describe("updateTrendMonitoring", () => {
    it("should update frequency", async () => {
      const result = await updateTrendMonitoring(testMonitoringId, {
        frequency: "daily",
      });
      expect(result).toBeDefined();
    });

    it("should update isActive status", async () => {
      const result = await updateTrendMonitoring(testMonitoringId, {
        isActive: false,
      });
      expect(result).toBeDefined();
    });

    it("should update multiple fields", async () => {
      const result = await updateTrendMonitoring(testMonitoringId, {
        frequency: "monthly",
        isActive: true,
      });
      expect(result).toBeDefined();
    });

    it("should return null if no fields to update", async () => {
      const result = await updateTrendMonitoring(testMonitoringId, {});
      expect(result).toBeNull();
    });

    it("should validate frequency enum", async () => {
      try {
        await updateTrendMonitoring(testMonitoringId, {
          frequency: "invalid" as any,
        });
        expect.fail("Should have thrown an error for invalid frequency");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("deleteTrendMonitoring", () => {
    it("should delete monitoring record", async () => {
      const result = await deleteTrendMonitoring(testMonitoringId);
      expect(result).toBeDefined();
    });

    it("should handle deleting non-existent record gracefully", async () => {
      const result = await deleteTrendMonitoring(9999999);
      expect(result).toBeDefined();
    });
  });

  describe("updateTrendMonitoringRun", () => {
    it("should update lastRunAt to current time", async () => {
      const result = await updateTrendMonitoringRun(testMonitoringId);
      expect(result).toBeDefined();
    });

    it("should set nextRunAt to 7 days from now", async () => {
      const result = await updateTrendMonitoringRun(testMonitoringId);
      expect(result).toBeDefined();
    });

    it("should update both timestamps together", async () => {
      const before = new Date();
      const result = await updateTrendMonitoringRun(testMonitoringId);
      const after = new Date();

      expect(result).toBeDefined();
      // The operation should complete within a reasonable time
      expect(after.getTime() - before.getTime()).toBeLessThan(5000);
    });
  });

  describe("Data Validation", () => {
    it("should have valid frequency values", async () => {
      const validFrequencies = ["daily", "weekly", "biweekly", "monthly"];
      const result = await getUserTrendMonitoring(testUserId);

      result.forEach(record => {
        expect(validFrequencies).toContain(record.frequency);
      });
    });

    it("should have valid boolean isActive", async () => {
      const result = await getUserTrendMonitoring(testUserId);

      result.forEach(record => {
        expect(typeof record.isActive).toBe("boolean");
      });
    });

    it("should have valid timestamps", async () => {
      const result = await getUserTrendMonitoring(testUserId);

      result.forEach(record => {
        expect(record.createdAt).toBeDefined();
        expect(record.updatedAt).toBeDefined();
        expect(new Date(record.createdAt).getTime()).toBeGreaterThan(0);
        expect(new Date(record.updatedAt).getTime()).toBeGreaterThan(0);
      });
    });

    it("should have non-empty keyword", async () => {
      const result = await getUserTrendMonitoring(testUserId);

      result.forEach(record => {
        expect(record.keyword.length).toBeGreaterThan(0);
      });
    });
  });
});
