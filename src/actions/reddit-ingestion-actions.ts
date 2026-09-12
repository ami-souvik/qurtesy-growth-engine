"use server"

import { db } from "@/lib/db"
import { redditCommunities, redditPosts, redditScans, redditConfig } from "@/db/schema"
import { eq, inArray, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { fetchRecentPosts, RedditPost } from "@/lib/reddit-client"

async function verifyAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
}

export async function getRecentScans(limit = 5) {
  return await db.select().from(redditScans).orderBy(desc(redditScans.startedAt)).limit(limit)
}

export async function getRecentDiscoveredPosts(limit = 10) {
  return await db.select().from(redditPosts).orderBy(desc(redditPosts.fetchedAt)).limit(limit)
}

function isPostFiltered(post: RedditPost): { filtered: boolean; isDeleted: boolean; isSpam: boolean; isNsfw: boolean } {
  // Cheap deterministic filtering
  const isDeleted = post.author === "[deleted]" || post.removed_by_category !== null
  const isSpam = !post.is_robot_indexable && post.removed_by_category === "spam"
  const isNsfw = post.over_18
  
  return {
    filtered: isDeleted || isSpam || isNsfw,
    isDeleted,
    isSpam,
    isNsfw
  }
}

export async function scanReddit() {
  await verifyAuth()

  // 1. Check if reddit listening is enabled
  const [config] = await db.select().from(redditConfig).limit(1)
  if (!config?.enabled) {
    throw new Error("Reddit listening is disabled in Data Sources.")
  }

  // 2. Create scan record
  const scanId = crypto.randomUUID()
  await db.insert(redditScans).values({
    id: scanId,
    status: "IN_PROGRESS"
  })

  try {
    const communities = await db.select().from(redditCommunities)
    let totalDiscovered = 0
    let totalNew = 0
    let totalSkipped = 0

    const successfulCommunities: string[] = []
    const failedCommunities: Array<{ community: string; error: string }> = []

    for (let i = 0; i < communities.length; i++) {
      const community = communities[i]
      if (i > 0) {
        // Sleep 2 seconds between communities to respect rate limits
        await new Promise(r => setTimeout(r, 2000))
      }
      try {
        const posts = await fetchRecentPosts(community.name)
        totalDiscovered += posts.length
        successfulCommunities.push(community.name)

        if (posts.length === 0) continue

        // Filter out posts that already exist to avoid crashing on duplicate constraint
        const existingIds = await db
          .select({ id: redditPosts.redditPostId })
          .from(redditPosts)
          .where(
            inArray(
              redditPosts.redditPostId,
              posts.map(p => p.id)
            )
          )
        
        const existingIdSet = new Set(existingIds.map(row => row.id))

        for (const post of posts) {
          if (existingIdSet.has(post.id)) {
            totalSkipped++
            continue
          }

          const filterStatus = isPostFiltered(post)
          
          await db.insert(redditPosts).values({
            redditPostId: post.id,
            subreddit: post.subreddit,
            title: post.title,
            body: post.selftext,
            permalink: post.permalink.startsWith("http")
              ? post.permalink
              : `https://reddit.com${post.permalink.startsWith("/") ? "" : "/"}${post.permalink}`,
            author: post.author,
            score: post.score,
            commentCount: post.num_comments,
            createdUtc: new Date(post.created_utc),
            isNsfw: filterStatus.isNsfw,
            isSpam: filterStatus.isSpam,
            isDeleted: filterStatus.isDeleted,
            ingestionStatus: filterStatus.filtered ? "FILTERED" : "UNPROCESSED"
          })
          
          totalNew++
        }
      } catch (err: any) {
        console.error(`Failed to scan community ${community.name}:`, err)
        failedCommunities.push({ community: community.name, error: err.message || "Unknown error" })
      }
    }

    // Determine accurate scan status: SUCCESS, PARTIAL_FAILURE, or FAILED
    let scanStatus: "SUCCESS" | "PARTIAL_FAILURE" | "FAILED" = "SUCCESS"
    let errorMessage: string | null = null

    if (failedCommunities.length > 0) {
      if (successfulCommunities.length === 0 && communities.length > 0) {
        scanStatus = "FAILED"
      } else {
        scanStatus = "PARTIAL_FAILURE"
      }
      errorMessage = failedCommunities
        .map(f => `r/${f.community}: ${f.error}`)
        .join("; ")
    }

    // Mark scan complete with definitive status
    await db.update(redditScans).set({
      status: scanStatus,
      completedAt: new Date(),
      subredditsScanned: communities.length,
      postsDiscovered: totalDiscovered,
      newPosts: totalNew,
      skippedPosts: totalSkipped,
      errorMessage,
    }).where(eq(redditScans.id, scanId))

    // Update global config last scan time
    await db.update(redditConfig).set({
      lastScanAt: new Date()
    })

    revalidatePath("/reddit-scout")
    revalidatePath("/")
    
    return {
      scanId,
      status: scanStatus,
      totalDiscovered,
      totalNew,
      totalSkipped,
      failedCount: failedCommunities.length,
    }
  } catch (fatalError: any) {
    console.error("Fatal scan failure:", fatalError)
    await db.update(redditScans).set({
      status: "FAILED",
      completedAt: new Date(),
      errorMessage: fatalError.message || "Fatal scan error",
    }).where(eq(redditScans.id, scanId))
    throw fatalError
  }
}

