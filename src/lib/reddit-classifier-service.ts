import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { RedditOpportunityClassificationSchema, RedditOpportunityClassification } from "@/lib/ai/schemas"
import { buildRedditClassifierSystemPrompt, formatRedditPostForAnalysis } from "@/lib/ai/prompts/reddit-classifier"
import { getAugmentedProductContext } from "@/lib/ai/prompts/product-context"
import { calculateOpportunityScore, ScoringResult } from "@/lib/reddit-scoring"

export interface CandidateRedditPost {
  id: string
  subreddit: string
  title: string
  body?: string | null
  author?: string | null
  createdUtc: number | Date
  score?: number | null
  commentCount?: number | null
  isDeleted?: boolean | null
  isSpam?: boolean | null
  isNsfw?: boolean | null
}

export interface ClassifiedOpportunity {
  postId: string
  classification: RedditOpportunityClassification
  scoring: ScoringResult
  modelUsed: string
  analysisVersion: string
}

/**
 * Cheap deterministic filter: detects obvious spam, deleted posts, or hiring ads
 * before spending any AI tokens.
 */
export function evaluateDeterministicFilter(post: CandidateRedditPost): RedditOpportunityClassification | null {
  // Deleted or removed
  if (post.isDeleted || post.author === "[deleted]" || post.author === "AutoModerator") {
    return {
      opportunityType: "IGNORE",
      painScore: 0,
      intentScore: 0,
      relevanceScore: 0,
      helpfulnessScore: 0,
      promotionalRisk: "HIGH",
      confidence: 1.0,
      recommendedAngle: "Post was removed, deleted, or posted by a bot.",
      reasoning: "Deterministic filter: post is removed or authored by AutoModerator.",
      riskFlags: ["DELETED_OR_BOT"],
    }
  }

  // Explicit spam flag
  if (post.isSpam) {
    return {
      opportunityType: "IGNORE",
      painScore: 0,
      intentScore: 0,
      relevanceScore: 0,
      helpfulnessScore: 0,
      promotionalRisk: "HIGH",
      confidence: 1.0,
      recommendedAngle: "Post flagged as spam.",
      reasoning: "Deterministic filter: flagged as spam.",
      riskFlags: ["SPAM_FLAGGED"],
    }
  }

  const titleLower = post.title.toLowerCase().trim()

  // Hiring / Recruiter broadcasts (not job seeker pain)
  const isHiringAd =
    titleLower.startsWith("[hiring]") ||
    titleLower.startsWith("hiring:") ||
    titleLower.includes("we are hiring") ||
    titleLower.includes("job opening:") ||
    titleLower.includes("now hiring")

  if (isHiringAd) {
    return {
      opportunityType: "IGNORE",
      painScore: 1,
      intentScore: 1,
      relevanceScore: 1,
      helpfulnessScore: 0,
      promotionalRisk: "HIGH",
      confidence: 0.95,
      recommendedAngle: "Recruiter job announcement. Not a job seeker opportunity.",
      reasoning: "Deterministic filter: post is a hiring advertisement.",
      riskFlags: ["HIRING_BROADCAST"],
    }
  }

  return null
}

/**
 * Hybrid Classifier: Combines cheap deterministic filtering with Zod-validated AI analysis.
 */
export async function classifyAndScorePost(
  post: CandidateRedditPost,
  options?: {
    customProductContext?: string
    aiModelOverride?: any
    skipAiIfNoKey?: boolean
  }
): Promise<ClassifiedOpportunity> {
  const version = "v1.0"
  
  // 1. Cheap deterministic check
  const deterministicResult = evaluateDeterministicFilter(post)
  if (deterministicResult) {
    const scoring = calculateOpportunityScore({
      opportunityType: deterministicResult.opportunityType,
      painScore: deterministicResult.painScore,
      intentScore: deterministicResult.intentScore,
      relevanceScore: deterministicResult.relevanceScore,
      helpfulnessScore: deterministicResult.helpfulnessScore,
      createdUtc: post.createdUtc,
      promotionalRisk: deterministicResult.promotionalRisk,
      score: post.score,
      commentCount: post.commentCount,
    })

    return {
      postId: post.id,
      classification: deterministicResult,
      scoring,
      modelUsed: "deterministic-filter",
      analysisVersion: version,
    }
  }

  // 2. Prepare Context and AI Prompt
  const productContext = options?.customProductContext || (await getAugmentedProductContext())
  const systemPrompt = buildRedditClassifierSystemPrompt(productContext)
  const userPrompt = formatRedditPostForAnalysis(post)

  // 3. Fallback if no API key or in unit tests with no key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey && !options?.aiModelOverride) {
    console.warn("No GOOGLE_GENERATIVE_AI_API_KEY available; using fallback classification.")
    const fallbackClassification: RedditOpportunityClassification = {
      opportunityType: "IGNORE",
      painScore: 0,
      intentScore: 0,
      relevanceScore: 0,
      helpfulnessScore: 0,
      promotionalRisk: "LOW",
      confidence: 0.5,
      recommendedAngle: "API key not configured for AI classification.",
      reasoning: "Fallback triggered due to missing AI credentials.",
      riskFlags: ["NO_AI_KEY"],
    }

    const scoring = calculateOpportunityScore({
      opportunityType: fallbackClassification.opportunityType,
      painScore: fallbackClassification.painScore,
      intentScore: fallbackClassification.intentScore,
      relevanceScore: fallbackClassification.relevanceScore,
      helpfulnessScore: fallbackClassification.helpfulnessScore,
      createdUtc: post.createdUtc,
      promotionalRisk: fallbackClassification.promotionalRisk,
      score: post.score,
      commentCount: post.commentCount,
    })

    return {
      postId: post.id,
      classification: fallbackClassification,
      scoring,
      modelUsed: "fallback-no-key",
      analysisVersion: version,
    }
  }

  // 4. Structured AI Generation with Zod Validation
  try {
    const model = options?.aiModelOverride || google("gemini-3.6-flash")
    const { object: classification } = await generateObject({
      model,
      schema: RedditOpportunityClassificationSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })

    const scoring = calculateOpportunityScore({
      opportunityType: classification.opportunityType,
      painScore: classification.painScore,
      intentScore: classification.intentScore,
      relevanceScore: classification.relevanceScore,
      helpfulnessScore: classification.helpfulnessScore,
      createdUtc: post.createdUtc,
      promotionalRisk: classification.promotionalRisk,
      score: post.score,
      commentCount: post.commentCount,
    })

    return {
      postId: post.id,
      classification,
      scoring,
      modelUsed: options?.aiModelOverride ? "test-override" : "gemini-3.6-flash",
      analysisVersion: version,
    }
  } catch (error: any) {
    console.error(`AI classification failed for post ${post.id}:`, error)
    // Resilient fallback on AI error
    const errorFallback: RedditOpportunityClassification = {
      opportunityType: "IGNORE",
      painScore: 0,
      intentScore: 0,
      relevanceScore: 0,
      helpfulnessScore: 0,
      promotionalRisk: "HIGH",
      confidence: 0,
      recommendedAngle: "Classification encountered an error.",
      reasoning: `Error during classification: ${error.message || "Unknown error"}`,
      riskFlags: ["AI_ERROR"],
    }

    const scoring = calculateOpportunityScore({
      opportunityType: errorFallback.opportunityType,
      painScore: 0,
      intentScore: 0,
      relevanceScore: 0,
      helpfulnessScore: 0,
      createdUtc: post.createdUtc,
      promotionalRisk: "HIGH",
      score: post.score,
      commentCount: post.commentCount,
    })

    return {
      postId: post.id,
      classification: errorFallback,
      scoring,
      modelUsed: "error-fallback",
      analysisVersion: version,
    }
  }
}
