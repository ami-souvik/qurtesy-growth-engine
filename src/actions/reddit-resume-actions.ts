"use server"

import { db } from "@/lib/db"
import { redditOpportunities, redditPosts, redditResumeReviews } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { analyzeRedditResume } from "@/lib/reddit-resume-review-service"
import {
  ResumeImprovementItemSchema,
  BulletRewriteItemSchema,
  MissingEvidenceItemSchema,
  AtsConsiderationItemSchema,
} from "@/lib/ai/schemas"
import { z } from "zod"

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

export type ResumeImprovement = z.infer<typeof ResumeImprovementItemSchema>
export type BulletRewrite = z.infer<typeof BulletRewriteItemSchema>
export type MissingEvidence = z.infer<typeof MissingEvidenceItemSchema>
export type AtsConsideration = z.infer<typeof AtsConsiderationItemSchema>

export interface ParsedResumeReview {
  id: string
  opportunityId: string
  targetRole: string | null
  targetJobDescription: string | null
  extractedResumeSnippet: string | null
  topImprovements: ResumeImprovement[]
  bulletRewrites: BulletRewrite[]
  missingEvidence: MissingEvidence[]
  atsConsiderations: AtsConsideration[]
  clarityAssessment: string
  keywordAlignment: string | null
  commentDraft: string
  status: string
  modelUsed: string | null
  createdAt: Date | string | number
  updatedAt: Date | string | number
}

export interface OpportunityWithResumeReview {
  opportunity: {
    id: string
    postId: string
    opportunityType: string
    priority: string
    opportunityScore: number
    painScore: number
    intentScore: number
    relevanceScore: number
    recommendedAngle: string
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
  review: ParsedResumeReview | null
}

function parseReviewRecord(row: any): ParsedResumeReview {
  let topImprovements: ResumeImprovement[] = []
  let bulletRewrites: BulletRewrite[] = []
  let missingEvidence: MissingEvidence[] = []
  let atsConsiderations: AtsConsideration[] = []

  try {
    topImprovements = JSON.parse(row.topImprovements)
  } catch {}
  try {
    bulletRewrites = JSON.parse(row.bulletRewrites)
  } catch {}
  try {
    missingEvidence = JSON.parse(row.missingEvidence)
  } catch {}
  try {
    atsConsiderations = JSON.parse(row.atsConsiderations)
  } catch {}

  return {
    id: row.id,
    opportunityId: row.opportunityId,
    targetRole: row.targetRole,
    targetJobDescription: row.targetJobDescription,
    extractedResumeSnippet: row.extractedResumeSnippet,
    topImprovements,
    bulletRewrites,
    missingEvidence,
    atsConsiderations,
    clarityAssessment: row.clarityAssessment,
    keywordAlignment: row.keywordAlignment,
    commentDraft: row.commentDraft,
    status: row.status,
    modelUsed: row.modelUsed,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * Loads an opportunity, raw post, and existing resume review session.
 */
export async function getResumeReviewSession(
  opportunityId: string
): Promise<OpportunityWithResumeReview | null> {
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
        recommendedAngle: redditOpportunities.recommendedAngle,
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

  const [existingReview] = await db
    .select()
    .from(redditResumeReviews)
    .where(eq(redditResumeReviews.opportunityId, opportunityId))
    .orderBy(desc(redditResumeReviews.createdAt))
    .limit(1)

  return {
    opportunity: row.opportunity,
    rawPost: row.rawPost,
    review: existingReview ? parseReviewRecord(existingReview) : null,
  }
}

/**
 * Runs zero-fabrication resume critique and persists session.
 * Minimizes stored data: only retains a truncated excerpt to respect third-party user privacy.
 */
export async function runResumeReviewAnalysis(
  opportunityId: string,
  input: {
    resumeText: string
    targetRole?: string
    targetJobDescription?: string
  }
): Promise<ParsedResumeReview> {
  await verifyAuth()

  const oppData = await getResumeReviewSession(opportunityId)
  if (!oppData) {
    throw new Error(`Opportunity ${opportunityId} not found`)
  }

  const { response, modelUsed } = await analyzeRedditResume({
    subreddit: oppData.rawPost.subreddit,
    title: oppData.rawPost.title,
    author: oppData.rawPost.author,
    resumeText: input.resumeText,
    targetRole: input.targetRole,
    targetJobDescription: input.targetJobDescription,
  })

  // Privacy protection: store only a minimal excerpt (max 300 chars)
  const privacySafeExcerpt = input.resumeText.slice(0, 300).trim()

  const [existing] = await db
    .select()
    .from(redditResumeReviews)
    .where(eq(redditResumeReviews.opportunityId, opportunityId))
    .limit(1)

  if (existing) {
    await db
      .update(redditResumeReviews)
      .set({
        targetRole: input.targetRole || response.targetRoleIdentified,
        targetJobDescription: input.targetJobDescription || null,
        extractedResumeSnippet: privacySafeExcerpt,
        topImprovements: JSON.stringify(response.topImprovements),
        bulletRewrites: JSON.stringify(response.bulletRewrites),
        missingEvidence: JSON.stringify(response.missingEvidence),
        atsConsiderations: JSON.stringify(response.atsConsiderations),
        clarityAssessment: response.clarityAssessment,
        keywordAlignment: response.keywordAlignmentAssessment,
        commentDraft: response.redditCommentDraft,
        status: "ANALYZED",
        modelUsed,
        updatedAt: new Date(),
      })
      .where(eq(redditResumeReviews.id, existing.id))

    revalidatePath(`/reddit-scout/resume-review/${opportunityId}`)
    return parseReviewRecord({
      ...existing,
      targetRole: input.targetRole || response.targetRoleIdentified,
      targetJobDescription: input.targetJobDescription || null,
      extractedResumeSnippet: privacySafeExcerpt,
      topImprovements: JSON.stringify(response.topImprovements),
      bulletRewrites: JSON.stringify(response.bulletRewrites),
      missingEvidence: JSON.stringify(response.missingEvidence),
      atsConsiderations: JSON.stringify(response.atsConsiderations),
      clarityAssessment: response.clarityAssessment,
      keywordAlignment: response.keywordAlignmentAssessment,
      commentDraft: response.redditCommentDraft,
      status: "ANALYZED",
      modelUsed,
      updatedAt: new Date(),
    })
  }

  const newId = crypto.randomUUID()
  const newRow = {
    id: newId,
    opportunityId,
    targetRole: input.targetRole || response.targetRoleIdentified,
    targetJobDescription: input.targetJobDescription || null,
    extractedResumeSnippet: privacySafeExcerpt,
    topImprovements: JSON.stringify(response.topImprovements),
    bulletRewrites: JSON.stringify(response.bulletRewrites),
    missingEvidence: JSON.stringify(response.missingEvidence),
    atsConsiderations: JSON.stringify(response.atsConsiderations),
    clarityAssessment: response.clarityAssessment,
    keywordAlignment: response.keywordAlignmentAssessment,
    commentDraft: response.redditCommentDraft,
    status: "ANALYZED",
    modelUsed,
  }

  await db.insert(redditResumeReviews).values(newRow)

  revalidatePath(`/reddit-scout/resume-review/${opportunityId}`)
  return parseReviewRecord({
    ...newRow,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

/**
 * Updates founder-edited Reddit comment draft for resume review.
 */
export async function updateResumeCommentDraft(
  reviewId: string,
  editedComment: string
): Promise<{ success: boolean }> {
  await verifyAuth()

  await db
    .update(redditResumeReviews)
    .set({
      commentDraft: editedComment,
      status: "EDITED",
      updatedAt: new Date(),
    })
    .where(eq(redditResumeReviews.id, reviewId))

  return { success: true }
}

/**
 * Marks resume review comment as copied for manual Reddit posting.
 */
export async function markResumeCommentCopied(
  reviewId: string
): Promise<{ success: boolean }> {
  await verifyAuth()

  await db
    .update(redditResumeReviews)
    .set({
      status: "COPIED",
      updatedAt: new Date(),
    })
    .where(eq(redditResumeReviews.id, reviewId))

  return { success: true }
}
