import { db } from "./db"
import { redditPosts, redditScans, redditOpportunities } from "@/db/schema"
import { and, lt, inArray, notInArray, sql } from "drizzle-orm"

/**
 * Configurable retention rules for external Reddit content and operational logs.
 * Avoids storing large amounts of third-party Reddit content indefinitely.
 */
export const REDDIT_RETENTION_CONFIG = {
  // Retention window in days for raw unprocessed or filtered posts
  RAW_POST_RETENTION_DAYS: 30,
  // Retention window in days for historical scan logs
  SCAN_LOG_RETENTION_DAYS: 30,
}

export interface PruneResult {
  prunedRawPosts: number
  prunedScanLogs: number
  cutoffRawPosts: Date
  cutoffScanLogs: Date
}

/**
 * Safely prunes expired raw Reddit posts and historical scan logs.
 * Strictly preserves:
 * - Posts that resulted in opportunities or posted comments.
 * - Posts within the active retention window.
 */
export async function pruneExpiredRedditContent(options?: {
  rawPostDays?: number
  scanLogDays?: number
}): Promise<PruneResult> {
  const rawDays = options?.rawPostDays ?? REDDIT_RETENTION_CONFIG.RAW_POST_RETENTION_DAYS
  const scanDays = options?.scanLogDays ?? REDDIT_RETENTION_CONFIG.SCAN_LOG_RETENTION_DAYS

  const cutoffRawPosts = new Date(Date.now() - rawDays * 24 * 60 * 60 * 1000)
  const cutoffScanLogs = new Date(Date.now() - scanDays * 24 * 60 * 60 * 1000)

  // 1. Prune expired raw posts that are FILTERED or UNPROCESSED (not linked to opportunities)
  // Get all post IDs linked to opportunities so we NEVER delete them
  const linkedOpportunityPosts = await db
    .select({ postId: redditOpportunities.postId })
    .from(redditOpportunities)
  
  const protectedPostIds = new Set(linkedOpportunityPosts.map(r => r.postId))

  // Find candidate expired posts
  const expiredPosts = await db
    .select({ id: redditPosts.id })
    .from(redditPosts)
    .where(
      and(
        lt(redditPosts.fetchedAt, cutoffRawPosts),
        inArray(redditPosts.ingestionStatus, ["FILTERED", "UNPROCESSED"])
      )
    )

  const candidateIdsToDelete = expiredPosts
    .map(p => p.id)
    .filter(id => !protectedPostIds.has(id))

  let prunedRawPosts = 0
  if (candidateIdsToDelete.length > 0) {
    // Delete in chunks of 100 to avoid SQLite variable limit
    const chunkSize = 100
    for (let i = 0; i < candidateIdsToDelete.length; i += chunkSize) {
      const chunk = candidateIdsToDelete.slice(i, i + chunkSize)
      await db.delete(redditPosts).where(inArray(redditPosts.id, chunk))
      prunedRawPosts += chunk.length
    }
  }

  // 2. Prune old completed scan logs
  const oldScans = await db
    .select({ id: redditScans.id })
    .from(redditScans)
    .where(
      and(
        lt(redditScans.startedAt, cutoffScanLogs),
        inArray(redditScans.status, ["SUCCESS", "FAILED", "PARTIAL_FAILURE"])
      )
    )

  let prunedScanLogs = 0
  if (oldScans.length > 0) {
    const scanIds = oldScans.map(s => s.id)
    const chunkSize = 100
    for (let i = 0; i < scanIds.length; i += chunkSize) {
      const chunk = scanIds.slice(i, i + chunkSize)
      await db.delete(redditScans).where(inArray(redditScans.id, chunk))
      prunedScanLogs += chunk.length
    }
  }

  return {
    prunedRawPosts,
    prunedScanLogs,
    cutoffRawPosts,
    cutoffScanLogs,
  }
}
