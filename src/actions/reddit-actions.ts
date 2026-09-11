"use server"

import { db } from "@/lib/db"
import { redditConfig, redditCommunities } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// Ensure user is authorized before modifying config
async function verifyAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function getRedditConfig() {
  const [config] = await db.select().from(redditConfig).limit(1)
  if (!config) {
    // Return default unpersisted state if no config exists yet
    return { enabled: false, lastScanAt: null }
  }
  return config
}

export async function getRedditCommunities() {
  return await db.select().from(redditCommunities)
}

export async function toggleRedditEnabled(enabled: boolean) {
  await verifyAuth()
  const config = await getRedditConfig()
  
  // If there's an existing config, update it. Otherwise, create one.
  const [existing] = await db.select().from(redditConfig).limit(1)
  if (existing) {
    await db.update(redditConfig).set({ enabled })
  } else {
    await db.insert(redditConfig).values({ enabled })
  }
  revalidatePath("/")
}

import { normalizeSubreddit } from "@/lib/reddit-utils"

export async function addRedditCommunity(name: string) {
  await verifyAuth()
  const normalizedName = normalizeSubreddit(name)
  
  if (!normalizedName) {
    throw new Error("Invalid subreddit name")
  }

  // Check if it already exists to prevent duplicate constraint errors crashing
  const existing = await db.select().from(redditCommunities).where(eq(redditCommunities.name, normalizedName))
  
  if (existing.length === 0) {
    await db.insert(redditCommunities).values({ name: normalizedName })
    revalidatePath("/")
  }
}

export async function removeRedditCommunity(id: string) {
  await verifyAuth()
  await db.delete(redditCommunities).where(eq(redditCommunities.id, id))
  revalidatePath("/")
}
