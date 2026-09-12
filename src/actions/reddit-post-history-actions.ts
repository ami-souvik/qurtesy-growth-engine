"use server"

import { db } from "@/lib/db"
import {
  redditOpportunities,
  redditCommentDrafts,
  redditResumeReviews,
  redditPostedComments,
} from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import {
  RecordPostedCommentInputSchema,
  RecordPostedCommentInput,
  UpdatePostPerformanceInputSchema,
  UpdatePostPerformanceInput,
} from "@/lib/ai/schemas"
import {
  PostedCommentRecord,
  PostingAnalyticsSummary,
  computePostingAnalytics,
} from "@/lib/reddit-learning-service"

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

/**
 * Records that the founder has manually posted a comment on Reddit.
 * Preserves AI Draft, Human Edited Draft, and Final Posted Version.
 * NO auto-posting occurs.
 */
export async function recordPostedComment(
  rawInput: RecordPostedCommentInput
): Promise<PostedCommentRecord> {
  await verifyAuth()

  const input = RecordPostedCommentInputSchema.parse(rawInput)

  const postedDate = input.postedAt instanceof Date
    ? input.postedAt
    : new Date(input.postedAt)

  const newId = crypto.randomUUID()
  const newRow = {
    id: newId,
    opportunityId: input.opportunityId || null,
    commentDraftId: input.commentDraftId || null,
    resumeReviewId: input.resumeReviewId || null,
    subreddit: input.subreddit,
    postTitle: input.postTitle,
    postUrl: input.postUrl,
    postedUrl: input.postedUrl,
    postedAt: postedDate,
    strategy: input.strategy,
    responseStyle: input.responseStyle || null,
    topic: input.topic || null,
    notes: input.notes || null,
    aiDraft: input.aiDraft || null,
    humanEditedDraft: input.humanEditedDraft || null,
    finalPostedComment: input.finalPostedComment,
    upvotes: 0,
    replies: 0,
    profileVisits: 0,
    qurtesyClicks: 0,
    qurtesySessions: 0,
    builderStarts: 0,
    tailoringStarts: 0,
    otherProductActions: 0,
    lastMetricsUpdatedAt: null,
  }

  await db.insert(redditPostedComments).values(newRow)

  // Update associated records status to POSTED
  if (input.commentDraftId) {
    await db
      .update(redditCommentDrafts)
      .set({
        finalApprovedDraft: input.finalPostedComment,
        status: "POSTED",
        updatedAt: new Date(),
      })
      .where(eq(redditCommentDrafts.id, input.commentDraftId))
  }

  if (input.resumeReviewId) {
    await db
      .update(redditResumeReviews)
      .set({
        commentDraft: input.finalPostedComment,
        status: "POSTED",
        updatedAt: new Date(),
      })
      .where(eq(redditResumeReviews.id, input.resumeReviewId))
  }

  if (input.opportunityId) {
    await db
      .update(redditOpportunities)
      .set({
        status: "POSTED",
        updatedAt: new Date(),
      })
      .where(eq(redditOpportunities.id, input.opportunityId))
  }

  revalidatePath("/reddit-scout")
  revalidatePath("/reddit-scout/history")
  if (input.opportunityId) {
    revalidatePath(`/reddit-scout/draft/${input.opportunityId}`)
    revalidatePath(`/reddit-scout/resume-review/${input.opportunityId}`)
  }

  return {
    ...newRow,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Updates founder-recorded performance numbers for a posted comment.
 */
export async function updatePostPerformance(
  rawInput: UpdatePostPerformanceInput
): Promise<{ success: boolean }> {
  await verifyAuth()

  const input = UpdatePostPerformanceInputSchema.parse(rawInput)

  await db
    .update(redditPostedComments)
    .set({
      upvotes: input.upvotes,
      replies: input.replies,
      profileVisits: input.profileVisits,
      qurtesyClicks: input.qurtesyClicks,
      qurtesySessions: input.qurtesySessions,
      builderStarts: input.builderStarts,
      tailoringStarts: input.tailoringStarts,
      otherProductActions: input.otherProductActions,
      lastMetricsUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(redditPostedComments.id, input.id))

  revalidatePath("/reddit-scout/history")
  return { success: true }
}

/**
 * Fetches posting history with preserved drafts and recorded metrics.
 */
export async function getPostingHistory(filters?: {
  subreddit?: string
  strategy?: string
}): Promise<PostedCommentRecord[]> {
  let query = db
    .select()
    .from(redditPostedComments)
    .orderBy(desc(redditPostedComments.postedAt))

  const rows = await query

  let filtered = rows as unknown as PostedCommentRecord[]
  if (filters?.subreddit && filters.subreddit !== "ALL") {
    filtered = filtered.filter(
      r => r.subreddit.toLowerCase() === filters.subreddit!.toLowerCase()
    )
  }
  if (filters?.strategy && filters.strategy !== "ALL") {
    filtered = filtered.filter(
      r => r.strategy.toUpperCase() === filters.strategy!.toUpperCase()
    )
  }

  return filtered
}

/**
 * Computes performance analytics and empirical learning patterns across all posts.
 */
export async function getPostingAnalyticsAndLearnings(): Promise<PostingAnalyticsSummary> {
  const posts = await getPostingHistory()
  return computePostingAnalytics(posts)
}

/**
 * Removes a posted comment record.
 */
export async function deletePostedComment(id: string): Promise<{ success: boolean }> {
  await verifyAuth()

  await db
    .delete(redditPostedComments)
    .where(eq(redditPostedComments.id, id))

  revalidatePath("/reddit-scout/history")
  return { success: true }
}
