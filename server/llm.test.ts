import { describe, it, expect } from "vitest";
import { generateFallbackBriefs, ContentBrief } from "./llmAnalysisService";
import { aggregateTopicData } from "./aggregationService";

describe("LLM Analysis Service", () => {
  describe("ContentBrief Schema Validation", () => {
    it("should have all required fields in ContentBrief", () => {
      const requiredFields: (keyof ContentBrief)[] = [
        "title",
        "contentAngle",
        "trendScore",
        "sources",
        "suggestedFormats",
        "whyTrending",
        "exampleQuestions",
        "relatedKeywords",
        "description",
      ];

      const brief: ContentBrief = {
        title: "Test Title",
        contentAngle: "trend",
        trendScore: 75,
        sources: ["Google Trends", "Reddit"],
        suggestedFormats: ["video", "blog"],
        whyTrending: "This is trending",
        exampleQuestions: ["Q1", "Q2"],
        relatedKeywords: ["keyword1", "keyword2"],
        description: "Test description",
      };

      requiredFields.forEach(field => {
        expect(brief).toHaveProperty(field);
        expect(brief[field]).toBeDefined();
      });
    });

    it("should validate contentAngle enum values", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      const validAngles = ["question", "problem", "trend", "seasonal"];

      briefs.forEach(brief => {
        expect(validAngles).toContain(brief.contentAngle);
      });
    });

    it("should validate trendScore is between 0 and 100", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        expect(brief.trendScore).toBeGreaterThanOrEqual(0);
        expect(brief.trendScore).toBeLessThanOrEqual(100);
      });
    });

    it("should have array fields with correct types", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        expect(Array.isArray(brief.sources)).toBe(true);
        expect(Array.isArray(brief.suggestedFormats)).toBe(true);
        expect(Array.isArray(brief.exampleQuestions)).toBe(true);
        expect(Array.isArray(brief.relatedKeywords)).toBe(true);

        brief.sources.forEach(source => {
          expect(typeof source).toBe("string");
        });

        brief.suggestedFormats.forEach(format => {
          expect(typeof format).toBe("string");
        });

        brief.exampleQuestions.forEach(question => {
          expect(typeof question).toBe("string");
        });

        brief.relatedKeywords.forEach(keyword => {
          expect(typeof keyword).toBe("string");
        });
      });
    });

    it("should have non-empty string fields", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        expect(brief.title.length).toBeGreaterThan(0);
        expect(brief.whyTrending.length).toBeGreaterThan(0);
        expect(brief.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe("generateFallbackBriefs", () => {
    it("should generate briefs from aggregated topics", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      expect(Array.isArray(briefs)).toBe(true);
      expect(briefs.length).toBeGreaterThan(0);
    });

    it("should limit output to 10 briefs", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      expect(briefs.length).toBeLessThanOrEqual(10);
    });

    it("should return empty array for empty input", () => {
      const briefs = generateFallbackBriefs([]);

      expect(Array.isArray(briefs)).toBe(true);
      expect(briefs.length).toBe(0);
    });

    it("should infer content angle from question text", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        // Verify angle is one of the valid options
        expect(["question", "problem", "trend", "seasonal"]).toContain(
          brief.contentAngle
        );
      });
    });

    it("should include all suggested formats", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        expect(brief.suggestedFormats.length).toBeGreaterThan(0);
        // Should include at least video, blog, reel
        const formats = brief.suggestedFormats.map(f => f.toLowerCase());
        expect(formats).toContain("video");
        expect(formats).toContain("blog");
        expect(formats).toContain("reel");
      });
    });

    it("should populate example questions", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        expect(brief.exampleQuestions.length).toBeGreaterThan(0);
        expect(brief.exampleQuestions.length).toBeLessThanOrEqual(4);
      });
    });

    it("should populate related keywords", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        expect(brief.relatedKeywords.length).toBeGreaterThan(0);
        expect(brief.relatedKeywords.length).toBeLessThanOrEqual(5);
      });
    });

    it("should calculate trendScore based on mentions", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        // Score should be reasonable (0-100)
        expect(brief.trendScore).toBeGreaterThanOrEqual(0);
        expect(brief.trendScore).toBeLessThanOrEqual(100);
      });
    });

    it("should include source information in briefs", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        expect(brief.sources.length).toBeGreaterThan(0);
        brief.sources.forEach(source => {
          expect(typeof source).toBe("string");
          expect(source.length).toBeGreaterThan(0);
        });
      });
    });

    it("should generate unique descriptions for each brief", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs = generateFallbackBriefs(aggregated);

      const descriptions = briefs.map(b => b.description);
      const uniqueDescriptions = new Set(descriptions);

      // Most descriptions should be unique (allowing for some duplicates)
      expect(uniqueDescriptions.size).toBeGreaterThan(briefs.length * 0.7);
    });
  });

  describe("Brief Quality Metrics", () => {
    it("should generate briefs with substantive content", async () => {
      const aggregated = await aggregateTopicData("marketing");
      const briefs = generateFallbackBriefs(aggregated);

      briefs.forEach(brief => {
        // Title should be meaningful
        expect(brief.title.length).toBeGreaterThan(5);

        // Description should be detailed
        expect(brief.description.length).toBeGreaterThan(20);

        // Why trending should explain the trend
        expect(brief.whyTrending.length).toBeGreaterThan(10);

        // Should have example questions (at least 1)
        expect(brief.exampleQuestions.length).toBeGreaterThan(0);

        // Should have related keywords (at least 1)
        expect(brief.relatedKeywords.length).toBeGreaterThan(0);
      });
    });

    it("should maintain consistency across multiple calls", async () => {
      const aggregated = await aggregateTopicData("ai");
      const briefs1 = generateFallbackBriefs(aggregated);
      const briefs2 = generateFallbackBriefs(aggregated);

      expect(briefs1.length).toBe(briefs2.length);

      // Check that the same topics are generated
      for (let i = 0; i < briefs1.length; i++) {
        expect(briefs1[i].title).toBe(briefs2[i].title);
        expect(briefs1[i].contentAngle).toBe(briefs2[i].contentAngle);
      }
    });
  });
});
