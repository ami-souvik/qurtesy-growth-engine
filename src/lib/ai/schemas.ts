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

export const RedditCommentStrategyEnum = z.enum([
  "PAIN",
  "GIVEAWAY",
  "RESUME_REVIEW",
  "ANTI_FAKE_AI",
]);

export const ProductMentionReasonEnum = z.enum([
  "directly relevant",
  "natural",
  "not relevant",
]);

export const RedditCommentDraftResponseSchema = z.object({
  includeProductMention: z.boolean().describe("Whether Qurtesy is mentioned in this comment draft."),
  productMentionReason: ProductMentionReasonEnum.describe(
    "Reason why product mention was included or omitted: 'directly relevant', 'natural', or 'not relevant'."
  ),
  strategyUsed: RedditCommentStrategyEnum.describe(
    "The strategy applied: PAIN, GIVEAWAY, RESUME_REVIEW, or ANTI_FAKE_AI."
  ),
  commentDraft: z.string().describe(
    "The complete, ready-to-post Reddit comment draft in Reddit markdown. 90% useful answer, 10% optional product mention."
  ),
  valueProvidedSummary: z.string().describe(
    "Concise summary of the genuine value provided to the user before any product mention."
  ),
  guardrailsVerified: z.boolean().describe(
    "Confirms no fake claims, testimonials, user counts, or fake personal anecdotes were invented."
  ),
});

export type RedditCommentDraftResponse = z.infer<typeof RedditCommentDraftResponseSchema>;

export const ResumeImprovementItemSchema = z.object({
  priority: z.number().int().min(1).max(3).describe("Priority rank: 1 (highest impact), 2, or 3."),
  title: z.string().describe("Concise, actionable improvement headline."),
  explanation: z.string().describe("Specific explanation of what to change and why it improves interview odds."),
});

export const BulletRewriteItemSchema = z.object({
  originalBullet: z.string().describe("Exact bullet text from candidate's resume/post."),
  issue: z.string().describe("Specific weakness (e.g. passive tone, missing scope, unquantified impact)."),
  suggestedRewrite: z.string().describe(
    "Rewritten bullet following [Action Verb] + [Context] + [Impact]. STRICT ZERO-FABRICATION: use placeholders like [insert metric if known] for any unstated numbers."
  ),
  evidencePresent: z.boolean().describe("True if sufficient factual basis was present in the user's text."),
});

export const MissingEvidenceItemSchema = z.object({
  area: z.string().describe("Experience, tech stack, or outcome area lacking clear proof."),
  guidance: z.string().describe("What the candidate should self-verify, clarify, or quantify."),
  placeholderExample: z.string().describe("Template or placeholder showing how they can format it if they have the data."),
});

export const AtsConsiderationItemSchema = z.object({
  category: z.string().describe("Category: Layout, Header, Fonts, Tables, or Keywords."),
  recommendation: z.string().describe("Evidence-based ATS recommendation (e.g. avoid 2-column tables)."),
});

export const RedditResumeReviewResponseSchema = z.object({
  targetRoleIdentified: z.string().nullable().describe("Target role detected or confirmed."),
  topImprovements: z
    .array(ResumeImprovementItemSchema)
    .length(3)
    .describe("Exactly 3 prioritized, high-impact improvements."),
  bulletRewrites: z
    .array(BulletRewriteItemSchema)
    .describe("Rewritten bullet points where evidence exists, using placeholders for missing data."),
  missingEvidence: z
    .array(MissingEvidenceItemSchema)
    .describe("Specific areas where the candidate should quantify or clarify their own results."),
  atsConsiderations: z
    .array(AtsConsiderationItemSchema)
    .describe("Actionable ATS compatibility recommendations based strictly on layout and parsing rules."),
  clarityAssessment: z.string().describe("Brief evaluation of resume readability, structure, and brevity."),
  keywordAlignmentAssessment: z
    .string()
    .nullable()
    .describe("Comparison of resume keywords against target role/JD if provided."),
  redditCommentDraft: z.string().describe(
    "Constructive, Reddit-native feedback comment in markdown. 90% useful feedback, 10% optional Qurtesy mention."
  ),
  guardrailsVerified: z.boolean().describe(
    "Confirms zero fabricated achievements, metrics, technologies, employers, or credentials."
  ),
});

export type RedditResumeReviewResponse = z.infer<typeof RedditResumeReviewResponseSchema>;



