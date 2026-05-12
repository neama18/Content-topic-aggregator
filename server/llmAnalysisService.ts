import { invokeLLM } from "./_core/llm";
import { AggregatedTopic } from "./aggregationService";

export interface ContentBrief {
  title: string;
  contentAngle: "question" | "problem" | "trend" | "seasonal";
  trendScore: number;
  sources: string[];
  suggestedFormats: string[];
  whyTrending: string;
  exampleQuestions: string[];
  relatedKeywords: string[];
  description: string;
}

/**
 * Analyzes aggregated topic data using LLM to generate structured creative briefs
 * Uses JSON schema validation for reliable structured output
 */
export async function generateContentBriefs(
  keyword: string,
  niche: string | undefined,
  aggregatedTopics: AggregatedTopic[]
): Promise<ContentBrief[]> {
  if (aggregatedTopics.length === 0) {
    return [];
  }

  // Prepare the aggregated data for LLM analysis
  const topicsData = aggregatedTopics
    .slice(0, 10)
    .map((topic, idx) => ({
      rank: idx + 1,
      title: topic.title,
      sources: topic.sources.join(", "),
      mentions: topic.mentions,
      questions: topic.questions.slice(0, 3).join(" | "),
      keywords: topic.relatedKeywords.slice(0, 5).join(", "),
    }));

  const prompt = `You are an expert content strategist and creative director. Analyze the following trending topics and generate structured, actionable content briefs.

KEYWORD: ${keyword}
${niche ? `NICHE: ${niche}` : ""}

TRENDING TOPICS DATA:
${JSON.stringify(topicsData, null, 2)}

For each topic, generate a creative brief with:
1. A compelling title that hooks creators
2. Content angle classification (must be one of: question, problem, trend, seasonal)
3. Trend score (0-100, based on mentions and cross-source presence)
4. Why this is trending (2-3 sentences explaining the trend)
5. 3-4 example questions creators should answer
6. 3-4 related keywords for research
7. Suggested content formats (must include: video, blog, reel - can add more)
8. A brief description of the content opportunity

Be creative, specific, and actionable. Each brief should be immediately useful for content creators.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a content strategy expert. Generate creative, actionable content briefs based on trending data. Always return valid JSON matching the specified schema.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "content_briefs",
          strict: true,
          schema: {
            type: "object",
            properties: {
              briefs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Compelling title for the content idea" },
                    contentAngle: {
                      type: "string",
                      enum: ["question", "problem", "trend", "seasonal"],
                      description: "Type of content angle",
                    },
                    trendScore: {
                      type: "number",
                      minimum: 0,
                      maximum: 100,
                      description: "Trend score from 0-100",
                    },
                    sources: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of sources where this trend was found",
                    },
                    suggestedFormats: {
                      type: "array",
                      items: { type: "string" },
                      description: "Suggested content formats (video, blog, reel, etc.)",
                    },
                    whyTrending: {
                      type: "string",
                      description: "Explanation of why this is trending",
                    },
                    exampleQuestions: {
                      type: "array",
                      items: { type: "string" },
                      description: "Example questions creators should answer",
                    },
                    relatedKeywords: {
                      type: "array",
                      items: { type: "string" },
                      description: "Related keywords for research",
                    },
                    description: {
                      type: "string",
                      description: "Brief description of the content opportunity",
                    },
                  },
                  required: [
                    "title",
                    "contentAngle",
                    "trendScore",
                    "sources",
                    "suggestedFormats",
                    "whyTrending",
                    "exampleQuestions",
                    "relatedKeywords",
                    "description",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["briefs"],
            additionalProperties: false,
          },
        },
      },
    } as any);

    // Parse the response
    const content = response.choices[0]?.message.content;
    if (!content) {
      console.error("Empty response from LLM");
      return generateFallbackBriefs(aggregatedTopics);
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    const briefs = Array.isArray(parsed) ? parsed : parsed.briefs || [];

    // Validate and ensure all required fields
    return briefs.map((brief: any) => ({
      title: brief.title || "Untitled",
      contentAngle: ["question", "problem", "trend", "seasonal"].includes(brief.contentAngle)
        ? brief.contentAngle
        : "trend",
      trendScore: Math.min(100, Math.max(0, Number(brief.trendScore) || 50)),
      sources: Array.isArray(brief.sources) ? brief.sources : [],
      suggestedFormats: Array.isArray(brief.suggestedFormats)
        ? brief.suggestedFormats
        : ["video", "blog", "reel"],
      whyTrending: brief.whyTrending || "",
      exampleQuestions: Array.isArray(brief.exampleQuestions)
        ? brief.exampleQuestions
        : [],
      relatedKeywords: Array.isArray(brief.relatedKeywords)
        ? brief.relatedKeywords
        : [],
      description: brief.description || "",
    }));
  } catch (error) {
    console.error("Error generating content briefs:", error);
    return generateFallbackBriefs(aggregatedTopics);
  }
}

/**
 * Fallback function to generate basic briefs when LLM fails
 */
export function generateFallbackBriefs(aggregatedTopics: AggregatedTopic[]): ContentBrief[] {
  return aggregatedTopics.slice(0, 10).map((topic, idx) => {
    let contentAngle: "question" | "problem" | "trend" | "seasonal" = "trend";
    const questionText = topic.questions.join(" ").toLowerCase();

    if (questionText.includes("how to") || questionText.includes("how can")) {
      contentAngle = "question";
    } else if (
      questionText.includes("problem") ||
      questionText.includes("issue") ||
      questionText.includes("challenge")
    ) {
      contentAngle = "problem";
    } else if (
      questionText.includes("seasonal") ||
      questionText.includes("holiday") ||
      questionText.includes("year")
    ) {
      contentAngle = "seasonal";
    }

    const trendScore = Math.min(100, Math.round((topic.mentions / 1000) * 10));

    return {
      title: topic.title,
      contentAngle,
      trendScore,
      sources: topic.sources,
      suggestedFormats: ["video", "blog", "reel"],
      whyTrending: `This topic is trending across ${topic.sources.length} sources with ${topic.mentions.toLocaleString()} mentions.`,
      exampleQuestions: topic.questions.slice(0, 4),
      relatedKeywords: topic.relatedKeywords.slice(0, 5),
      description: `Content idea based on trending discussions about ${topic.title}. This topic is gaining traction and presents a strong opportunity for engagement.`,
    };
  });
}
