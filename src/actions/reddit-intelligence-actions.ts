"use server"

import { db } from "@/lib/db"
import { redditPosts, redditOpportunities } from "@/db/schema"
import { eq, desc, and, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { classifyAndScorePost, CandidateRedditPost } from "@/lib/reddit-classifier-service"

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

export interface OpportunityQueryFilters {
  type?: string
  priority?: string
  status?: string
  search?: string
}

/**
 * Analyzes unprocessed Reddit posts and writes derived intelligence to reddit_opportunities.
 */
export async function analyzeRedditPosts(options?: { postIds?: string[]; limit?: number }) {
  await verifyAuth()

  const limit = options?.limit ?? 25

  let query = db
    .select()
    .from(redditPosts)
    .where(eq(redditPosts.ingestionStatus, "UNPROCESSED"))
    .limit(limit)

  if (options?.postIds && options.postIds.length > 0) {
    query = db
      .select()
      .from(redditPosts)
      .where(inArray(redditPosts.id, options.postIds))
      .limit(limit)
  }

  const postsToAnalyze = await query
  if (postsToAnalyze.length === 0) {
    return { analyzed: 0, opportunitiesCreated: 0 }
  }

  let opportunitiesCreated = 0

  for (const post of postsToAnalyze) {
    const candidate: CandidateRedditPost = {
      id: post.id,
      subreddit: post.subreddit,
      title: post.title,
      body: post.body,
      author: post.author,
      createdUtc: post.createdUtc,
      score: post.score,
      commentCount: post.commentCount,
      isDeleted: post.isDeleted,
      isSpam: post.isSpam,
      isNsfw: post.isNsfw,
    }

    try {
      const result = await classifyAndScorePost(candidate)

      // Insert derived intelligence into reddit_opportunities
      await db.insert(redditOpportunities).values({
        postId: post.id,
        opportunityType: result.classification.opportunityType,
        priority: result.scoring.priority,
        opportunityScore: result.scoring.opportunityScore,
        painScore: result.classification.painScore,
        intentScore: result.classification.intentScore,
        relevanceScore: result.classification.relevanceScore,
        helpfulnessScore: result.classification.helpfulnessScore,
        freshnessScore: result.scoring.freshnessScore,
        promotionalRisk: result.classification.promotionalRisk,
        confidence: Math.round(result.classification.confidence * 100),
        recommendedAngle: result.classification.recommendedAngle,
        reasoning: result.classification.reasoning,
        riskFlags: JSON.stringify(result.classification.riskFlags || []),
        status: "DISCOVERED",
        analysisVersion: result.analysisVersion,
        modelUsed: result.modelUsed,
      })

      // Update the raw post status
      const nextIngestionStatus =
        result.classification.opportunityType === "IGNORE" ? "FILTERED" : "OPPORTUNITY"

      await db
        .update(redditPosts)
        .set({ ingestionStatus: nextIngestionStatus })
        .where(eq(redditPosts.id, post.id))

      if (result.classification.opportunityType !== "IGNORE") {
        opportunitiesCreated++
      }
    } catch (err) {
      console.error(`Failed to analyze post ${post.id}:`, err)
    }
  }

  revalidatePath("/reddit-scout")
  return { analyzed: postsToAnalyze.length, opportunitiesCreated }
}

/**
 * Returns opportunities joined with original raw Reddit post metadata for complete traceability.
 */
export async function getRedditOpportunities(
  filters?: OpportunityQueryFilters,
  sortBy: "score" | "newest" = "score"
) {
  const conditions = []

  if (filters?.type && filters.type !== "ALL") {
    conditions.push(eq(redditOpportunities.opportunityType, filters.type))
  }

  if (filters?.priority && filters.priority !== "ALL") {
    conditions.push(eq(redditOpportunities.priority, filters.priority))
  }

  if (filters?.status && filters.status !== "ALL") {
    conditions.push(eq(redditOpportunities.status, filters.status))
  }

  const orderByClause =
    sortBy === "newest"
      ? [desc(redditPosts.createdUtc)]
      : [desc(redditOpportunities.opportunityScore), desc(redditPosts.createdUtc)]

  const results = await db
    .select({
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
      riskFlags: redditOpportunities.riskFlags,
      status: redditOpportunities.status,
      analysisVersion: redditOpportunities.analysisVersion,
      modelUsed: redditOpportunities.modelUsed,
      analyzedAt: redditOpportunities.analyzedAt,
      // Joined raw post fields for complete source traceability
      rawPost: {
        redditPostId: redditPosts.redditPostId,
        subreddit: redditPosts.subreddit,
        title: redditPosts.title,
        body: redditPosts.body,
        permalink: redditPosts.permalink,
        author: redditPosts.author,
        score: redditPosts.score,
        commentCount: redditPosts.commentCount,
        createdUtc: redditPosts.createdUtc,
      },
    })
    .from(redditOpportunities)
    .innerJoin(redditPosts, eq(redditOpportunities.postId, redditPosts.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(...orderByClause)

  return results
}

/**
 * Updates opportunity workflow status (e.g. SAVED, DISMISSED, DISCOVERED).
 */
export async function updateOpportunityStatus(
  id: string,
  status: "DISCOVERED" | "SAVED" | "DISMISSED"
) {
  await verifyAuth()

  await db
    .update(redditOpportunities)
    .set({ status, updatedAt: new Date() })
    .where(eq(redditOpportunities.id, id))

  revalidatePath("/reddit-scout")
  return { success: true }
}

/**
 * Returns summary metrics for opportunity filters.
 */
export async function getOpportunityMetrics() {
  const counts = await db
    .select({
      priority: redditOpportunities.priority,
      type: redditOpportunities.opportunityType,
      count: sql<number>`count(*)`,
    })
    .from(redditOpportunities)
    .groupBy(redditOpportunities.priority, redditOpportunities.opportunityType)

  const unprocessedCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(redditPosts)
    .where(eq(redditPosts.ingestionStatus, "UNPROCESSED"))

  return {
    breakdown: counts,
    unprocessedPosts: unprocessedCount[0]?.count ?? 0,
  }
}
