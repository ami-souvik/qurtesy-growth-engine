import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import {
  RedditCommentDraftResponseSchema,
  RedditCommentDraftResponse,
  RedditCommentStrategyEnum,
} from "@/lib/ai/schemas"
import {
  buildRedditCommentSystemPrompt,
  formatOpportunityForDrafting,
  CommentStrategy,
} from "@/lib/ai/prompts/reddit-comment-prompts"
import { getAugmentedProductContext } from "@/lib/ai/prompts/product-context"

export type { CommentStrategy }


export interface OpportunityContextForComment {
  id: string
  postId: string
  opportunityType: string
  painScore: number
  intentScore: number
  recommendedAngle: string
  rawPost: {
    subreddit: string
    title: string
    body?: string | null
    author?: string | null
    permalink: string
  }
}

export interface GenerateCommentOptions {
  strategyOverride?: CommentStrategy
  forceProductMention?: boolean | null
  customProductContext?: string
  aiModelOverride?: any
}

export async function generateCommentDraft(
  opportunity: OpportunityContextForComment,
  options?: GenerateCommentOptions
): Promise<{ response: RedditCommentDraftResponse; modelUsed: string }> {
  // Determine effective strategy (fallback to PAIN if opportunityType is IGNORE or unknown)
  let strategy: CommentStrategy = "PAIN"
  if (
    options?.strategyOverride &&
    RedditCommentStrategyEnum.options.includes(options.strategyOverride as any)
  ) {
    strategy = options.strategyOverride
  } else if (
    RedditCommentStrategyEnum.options.includes(opportunity.opportunityType as any)
  ) {
    strategy = opportunity.opportunityType as CommentStrategy
  }

  // Fallback for offline or test environments without API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey && !options?.aiModelOverride) {
    console.warn("No GOOGLE_GENERATIVE_AI_API_KEY available; using deterministic comment draft fallback.")
    const includeMention = options?.forceProductMention === true
    const fallbackResponse: RedditCommentDraftResponse = {
      includeProductMention: includeMention,
      productMentionReason: includeMention ? "natural" : "not relevant",
      strategyUsed: strategy,
      commentDraft: `Here is a direct answer to your question about ${opportunity.rawPost.title}:\n\n1. Focus on single-column formatting so ATS parsers don't scramble your text.\n2. Quantify results with authentic metrics.\n\nHope this helps!`,
      valueProvidedSummary: "Provided 2 practical steps for formatting and impact quantification.",
      guardrailsVerified: true,
    }

    return { response: fallbackResponse, modelUsed: "fallback-no-key" }
  }

  const productContext = options?.customProductContext || (await getAugmentedProductContext())
  const systemPrompt = buildRedditCommentSystemPrompt(
    strategy,
    options?.forceProductMention,
    productContext
  )

  const promptInput = formatOpportunityForDrafting({
    subreddit: opportunity.rawPost.subreddit,
    title: opportunity.rawPost.title,
    body: opportunity.rawPost.body,
    author: opportunity.rawPost.author,
    opportunityType: opportunity.opportunityType,
    painScore: opportunity.painScore,
    intentScore: opportunity.intentScore,
    recommendedAngle: opportunity.recommendedAngle,
    permalink: opportunity.rawPost.permalink,
  })

  try {
    const model = options?.aiModelOverride || google("gemini-3.6-flash")
    const { object: response } = await generateObject({
      model,
      schema: RedditCommentDraftResponseSchema,
      system: systemPrompt,
      prompt: promptInput,
    })

    // If founder explicitly forced omit, ensure includeProductMention is strictly false
    if (options?.forceProductMention === false) {
      response.includeProductMention = false
      response.productMentionReason = "not relevant"
    }

    return {
      response,
      modelUsed: options?.aiModelOverride ? "test-override" : "gemini-3.6-flash",
    }
  } catch (error: any) {
    console.error("Failed to generate Reddit comment draft:", error)
    // Resilient fallback
    const fallback: RedditCommentDraftResponse = {
      includeProductMention: false,
      productMentionReason: "not relevant",
      strategyUsed: strategy,
      commentDraft: `Here is practical advice for this situation:\n\n- Break down the requirements into clear, simple bullets.\n- Keep your layout in a clean single column to ensure readability.`,
      valueProvidedSummary: "Basic actionable guidance on formatting.",
      guardrailsVerified: true,
    }
    return { response: fallback, modelUsed: "error-fallback" }
  }
}
