"use server"

import { db } from "@/lib/db"
import { dataSourceSnapshots, growthIntelligence } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { INTELLIGENCE_PROMPT } from "@/lib/ai/prompts/intelligence"

export async function getLatestDataSourceSnapshot() {
  const [snapshot] = await db.select().from(dataSourceSnapshots).orderBy(desc(dataSourceSnapshots.createdAt)).limit(1)
  return snapshot
}

export async function getLatestIntelligence() {
  const [intel] = await db.select().from(growthIntelligence).orderBy(desc(growthIntelligence.createdAt)).limit(1)
  return intel
}

export async function saveDataSources(formData: FormData) {
  const productUpdates = formData.get("productUpdates") as string
  const seoData = formData.get("seoData") as string
  const experiments = formData.get("experiments") as string
  const userPainPoints = formData.get("userPainPoints") as string
  const jobTrends = formData.get("jobTrends") as string

  await db.insert(dataSourceSnapshots).values({
    productUpdates,
    seoData,
    experiments,
    userPainPoints,
    jobTrends,
  })

  revalidatePath("/")
}

export async function generateIntelligence() {
  const snapshot = await getLatestDataSourceSnapshot()
  if (!snapshot) throw new Error("No data sources found to generate intelligence from.")

  // Fallback if there are no Google keys
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn("No GOOGLE_GENERATIVE_AI_API_KEY found, using mock data for generation.")
    await db.insert(growthIntelligence).values({
      snapshotId: snapshot.id,
      content: "# Mock Intelligence\n\nPlease add a Google API key to generate real intelligence from the data sources.",
    })
    revalidatePath("/")
    return
  }

  const { text } = await generateText({
    model: google("gemini-3.5-flash-lite"),
    system: INTELLIGENCE_PROMPT,
    prompt: `
Raw Data Sources:

--- PRODUCT UPDATES ---
${snapshot.productUpdates || "None"}

--- SEO DATA ---
${snapshot.seoData || "None"}

--- EXPERIMENTS ---
${snapshot.experiments || "None"}

--- USER PAIN POINTS ---
${snapshot.userPainPoints || "None"}

--- JOB TRENDS ---
${snapshot.jobTrends || "None"}
    `
  })

  await db.insert(growthIntelligence).values({
    snapshotId: snapshot.id,
    content: text,
  })

  revalidatePath("/")
}
