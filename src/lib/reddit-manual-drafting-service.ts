import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import {
  RedditCommentDraftResponseSchema,
  RedditCommentDraftResponse,
  RedditCommentStrategyEnum,
} from "@/lib/ai/schemas"
import {
  buildRedditCommentSystemPrompt,
  CommentStrategy,
} from "@/lib/ai/prompts/reddit-comment-prompts"
import {
  buildRedditCommentReplySystemPrompt,
  formatCommentReplyForDrafting,
  CommentReplyStrategy,
} from "@/lib/ai/prompts/reddit-comment-reply-prompts"
import { getAugmentedProductContext } from "@/lib/ai/prompts/product-context"
import { sanitizeUntrustedXmlContent } from "./reddit-utils"

export interface ManualPostDraftInput {
  subreddit: string
  title: string
  body?: string | null
  author?: string | null
  permalink?: string | null
  attachedImages?: string[]
  strategy?: CommentStrategy
  forceProductMention?: boolean | null
  customInstructions?: string | null
}

export interface ManualCommentReplyDraftInput {
  subreddit: string
  postTitle: string
  postBody?: string | null
  postAuthor?: string | null
  targetCommentAuthor?: string | null
  targetCommentBody: string
  strategy?: CommentReplyStrategy
  forceProductMention?: boolean | null
  customInstructions?: string | null
}

export interface ManualDraftOptions {
  customProductContext?: string
  aiModelOverride?: any
}

/**
 * Generates an AI-drafted comment for a standalone Reddit post (with optional attached image analysis).
 */
export async function generateManualPostDraft(
  input: ManualPostDraftInput,
  options?: ManualDraftOptions
): Promise<{ response: RedditCommentDraftResponse; modelUsed: string }> {
  const strategy: CommentStrategy =
    input.strategy && RedditCommentStrategyEnum.options.includes(input.strategy as any)
      ? input.strategy
      : "PAIN"

  // 1. Fallback for test/offline environments without API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey && !options?.aiModelOverride) {
    const includeMention = input.forceProductMention === true
    const fallbackResponse: RedditCommentDraftResponse = {
      includeProductMention: includeMention,
      productMentionReason: includeMention ? "natural" : "not relevant",
      strategyUsed: strategy,
      commentDraft: `Here is practical, actionable feedback for "${input.title}":\n\n1. Use a single-column ATS layout to ensure text fields parse without scrambling.\n2. Quantify achievements with real, verifiable metrics where available.\n\nHope this gives you a clean starting point!`,
      valueProvidedSummary: "Actionable advice on ATS layout and impact quantification.",
      guardrailsVerified: true,
    }
    return { response: fallbackResponse, modelUsed: "fallback-no-key" }
  }

  // 2. Prepare Context and Prompts
  const productContext = options?.customProductContext || (await getAugmentedProductContext())
  const systemPrompt = buildRedditCommentSystemPrompt(
    strategy,
    input.forceProductMention,
    productContext
  )

  const authorStr = input.author ? `u/${sanitizeUntrustedXmlContent(input.author)}` : "OP"
  const sanitizedTitle = sanitizeUntrustedXmlContent(input.title)
  const sanitizedBody = sanitizeUntrustedXmlContent(input.body) || "[No text body / image post]"
  const customInstructionsStr = input.customInstructions
    ? `\n\nFounder Guidance:\n${sanitizeUntrustedXmlContent(input.customInstructions)}`
    : ""

  const promptText = `Generate a value-first Reddit comment draft for this post:

<target_reddit_post>
Subreddit: r/${input.subreddit}
Author: ${authorStr}
Title: ${sanitizedTitle}
Body:
${sanitizedBody}
</target_reddit_post>

Strategy: ${strategy}${customInstructionsStr}`

  try {
    const model = options?.aiModelOverride || google("gemini-3.6-flash")

    // Filter valid image URLs or data URLs (limit to 3 for token & performance safety)
    const validImages = (input.attachedImages || [])
      .filter((img): img is string => typeof img === "string" && img.trim().length > 0)
      .slice(0, 3)

    let generatedObj: RedditCommentDraftResponse

    if (validImages.length > 0) {
      // Multimodal prompt with attached images
      const userContentParts: any[] = [{ type: "text", text: promptText }]
      for (const imgUrl of validImages) {
        try {
          if (imgUrl.startsWith("data:")) {
            userContentParts.push({ type: "image", image: imgUrl })
          } else {
            userContentParts.push({ type: "image", image: new URL(imgUrl) })
          }
        } catch {
          // If URL parsing fails, ignore this single image
        }
      }

      const { object } = await generateObject({
        model,
        schema: RedditCommentDraftResponseSchema,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContentParts },
        ],
      })
      generatedObj = object
    } else {
      // Text-only prompt
      const { object } = await generateObject({
        model,
        schema: RedditCommentDraftResponseSchema,
        system: systemPrompt,
        prompt: promptText,
      })
      generatedObj = object
    }

    if (input.forceProductMention === false) {
      generatedObj.includeProductMention = false
      generatedObj.productMentionReason = "not relevant"
    }

    return {
      response: generatedObj,
      modelUsed: options?.aiModelOverride ? "test-override" : "gemini-3.6-flash",
    }
  } catch (error: any) {
    console.error("Failed to generate manual post comment draft:", error)
    const fallback: RedditCommentDraftResponse = {
      includeProductMention: false,
      productMentionReason: "not relevant",
      strategyUsed: strategy,
      commentDraft: `Here is practical advice for this post:\n\n- Stick to single-column ATS formatting to prevent parsing errors.\n- Lead with measurable accomplishments rather than generic job responsibilities.`,
      valueProvidedSummary: "Practical guidance on formatting and quantifiable bullet points.",
      guardrailsVerified: true,
    }
    return { response: fallback, modelUsed: "error-fallback" }
  }
}

/**
 * Generates an AI-drafted reply to a specific comment inside a Reddit thread.
 */
export async function generateManualCommentReplyDraft(
  input: ManualCommentReplyDraftInput,
  options?: ManualDraftOptions
): Promise<{ response: RedditCommentDraftResponse; modelUsed: string }> {
  const strategy: CommentReplyStrategy = input.strategy || "PRACTICAL_ADVICE"

  // 1. Fallback for test/offline environments without API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey && !options?.aiModelOverride) {
    const includeMention = input.forceProductMention === true
    const fallbackResponse: RedditCommentDraftResponse = {
      includeProductMention: includeMention,
      productMentionReason: includeMention ? "natural" : "not relevant",
      strategyUsed: "PAIN",
      commentDraft: `That's a fair question. The main nuance is that ATS parsers extract text fields into applicant profiles before recruiters filter them. When complex columns or tables are used, text gets scrambled across sections, which is why single-column layout is recommended.\n\nHope that clarifies the mechanics!`,
      valueProvidedSummary: "Clarified ATS text parsing mechanics constructively.",
      guardrailsVerified: true,
    }
    return { response: fallbackResponse, modelUsed: "fallback-no-key" }
  }

  // 2. Prepare Context and Prompts
  const productContext = options?.customProductContext || (await getAugmentedProductContext())
  const systemPrompt = buildRedditCommentReplySystemPrompt(
    strategy,
    input.forceProductMention,
    productContext
  )

  const promptInput = formatCommentReplyForDrafting({
    subreddit: input.subreddit,
    postTitle: input.postTitle,
    postBody: input.postBody,
    postAuthor: input.postAuthor,
    targetCommentAuthor: input.targetCommentAuthor,
    targetCommentBody: input.targetCommentBody,
    strategy,
    customInstructions: input.customInstructions,
  })

  try {
    const model = options?.aiModelOverride || google("gemini-3.6-flash")
    const { object } = await generateObject({
      model,
      schema: RedditCommentDraftResponseSchema,
      system: systemPrompt,
      prompt: promptInput,
    })

    if (input.forceProductMention === false) {
      object.includeProductMention = false
      object.productMentionReason = "not relevant"
    }

    return {
      response: object,
      modelUsed: options?.aiModelOverride ? "test-override" : "gemini-3.6-flash",
    }
  } catch (error: any) {
    console.error("Failed to generate manual comment reply draft:", error)
    const fallback: RedditCommentDraftResponse = {
      includeProductMention: false,
      productMentionReason: "not relevant",
      strategyUsed: "PAIN",
      commentDraft: `Appreciate the perspective. The key consideration is keeping formatting simple and unambiguous so both automated systems and recruiters can parse the experience accurately.`,
      valueProvidedSummary: "Balanced peer-to-peer clarification.",
      guardrailsVerified: true,
    }
    return { response: fallback, modelUsed: "error-fallback" }
  }
}
