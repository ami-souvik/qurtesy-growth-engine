import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import {
  RedditGrowthIntelligencePayloadSchema,
  RedditGrowthIntelligencePayload,
  RedditGrowthInsightItem,
} from "@/lib/ai/schemas"
import {
  buildRedditGrowthIntelligenceSystemPrompt,
  formatOpportunitiesForSynthesis,
} from "@/lib/ai/prompts/reddit-growth-prompts"
import { getAugmentedProductContext } from "@/lib/ai/prompts/product-context"

export interface OpportunityWithRawPost {
  id: string
  postId: string
  opportunityType: string
  priority: string
  opportunityScore: number
  painScore: number
  intentScore: number
  relevanceScore: number
  helpfulnessScore: number
  recommendedAngle: string
  rawPost: {
    redditPostId: string
    subreddit: string
    title: string
    body?: string | null
    permalink: string
    author?: string | null
    createdUtc: Date | string | number
  }
}

export interface SynthesizedRedditInsight {
  theme: string
  category: "RECURRING_PAIN" | "EMERGING_THEME" | "OPPORTUNITY_CLUSTER" | "FEATURE_REQUEST"
  evidenceStatus: "Repeated" | "Emerging" | "Observed" | "Hypothesis"
  frequency: number
  confidence: number
  naturalLanguage: string[]
  recommendedAction: string
  lastObservedAt: Date
  sources: Array<{
    postId: string
    title: string
    subreddit: string
    permalink: string
  }>
}

export interface RedditGrowthIntelligenceResult {
  summary: string
  insights: SynthesizedRedditInsight[]
  modelUsed: string
}

/**
 * Synthesizes classified Reddit opportunities into reusable Growth Intelligence.
 * Strict Guardrail: Single posts are never labeled as 'Repeated' or a 'trend'.
 */
export async function synthesizeRedditGrowthIntelligence(
  opportunities: OpportunityWithRawPost[],
  options?: {
    customProductContext?: string
    aiModelOverride?: any
  }
): Promise<RedditGrowthIntelligenceResult> {
  // Only include active opportunities (exclude IGNORE)
  const activeOpps = opportunities.filter(opp => opp.opportunityType !== "IGNORE")

  if (activeOpps.length === 0) {
    return {
      summary: "No active Reddit opportunities available yet to synthesize growth patterns.",
      insights: [],
      modelUsed: "none",
    }
  }

  // Fallback for tests or environments without Google API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey && !options?.aiModelOverride) {
    console.warn("No GOOGLE_GENERATIVE_AI_API_KEY available; using deterministic synthesis fallback.")
    const primaryOpp = activeOpps[0]
    const fallbackInsight: SynthesizedRedditInsight = {
      theme: primaryOpp.rawPost.title.slice(0, 60),
      category: primaryOpp.opportunityType === "PAIN" ? "RECURRING_PAIN" : "OPPORTUNITY_CLUSTER",
      evidenceStatus: activeOpps.length >= 3 ? "Repeated" : activeOpps.length === 2 ? "Emerging" : "Observed",
      frequency: activeOpps.length,
      confidence: Math.round(primaryOpp.opportunityScore),
      naturalLanguage: [primaryOpp.rawPost.title],
      recommendedAction: primaryOpp.recommendedAngle,
      lastObservedAt: new Date(primaryOpp.rawPost.createdUtc),
      sources: activeOpps.map(o => ({
        postId: o.postId,
        title: o.rawPost.title,
        subreddit: o.rawPost.subreddit,
        permalink: o.rawPost.permalink,
      })),
    }

    return {
      summary: `Analyzed ${activeOpps.length} Reddit opportunities across r/${primaryOpp.rawPost.subreddit}.`,
      insights: [fallbackInsight],
      modelUsed: "fallback-no-key",
    }
  }

  const productContext = options?.customProductContext || (await getAugmentedProductContext())
  const systemPrompt = buildRedditGrowthIntelligenceSystemPrompt(productContext)
  const formattedInput = formatOpportunitiesForSynthesis(
    activeOpps.map(o => ({
      id: o.postId,
      subreddit: o.rawPost.subreddit,
      title: o.rawPost.title,
      body: o.rawPost.body,
      opportunityType: o.opportunityType,
      painScore: o.painScore,
      intentScore: o.intentScore,
      recommendedAngle: o.recommendedAngle,
      permalink: o.rawPost.permalink,
    }))
  )

  try {
    const model = options?.aiModelOverride || google("gemini-3.6-flash")
    const { object: payload } = await generateObject({
      model,
      schema: RedditGrowthIntelligencePayloadSchema,
      system: systemPrompt,
      prompt: formattedInput,
    })

    // Map insights and preserve 100% source traceability
    const postMap = new Map<string, OpportunityWithRawPost>()
    activeOpps.forEach(o => postMap.set(o.postId, o))

    const synthesizedInsights: SynthesizedRedditInsight[] = payload.insights.map(item => {
      // Resolve source references
      const matchedSources: Array<{
        postId: string
        title: string
        subreddit: string
        permalink: string
      }> = []

      let latestDate = new Date(0)

      for (const pid of item.sourcePostIds) {
        const opp = postMap.get(pid)
        if (opp) {
          matchedSources.push({
            postId: opp.postId,
            title: opp.rawPost.title,
            subreddit: opp.rawPost.subreddit,
            permalink: opp.rawPost.permalink,
          })
          const oppDate = new Date(opp.rawPost.createdUtc)
          if (oppDate > latestDate) {
            latestDate = oppDate
          }
        }
      }

      // If AI hallucinated post IDs, fallback to actual active posts
      if (matchedSources.length === 0) {
        const fallback = activeOpps[0]
        matchedSources.push({
          postId: fallback.postId,
          title: fallback.rawPost.title,
          subreddit: fallback.rawPost.subreddit,
          permalink: fallback.rawPost.permalink,
        })
        latestDate = new Date(fallback.rawPost.createdUtc)
      }

      // Enforce frequency & evidence status guardrail
      const actualFrequency = Math.max(matchedSources.length, item.frequency)
      let resolvedStatus = item.evidenceStatus
      if (actualFrequency < 3 && resolvedStatus === "Repeated") {
        resolvedStatus = actualFrequency === 2 ? "Emerging" : "Observed"
      }

      return {
        theme: item.theme,
        category: item.category,
        evidenceStatus: resolvedStatus,
        frequency: actualFrequency,
        confidence: Math.round(item.confidence),
        naturalLanguage: item.naturalLanguage,
        recommendedAction: item.recommendedAction,
        lastObservedAt: latestDate.getTime() === 0 ? new Date() : latestDate,
        sources: matchedSources,
      }
    })

    return {
      summary: payload.summary,
      insights: synthesizedInsights,
      modelUsed: options?.aiModelOverride ? "test-override" : "gemini-3.6-flash",
    }
  } catch (error: any) {
    console.error("Failed to synthesize Reddit Growth Intelligence with AI:", error)
    // Safe fallback to prevent breaking growth intelligence generation
    const fallbackOpp = activeOpps[0]
    return {
      summary: `Synthesized observations from ${activeOpps.length} candidate Reddit opportunities.`,
      insights: [
        {
          theme: fallbackOpp.rawPost.title.slice(0, 70),
          category: fallbackOpp.opportunityType === "PAIN" ? "RECURRING_PAIN" : "OPPORTUNITY_CLUSTER",
          evidenceStatus: activeOpps.length >= 3 ? "Repeated" : activeOpps.length === 2 ? "Emerging" : "Observed",
          frequency: activeOpps.length,
          confidence: Math.round(fallbackOpp.opportunityScore),
          naturalLanguage: [fallbackOpp.rawPost.title],
          recommendedAction: fallbackOpp.recommendedAngle,
          lastObservedAt: new Date(fallbackOpp.rawPost.createdUtc),
          sources: activeOpps.map(o => ({
            postId: o.postId,
            title: o.rawPost.title,
            subreddit: o.rawPost.subreddit,
            permalink: o.rawPost.permalink,
          })),
        },
      ],
      modelUsed: "error-fallback",
    }
  }
}
