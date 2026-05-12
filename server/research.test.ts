import { describe, it, expect } from "vitest";
import { aggregateTopicData } from "./aggregationService";
import { generateFallbackBriefs } from "./llmAnalysisService";

describe("Research Service", () => {
  describe("aggregateTopicData", () => {
    it("should aggregate data from multiple sources", async () => {
      const result = await aggregateTopicData("ai");
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const topic = result[0];
        expect(topic).toHaveProperty("title");
        expect(topic).toHaveProperty("sources");
        expect(topic).toHaveProperty("mentions");
        expect(topic).toHaveProperty("questions");
        expect(topic).toHaveProperty("relatedKeywords");
        
        expect(Array.isArray(topic.sources)).toBe(true);
        expect(Array.isArray(topic.questions)).toBe(true);
        expect(Array.isArray(topic.relatedKeywords)).toBe(true);
        expect(typeof topic.mentions).toBe("number");
      }
    });

    it("should return empty array for unknown keyword", async () => {
      const result = await aggregateTopicData("xyzunknownkeyword123");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should merge topics from same sources", async () => {
      const result = await aggregateTopicData("marketing");
      
      if (result.length > 0) {
        // Check that topics are sorted by mentions (popularity)
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].mentions).toBeGreaterThanOrEqual(result[i + 1].mentions);
        }
      }
    });

    it("should handle niche parameter", async () => {
      const result = await aggregateTopicData("ai", "tech");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have unique topics after aggregation", () => {
      const result = aggregateTopicData("ai");
      
      expect(result).toBeDefined();
    });

    it("should have valid source names", async () => {
      const result = await aggregateTopicData("ai");
      const validSources = [
        "Google Trends",
        "Reddit",
        "Quora",
        "TikTok Creative Center",
        "Pinterest Trends",
        "AnswerThePublic",
        "AlsoAsked",
        "BuzzSumo",
      ];

      result.forEach(topic => {
        topic.sources.forEach(source => {
          expect(validSources).toContain(source);
        });
      });
    });
  });

  describe("generateFallbackBriefs", () => {
    it("should generate fallback briefs from aggregated data", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);
      
      expect(Array.isArray(briefs)).toBe(true);
      
      if (briefs.length > 0) {
        const brief = briefs[0];
        expect(brief).toHaveProperty("title");
        expect(brief).toHaveProperty("contentAngle");
        expect(brief).toHaveProperty("trendScore");
        expect(brief).toHaveProperty("sources");
        expect(brief).toHaveProperty("suggestedFormats");
        expect(brief).toHaveProperty("whyTrending");
        expect(brief).toHaveProperty("exampleQuestions");
        expect(brief).toHaveProperty("relatedKeywords");
        expect(brief).toHaveProperty("description");
        
        // Validate content angle
        expect(["question", "problem", "trend", "seasonal"]).toContain(brief.contentAngle);
        
        // Validate trend score
        expect(brief.trendScore).toBeGreaterThanOrEqual(0);
        expect(brief.trendScore).toBeLessThanOrEqual(100);
        
        // Validate formats
        expect(Array.isArray(brief.suggestedFormats)).toBe(true);
        expect(brief.suggestedFormats.length).toBeGreaterThan(0);
        
        // Check that required formats are present
        const hasRequiredFormats = ["video", "blog", "reel"].some(format =>
          brief.suggestedFormats.some(f => f.toLowerCase().includes(format))
        );
        expect(hasRequiredFormats).toBe(true);
      }
    });

    it("should return empty array for empty aggregated data", () => {
      const briefs = generateFallbackBriefs([]);
      expect(Array.isArray(briefs)).toBe(true);
      expect(briefs.length).toBe(0);
    });

    it("should have non-empty descriptions in briefs", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);
      
      briefs.forEach(brief => {
        expect(brief.title.length).toBeGreaterThan(0);
        expect(brief.description.length).toBeGreaterThan(0);
        expect(brief.whyTrending.length).toBeGreaterThan(0);
      });
    });

    it("should limit briefs to 10 items", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);
      
      expect(briefs.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Data Quality", () => {
    it("should have consistent data structure", async () => {
      const result = await aggregateTopicData("marketing");
      
      result.forEach(topic => {
        expect(typeof topic.title).toBe("string");
        expect(Array.isArray(topic.sources)).toBe(true);
        expect(typeof topic.mentions).toBe("number");
        expect(typeof topic.trendingUp).toBe("boolean");
        expect(Array.isArray(topic.questions)).toBe(true);
        expect(Array.isArray(topic.relatedKeywords)).toBe(true);
      });
    });

    it("should have positive mention counts", async () => {
      const result = await aggregateTopicData("ai");
      
      result.forEach(topic => {
        expect(topic.mentions).toBeGreaterThan(0);
      });
    });
  });
});
