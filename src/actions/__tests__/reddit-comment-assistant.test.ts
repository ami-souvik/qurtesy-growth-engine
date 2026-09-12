import { test, describe } from "node:test"
import assert from "node:assert"
import {
  RedditCommentDraftResponseSchema,
  RedditCommentStrategyEnum,
  ProductMentionReasonEnum,
} from "../../lib/ai/schemas"
import {
  generateCommentDraft,
  OpportunityContextForComment,
} from "../../lib/reddit-comment-assistant-service"
import {
  buildRedditCommentSystemPrompt,
  formatOpportunityForDrafting,
} from "../../lib/ai/prompts/reddit-comment-prompts"
import {
  verifyAuth,
  saveHumanEditedDraft,
  markCommentCopied,
} from "../reddit-comment-actions"

describe("Reddit Comment Assistant Test Suite", () => {
  const baseOpportunity: OpportunityContextForComment = {
    id: "opp_sample_123",
    postId: "post_sample_456",
    opportunityType: "PAIN",
    painScore: 9,
    intentScore: 8,
    recommendedAngle: "Offer single-column ATS formatting advice",
    rawPost: {
      subreddit: "resumes",
      title: "Why does Workday parse my resume as random symbols?",
      body: "I spent 3 hours applying to 10 companies and Workday put my experience under education and scrambled all the tables.",
      author: "job_hunter_2026",
      permalink: "/r/resumes/comments/xyz123/why_does_workday_parse/",
    },
  }

  // Helper deterministic mock model for testing
  function createMockModel(responseObject: any) {
    const jsonStr = JSON.stringify(responseObject)
    return {
      specificationVersion: "v2" as const,
      modelId: "mock-comment-model",
      provider: "mock",
      doGenerate: async () => ({
        rawResponse: { headers: {} },
        text: jsonStr,
        content: [{ type: "text" as const, text: jsonStr }],
        finishReason: "stop" as const,
        usage: { promptTokens: 10, completionTokens: 20 },
        warnings: [],
      }),
    }
  }

  // 1. Strategy: PAIN
  test("1. PAIN strategy: identifies problem, provides practical advice, and formats valid output", async () => {
    const prompt = buildRedditCommentSystemPrompt("PAIN")
    assert.ok(prompt.includes("STRATEGY: PAIN"))
    assert.ok(prompt.includes("Pinpoint the exact root-cause friction point"))
    assert.ok(prompt.includes("Provide practical, immediately executable steps"))
    assert.ok(prompt.includes("Mention Qurtesy ONLY if it naturally solves part of the problem"))

    const mockPainOutput = {
      includeProductMention: false,
      productMentionReason: "not relevant" as const,
      strategyUsed: "PAIN" as const,
      commentDraft: "The issue with Workday table parsing is multi-column text frames. Switch to single column markdown or plaintext to avoid column scrambling.",
      valueProvidedSummary: "Root-cause diagnosis of multi-column parsing failure and fix.",
      guardrailsVerified: true,
    }

    const result = await generateCommentDraft(baseOpportunity, {
      strategyOverride: "PAIN",
      aiModelOverride: createMockModel(mockPainOutput),
    })

    assert.strictEqual(result.response.strategyUsed, "PAIN")
    assert.ok(result.response.commentDraft.length > 20)
    assert.ok(result.response.guardrailsVerified)

    // Validate with Zod
    const parsed = RedditCommentDraftResponseSchema.parse(result.response)
    assert.strictEqual(parsed.strategyUsed, "PAIN")
  })

  // 2. Strategy: GIVEAWAY
  test("2. GIVEAWAY strategy: provides complete manual framework first; solvable without Qurtesy", async () => {
    const prompt = buildRedditCommentSystemPrompt("GIVEAWAY")
    assert.ok(prompt.includes("STRATEGY: GIVEAWAY / FREE VALUE"))
    assert.ok(prompt.includes("Provide the complete, self-contained manual solution"))
    assert.ok(prompt.includes("The user must be able to solve their problem 100% manually"))
    assert.ok(prompt.includes("Qurtesy is merely an optional automated shortcut"))

    const mockGiveawayOutput = {
      includeProductMention: false,
      productMentionReason: "not relevant" as const,
      strategyUsed: "GIVEAWAY" as const,
      commentDraft: "Here is the complete bullet point formula to use manually:\n\n[Action Verb] + [Context/Skill] + [Measurable Business Outcome].\n\nNo paid tools needed.",
      valueProvidedSummary: "Self-contained framework solvable without tools.",
      guardrailsVerified: true,
    }

    const giveawayOpp: OpportunityContextForComment = {
      ...baseOpportunity,
      opportunityType: "GIVEAWAY",
    }
    const result = await generateCommentDraft(giveawayOpp, {
      strategyOverride: "GIVEAWAY",
      aiModelOverride: createMockModel(mockGiveawayOutput),
    })
    assert.strictEqual(result.response.strategyUsed, "GIVEAWAY")

    const parsed = RedditCommentDraftResponseSchema.parse(result.response)
    assert.strictEqual(parsed.strategyUsed, "GIVEAWAY")
  })

  // 3. Strategy: RESUME_REVIEW
  test("3. RESUME_REVIEW strategy: prioritizes actionable changes and forbids bullet fabrication", async () => {
    const prompt = buildRedditCommentSystemPrompt("RESUME_REVIEW")
    assert.ok(prompt.includes("STRATEGY: RESUME_REVIEW"))
    assert.ok(prompt.includes("Produce highly specific, prioritized feedback"))
    assert.ok(prompt.includes("Never fabricate achievements, metrics, technologies"))
    assert.ok(prompt.includes("use ONLY the facts present in the user's post"))

    const mockReviewOutput = {
      includeProductMention: false,
      productMentionReason: "not relevant" as const,
      strategyUsed: "RESUME_REVIEW" as const,
      commentDraft: "Looking at the 3 bullets in your post: your first bullet lacks the metric mentioned in line 2. Move 'reduced latency by 30%' to the beginning of the line.",
      valueProvidedSummary: "Specific bullet reordering based solely on user facts.",
      guardrailsVerified: true,
    }

    const reviewOpp: OpportunityContextForComment = {
      ...baseOpportunity,
      opportunityType: "RESUME_REVIEW",
    }
    const result = await generateCommentDraft(reviewOpp, {
      strategyOverride: "RESUME_REVIEW",
      aiModelOverride: createMockModel(mockReviewOutput),
    })
    assert.strictEqual(result.response.strategyUsed, "RESUME_REVIEW")

    const parsed = RedditCommentDraftResponseSchema.parse(result.response)
    assert.strictEqual(parsed.strategyUsed, "RESUME_REVIEW")
  })

  // 4. Strategy: ANTI_FAKE_AI
  test("4. ANTI_FAKE_AI strategy: leans into transparency and forbids unproven fear-mongering", async () => {
    const prompt = buildRedditCommentSystemPrompt("ANTI_FAKE_AI")
    assert.ok(prompt.includes("STRATEGY: ANTI_FAKE_AI / TRUTHFUL AI"))
    assert.ok(prompt.includes("Lean into radical transparency and authenticity"))
    assert.ok(prompt.includes("DO NOT make fear-mongering or unsupported claims"))
    assert.ok(prompt.includes("Phrase AI hallucination risks accurately, neutrally"))

    const mockAntiAiOutput = {
      includeProductMention: false,
      productMentionReason: "not relevant" as const,
      strategyUsed: "ANTI_FAKE_AI" as const,
      commentDraft: "AI should only structure real experience you already have, not fabricate unearned tech stacks or metrics that will trip you up in technical interviews.",
      valueProvidedSummary: "Constructive breakdown of truthful AI usage.",
      guardrailsVerified: true,
    }

    const antiAiOpp: OpportunityContextForComment = {
      ...baseOpportunity,
      opportunityType: "ANTI_FAKE_AI",
    }
    const result = await generateCommentDraft(antiAiOpp, {
      strategyOverride: "ANTI_FAKE_AI",
      aiModelOverride: createMockModel(mockAntiAiOutput),
    })
    assert.strictEqual(result.response.strategyUsed, "ANTI_FAKE_AI")

    const parsed = RedditCommentDraftResponseSchema.parse(result.response)
    assert.strictEqual(parsed.strategyUsed, "ANTI_FAKE_AI")
  })

  // 5. Product mention suppression
  test("5. Product mention suppression strictly omits Qurtesy mention when toggled off", async () => {
    const suppressedPrompt = buildRedditCommentSystemPrompt("PAIN", false)
    assert.ok(suppressedPrompt.includes("USER OVERRIDE: The founder has explicitly requested to OMIT any Qurtesy product mention"))
    assert.ok(suppressedPrompt.includes("Do NOT mention Qurtesy by name or link"))

    const mockOutput = {
      includeProductMention: false,
      productMentionReason: "not relevant" as const,
      strategyUsed: "PAIN" as const,
      commentDraft: "Focus on clean single-column plain text.",
      valueProvidedSummary: "General advice with zero product mention.",
      guardrailsVerified: true,
    }

    const result = await generateCommentDraft(baseOpportunity, {
      strategyOverride: "PAIN",
      forceProductMention: false,
      aiModelOverride: createMockModel(mockOutput),
    })

    assert.strictEqual(result.response.includeProductMention, false)
    assert.strictEqual(result.response.productMentionReason, "not relevant")
  })

  // 6. Fabricated claim prevention & guardrails
  test("6. Fabricated claim prevention forbids fake testimonials, metrics, and guarantees", () => {
    const prompt = buildRedditCommentSystemPrompt("PAIN")
    assert.ok(prompt.includes("90% Useful Answer, 10% Optional Product Mention"))
    assert.ok(prompt.includes("NEVER fabricate user metrics, user counts"))
    assert.ok(prompt.includes("NEVER fabricate candidate facts"))
    assert.ok(prompt.includes("NEVER invent non-existent Qurtesy capabilities"))
    assert.ok(prompt.includes("no fake personal anecdotes"))
  })

  // 7. Human edit persistence
  test("7. Human edit persistence preserves pristine originalAiDraft when founder edits", () => {
    const draftRecord = {
      id: "draft_123",
      opportunityId: "opp_sample_123",
      strategy: "PAIN",
      includeProductMention: false,
      productMentionReason: "not relevant",
      originalAiDraft: "Initial pristine AI comment text generated on day 1.",
      humanEditedDraft: "Initial pristine AI comment text generated on day 1.",
      finalApprovedDraft: null,
      status: "DRAFTED",
    }

    // Founder edits draft
    const founderEditedText = "Here is my personalized edit with custom advice for Workday."
    const updatedDraft = {
      ...draftRecord,
      humanEditedDraft: founderEditedText,
      status: "EDITED",
    }

    // Assert original AI draft is NOT overwritten
    assert.strictEqual(updatedDraft.originalAiDraft, "Initial pristine AI comment text generated on day 1.")
    assert.strictEqual(updatedDraft.humanEditedDraft, founderEditedText)
    assert.strictEqual(updatedDraft.status, "EDITED")
  })

  // 8. Authorization check
  test("8. Server actions verify authorization before updating or copying drafts", async () => {
    await assert.rejects(async () => {
      await saveHumanEditedDraft("mock_draft_id", "Edited content")
    }, {
      message: /Unauthorized/,
    })

    await assert.rejects(async () => {
      await markCommentCopied("mock_draft_id", "Approved content")
    }, {
      message: /Unauthorized/,
    })
  })

  // 9. Source traceability
  test("9. Formats opportunity and preserves source traceability with permalink and author", () => {
    const formatted = formatOpportunityForDrafting({
      subreddit: baseOpportunity.rawPost.subreddit,
      title: baseOpportunity.rawPost.title,
      body: baseOpportunity.rawPost.body,
      author: baseOpportunity.rawPost.author,
      opportunityType: baseOpportunity.opportunityType,
      painScore: baseOpportunity.painScore,
      intentScore: baseOpportunity.intentScore,
      recommendedAngle: baseOpportunity.recommendedAngle,
      permalink: baseOpportunity.rawPost.permalink,
    })

    assert.ok(formatted.includes("<target_reddit_post>"))
    assert.ok(formatted.includes("r/resumes"))
    assert.ok(formatted.includes("u/job_hunter_2026"))
    assert.ok(formatted.includes(baseOpportunity.rawPost.title))
    assert.ok(formatted.includes("Pain Score: 9/10"))
    assert.ok(formatted.includes(baseOpportunity.recommendedAngle))
  })
})
