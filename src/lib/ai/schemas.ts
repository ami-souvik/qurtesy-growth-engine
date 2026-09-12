import { z } from "zod";

export const ContentIdeaSchema = z.object({
  title: z.string(),
  audience: z.string(),
  problem: z.string(),
  angle: z.string(),
  evidence: z.array(z.string()),
  suggestedPlatforms: z.array(z.string()),
  suggestedCTA: z.string(),
});

export const ContentIdeasResponseSchema = z.object({
  ideas: z.array(ContentIdeaSchema),
});

export const CoreContentSchema = z.object({
  audience: z.string(),
  problem: z.string(),
  insight: z.string(),
  evidence: z.string(),
  opinion: z.string(),
  cta: z.string(),
});

export const RedditOpportunityTypeEnum = z.enum([
  "PAIN",
  "GIVEAWAY",
  "RESUME_REVIEW",
  "ANTI_FAKE_AI",
  "IGNORE",
]);

export const PromotionalRiskEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const RedditOpportunityClassificationSchema = z.object({
  opportunityType: RedditOpportunityTypeEnum.describe(
    "Primary opportunity type. Use IGNORE if post is spam, off-topic, promotional, deleted, or irrelevant."
  ),
  painScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Severity of user pain or frustration (0 = none, 10 = acute crisis/blocker)."),
  intentScore: z
    .number()
    .min(0)
    .max(10)
    .describe("User's readiness to take action or seek real help (0 = venting/rhetorical, 10 = active request for solutions)."),
  relevanceScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Alignment with Qurtesy's real capabilities (resume building, JD analysis, tailoring, cover letter, ATS) (0-10)."),
  helpfulnessScore: z
    .number()
    .min(0)
    .max(10)
    .describe("How much genuine, actionable value the founder can provide without pitching (0-10)."),
  promotionalRisk: PromotionalRiskEnum.describe(
    "Risk of being perceived as self-promotional or spammy on this post/subreddit."
  ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Classifier confidence in this assessment between 0.0 and 1.0."),
  recommendedAngle: z
    .string()
    .describe("Specific, non-promotional strategic advice on how the founder should approach or respond."),
  reasoning: z
    .string()
    .describe("Concise 1-2 sentence rationale for why this opportunity type and scores were chosen."),
  riskFlags: z
    .array(z.string())
    .default([])
    .describe("Warning flags like HIGH_PROMOTION_RISK, COMPETITOR_MENTION, UNREALISTIC_EXPECTATION."),
});

export type RedditOpportunityClassification = z.infer<typeof RedditOpportunityClassificationSchema>;

export const RedditGrowthInsightCategoryEnum = z.enum([
  "RECURRING_PAIN",
  "EMERGING_THEME",
  "OPPORTUNITY_CLUSTER",
  "FEATURE_REQUEST",
]);

export const RedditEvidenceStatusEnum = z.enum([
  "Repeated",
  "Emerging",
  "Observed",
  "Hypothesis",
]);

export const RedditGrowthInsightItemSchema = z
  .object({
    theme: z.string().describe("Clear, concise theme title (e.g. 'ATS Multi-Column Table Scrambling')."),
    category: RedditGrowthInsightCategoryEnum.describe(
      "Intelligence category: RECURRING_PAIN, EMERGING_THEME, OPPORTUNITY_CLUSTER, or FEATURE_REQUEST."
    ),
    evidenceStatus: RedditEvidenceStatusEnum.describe(
      "Evidence level: Repeated (3+ posts), Emerging (2 posts), Observed (1-2 strong quotes), Hypothesis (inferred/tentative)."
    ),
    frequency: z
      .number()
      .int()
      .min(1)
      .describe("Number of distinct Reddit posts contributing evidence to this insight."),
    confidence: z
      .number()
      .min(0)
      .max(100)
      .describe("Confidence percentage (0 - 100) based on signal strength and evidence consistency."),
    naturalLanguage: z
      .array(z.string())
      .min(1)
      .describe("Verbatim phrases and words job seekers actually use (e.g. 'black hole', 'scrambled my headers')."),
    recommendedAction: z
      .string()
      .describe("Actionable, strategic guidance for Qurtesy product positioning, content, or feature roadmapping."),
    sourcePostIds: z
      .array(z.string())
      .min(1)
      .describe("Array of post IDs from the input opportunities that provide direct evidence for this insight."),
  })
  .refine(
    data => {
      // Guardrail: Never call a single post 'Repeated'
      if (data.frequency === 1 && data.evidenceStatus === "Repeated") {
        return false;
      }
      // Repeated requires at least 3 supporting posts
      if (data.evidenceStatus === "Repeated" && data.frequency < 3) {
        return false;
      }
      return true;
    },
    {
      message: "Repeated status requires at least 3 supporting posts. Single posts cannot be labeled Repeated.",
      path: ["evidenceStatus"],
    }
  );

export type RedditGrowthInsightItem = z.infer<typeof RedditGrowthInsightItemSchema>;

export const RedditGrowthIntelligencePayloadSchema = z.object({
  summary: z
    .string()
    .describe("Executive overview of current Reddit sentiment, candidate friction, and community discussions."),
  insights: z
    .array(RedditGrowthInsightItemSchema)
    .describe("List of structured growth insights synthesized from the Reddit opportunity dataset."),
});

export type RedditGrowthIntelligencePayload = z.infer<typeof RedditGrowthIntelligencePayloadSchema>;

