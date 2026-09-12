"use server"

import { db } from "@/lib/db"
import { redditOpportunities, redditPosts, redditCommentDrafts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { generateCommentDraft, CommentStrategy } from "@/lib/reddit-comment-assistant-service"

export async function verifyAuth() {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }
    return session
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      throw err
    }
    throw new Error("Unauthorized")
  }
}

export interface CommentDraftRecord {
  id: string
  opportunityId: string
  strategy: string
  includeProductMention: boolean
  productMentionReason: string
  originalAiDraft: string
  humanEditedDraft: string | null
  finalApprovedDraft: string | null
  status: string
  modelUsed: string | null
  createdAt: Date | string | number
  updatedAt: Date | string | number
}

export interface OpportunityWithPostAndDraft {
  opportunity: {
    id: string
    postId: string
    opportunityType: string
    priority: string
    opportunityScore: number
    painScore: number
    intentScore: number
    relevanceScore: number
    helpfulnessScore: number
    freshnessScore: number
    promotionalRisk: string
    confidence: number
    recommendedAngle: string
    reasoning: string | null
    status: string
  }
  rawPost: {
    redditPostId: string
    subreddit: string
    title: string
    body: string | null
    permalink: string
    author: string | null
    createdUtc: Date | string | number
  }
  draft: CommentDraftRecord | null
}

/**
 * Fetches opportunity, raw post, and any existing draft.
 */
export async function getOpportunityWithDraft(
  opportunityId: string
): Promise<OpportunityWithPostAndDraft | null> {
  const [row] = await db
    .select({
      opportunity: {
        id: redditOpportunities.id,
        postId: redditOpportunities.postId,
        opportunityType: redditOpportunities.opportunityType,
        priority: redditOpportunities.priority,
        opportunityScore: redditOpportunities.opportunityScore,
        painScore: redditOpportunities.painScore,
        intentScore: redditOpportunities.intentScore,
        relevanceScore: redditOpportunities.relevanceScore,
        helpfulnessScore: redditOpportunities.helpfulnessScore,
        freshnessScore: redditOpportunities.freshnessScore,
        promotionalRisk: redditOpportunities.promotionalRisk,
        confidence: redditOpportunities.confidence,
        recommendedAngle: redditOpportunities.recommendedAngle,
        reasoning: redditOpportunities.reasoning,
        status: redditOpportunities.status,
      },
      rawPost: {
        redditPostId: redditPosts.redditPostId,
        subreddit: redditPosts.subreddit,
        title: redditPosts.title,
        body: redditPosts.body,
        permalink: redditPosts.permalink,
        author: redditPosts.author,
        createdUtc: redditPosts.createdUtc,
      },
    })
    .from(redditOpportunities)
    .innerJoin(redditPosts, eq(redditOpportunities.postId, redditPosts.id))
    .where(eq(redditOpportunities.id, opportunityId))
    .limit(1)

  if (!row) return null

  const [existingDraft] = await db
    .select()
    .from(redditCommentDrafts)
    .where(eq(redditCommentDrafts.opportunityId, opportunityId))
    .orderBy(desc(redditCommentDrafts.createdAt))
    .limit(1)

  return {
    opportunity: row.opportunity,
    rawPost: row.rawPost,
    draft: existingDraft || null,
  }
}

/**
 * Generates an initial or refreshed draft using Gemini 3.6 Flash.
 * Stores originalAiDraft without overwriting historical edits unless regenerating.
 */
export async function generateOrRegenerateCommentDraft(
  opportunityId: string,
  options?: {
    strategy?: CommentStrategy
    forceProductMention?: boolean | null
  }
): Promise<CommentDraftRecord> {
  await verifyAuth()

  const oppData = await getOpportunityWithDraft(opportunityId)
  if (!oppData) {
    throw new Error(`Opportunity ${opportunityId} not found`)
  }

  const { response, modelUsed } = await generateCommentDraft(
    {
      id: oppData.opportunity.id,
      postId: oppData.opportunity.postId,
      opportunityType: oppData.opportunity.opportunityType,
      painScore: oppData.opportunity.painScore,
      intentScore: oppData.opportunity.intentScore,
      recommendedAngle: oppData.opportunity.recommendedAngle,
      rawPost: oppData.rawPost,
    },
    {
      strategyOverride: options?.strategy,
      forceProductMention: options?.forceProductMention,
    }
  )

  const [existingDraft] = await db
    .select()
    .from(redditCommentDrafts)
    .where(eq(redditCommentDrafts.opportunityId, opportunityId))
    .orderBy(desc(redditCommentDrafts.createdAt))
    .limit(1)

  if (existingDraft) {
    // Regenerating: update originalAiDraft and reset humanEditedDraft to new draft
    await db
      .update(redditCommentDrafts)
      .set({
        strategy: response.strategyUsed,
        includeProductMention: response.includeProductMention,
        productMentionReason: response.productMentionReason,
        originalAiDraft: response.commentDraft,
        humanEditedDraft: response.commentDraft,
        status: "DRAFTED",
        modelUsed,
        updatedAt: new Date(),
      })
      .where(eq(redditCommentDrafts.id, existingDraft.id))

    revalidatePath(`/reddit-scout/draft/${opportunityId}`)
    return {
      ...existingDraft,
      strategy: response.strategyUsed,
      includeProductMention: response.includeProductMention,
      productMentionReason: response.productMentionReason,
      originalAiDraft: response.commentDraft,
      humanEditedDraft: response.commentDraft,
      status: "DRAFTED",
      modelUsed,
    }
  }

  const newDraftId = crypto.randomUUID()
  const newRecord = {
    id: newDraftId,
    opportunityId,
    strategy: response.strategyUsed,
    includeProductMention: response.includeProductMention,
    productMentionReason: response.productMentionReason,
    originalAiDraft: response.commentDraft,
    humanEditedDraft: response.commentDraft,
    finalApprovedDraft: null,
    status: "DRAFTED",
    modelUsed,
  }

  await db.insert(redditCommentDrafts).values(newRecord)

  revalidatePath(`/reddit-scout/draft/${opportunityId}`)
  return {
    ...newRecord,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Saves human edits while keeping originalAiDraft completely intact.
 */
export async function saveHumanEditedDraft(
  draftId: string,
  editedDraft: string
): Promise<{ success: boolean }> {
  await verifyAuth()

  await db
    .update(redditCommentDrafts)
    .set({
      humanEditedDraft: editedDraft,
      status: "EDITED",
      updatedAt: new Date(),
    })
    .where(eq(redditCommentDrafts.id, draftId))

  return { success: true }
}

/**
 * Marks comment as copied and sets finalApprovedDraft.
 * Strictly non-automated: Founder copies comment to manually paste into Reddit.
 */
export async function markCommentCopied(
  draftId: string,
  approvedText: string
): Promise<{ success: boolean }> {
  await verifyAuth()

  await db
    .update(redditCommentDrafts)
    .set({
      finalApprovedDraft: approvedText,
      status: "COPIED",
      updatedAt: new Date(),
    })
    .where(eq(redditCommentDrafts.id, draftId))

  return { success: true }
}
