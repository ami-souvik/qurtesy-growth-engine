"use server"

import { db } from "@/lib/db"
import { redditManualDrafts } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { fetchRedditPostDetails, FetchRedditUrlResult } from "@/lib/reddit-manual-fetcher"
import {
  generateManualPostDraft,
  generateManualCommentReplyDraft,
  ManualPostDraftInput,
  ManualCommentReplyDraftInput,
} from "@/lib/reddit-manual-drafting-service"
import { CommentStrategy } from "@/lib/reddit-comment-assistant-service"
import { CommentReplyStrategy } from "@/lib/ai/prompts/reddit-comment-reply-prompts"

async function verifyAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
}

/**
 * Server action to fetch post details and attached images from a Reddit URL.
 */
export async function fetchRedditUrlDetailsAction(url: string): Promise<FetchRedditUrlResult> {
  await verifyAuth()
  if (!url || typeof url !== "string" || !url.trim()) {
    return { success: false, error: "Please provide a valid Reddit URL." }
  }
  return await fetchRedditPostDetails(url.trim())
}

/**
 * Server action to generate an AI comment draft for a specific Reddit post.
 */
export async function generateManualPostDraftAction(input: {
  subreddit: string
  title: string
  body?: string | null
  author?: string | null
  postUrl?: string | null
  attachedImages?: string[]
  strategy: CommentStrategy
  forceProductMention?: boolean | null
  customInstructions?: string | null
  existingDraftId?: string | null
}) {
  await verifyAuth()

  if (!input.title || !input.title.trim()) {
    throw new Error("Post title is required.")
  }
  if (!input.subreddit || !input.subreddit.trim()) {
    throw new Error("Subreddit name is required.")
  }

  const { response, modelUsed } = await generateManualPostDraft({
    subreddit: input.subreddit.trim(),
    title: input.title.trim(),
    body: input.body?.trim() || null,
    author: input.author?.trim() || null,
    permalink: input.postUrl?.trim() || null,
    attachedImages: input.attachedImages || [],
    strategy: input.strategy,
    forceProductMention: input.forceProductMention,
    customInstructions: input.customInstructions?.trim() || null,
  })

  let draftId = input.existingDraftId

  if (draftId) {
    // Update existing record
    await db
      .update(redditManualDrafts)
      .set({
        strategy: input.strategy,
        aiDraft: response.commentDraft,
        humanEditedDraft: null,
        valueProvidedSummary: response.valueProvidedSummary,
        includeProductMention: response.includeProductMention,
        productMentionReason: response.productMentionReason,
        status: "DRAFTED",
        updatedAt: new Date(),
      })
      .where(eq(redditManualDrafts.id, draftId))
  } else {
    // Create new manual draft record
    draftId = crypto.randomUUID()
    await db.insert(redditManualDrafts).values({
      id: draftId,
      draftType: "POST_COMMENT",
      subreddit: input.subreddit.trim(),
      postTitle: input.title.trim(),
      postUrl: input.postUrl?.trim() || null,
      postBody: input.body?.trim() || null,
      attachedImages: input.attachedImages ? JSON.stringify(input.attachedImages) : null,
      strategy: input.strategy,
      aiDraft: response.commentDraft,
      humanEditedDraft: null,
      valueProvidedSummary: response.valueProvidedSummary,
      includeProductMention: response.includeProductMention,
      productMentionReason: response.productMentionReason,
      status: "DRAFTED",
    })
  }

  revalidatePath("/reddit-scout")
  return {
    success: true,
    draftId,
    response,
    modelUsed,
  }
}

/**
 * Server action to generate an AI reply to a specific comment inside a Reddit thread.
 */
export async function generateManualCommentReplyDraftAction(input: {
  subreddit: string
  postTitle: string
  postBody?: string | null
  postAuthor?: string | null
  postUrl?: string | null
  targetCommentAuthor?: string | null
  targetCommentBody: string
  strategy: CommentReplyStrategy
  forceProductMention?: boolean | null
  customInstructions?: string | null
  existingDraftId?: string | null
}) {
  await verifyAuth()

  if (!input.postTitle || !input.postTitle.trim()) {
    throw new Error("Post title / thread topic is required.")
  }
  if (!input.targetCommentBody || !input.targetCommentBody.trim()) {
    throw new Error("Target comment text is required.")
  }

  const { response, modelUsed } = await generateManualCommentReplyDraft({
    subreddit: input.subreddit.trim() || "resumes",
    postTitle: input.postTitle.trim(),
    postBody: input.postBody?.trim() || null,
    postAuthor: input.postAuthor?.trim() || null,
    targetCommentAuthor: input.targetCommentAuthor?.trim() || null,
    targetCommentBody: input.targetCommentBody.trim(),
    strategy: input.strategy,
    forceProductMention: input.forceProductMention,
    customInstructions: input.customInstructions?.trim() || null,
  })

  let draftId = input.existingDraftId

  if (draftId) {
    await db
      .update(redditManualDrafts)
      .set({
        strategy: input.strategy,
        aiDraft: response.commentDraft,
        humanEditedDraft: null,
        valueProvidedSummary: response.valueProvidedSummary,
        includeProductMention: response.includeProductMention,
        productMentionReason: response.productMentionReason,
        status: "DRAFTED",
        updatedAt: new Date(),
      })
      .where(eq(redditManualDrafts.id, draftId))
  } else {
    draftId = crypto.randomUUID()
    await db.insert(redditManualDrafts).values({
      id: draftId,
      draftType: "COMMENT_REPLY",
      subreddit: input.subreddit.trim() || "resumes",
      postTitle: input.postTitle.trim(),
      postUrl: input.postUrl?.trim() || null,
      postBody: input.postBody?.trim() || null,
      targetCommentAuthor: input.targetCommentAuthor?.trim() || null,
      targetCommentBody: input.targetCommentBody.trim(),
      strategy: input.strategy,
      aiDraft: response.commentDraft,
      humanEditedDraft: null,
      valueProvidedSummary: response.valueProvidedSummary,
      includeProductMention: response.includeProductMention,
      productMentionReason: response.productMentionReason,
      status: "DRAFTED",
    })
  }

  revalidatePath("/reddit-scout")
  return {
    success: true,
    draftId,
    response,
    modelUsed,
  }
}

/**
 * Saves human edits made to a manual draft.
 */
export async function saveManualDraftEditsAction(draftId: string, humanEditedDraft: string) {
  await verifyAuth()
  await db
    .update(redditManualDrafts)
    .set({
      humanEditedDraft,
      status: "EDITED",
      updatedAt: new Date(),
    })
    .where(eq(redditManualDrafts.id, draftId))

  revalidatePath("/reddit-scout")
  return { success: true }
}

/**
 * Marks a manual draft as copied to clipboard.
 */
export async function markManualDraftCopiedAction(draftId: string) {
  await verifyAuth()
  await db
    .update(redditManualDrafts)
    .set({
      status: "COPIED",
      updatedAt: new Date(),
    })
    .where(eq(redditManualDrafts.id, draftId))

  return { success: true }
}

/**
 * Fetches recent manual drafts for history and quick re-use.
 */
export async function getRecentManualDraftsAction(
  type?: "POST_COMMENT" | "COMMENT_REPLY",
  limit = 5
) {
  await verifyAuth()

  if (type) {
    return await db
      .select()
      .from(redditManualDrafts)
      .where(eq(redditManualDrafts.draftType, type))
      .orderBy(desc(redditManualDrafts.createdAt))
      .limit(limit)
  }

  return await db
    .select()
    .from(redditManualDrafts)
    .orderBy(desc(redditManualDrafts.createdAt))
    .limit(limit)
}
