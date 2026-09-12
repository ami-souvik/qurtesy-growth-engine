"use server"

import { db } from "@/lib/db"
import { dataSourceSnapshots, growthIntelligence, redditOpportunities, redditPosts, redditGrowthInsights } from "@/db/schema"
import { desc, eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { INTELLIGENCE_PROMPT } from "@/lib/ai/prompts/intelligence"
import { synthesizeRedditGrowthIntelligence, OpportunityWithRawPost } from "@/lib/reddit-growth-intelligence-service"

export async function getLatestDataSourceSnapshot() {
  const [snapshot] = await db.select().from(dataSourceSnapshots).orderBy(desc(dataSourceSnapshots.createdAt)).limit(1)
  return snapshot
}

export async function getLatestIntelligence() {
  const [intel] = await db.select().from(growthIntelligence).orderBy(desc(growthIntelligence.createdAt)).limit(1)
  return intel
}

export interface ParsedRedditGrowthInsight {
  id: string
  growthIntelligenceId: string | null
  theme: string
  category: "RECURRING_PAIN" | "EMERGING_THEME" | "OPPORTUNITY_CLUSTER" | "FEATURE_REQUEST"
  evidenceStatus: "Repeated" | "Emerging" | "Observed" | "Hypothesis"
  frequency: number
  confidence: number
  naturalLanguage: string[]
  recommendedAction: string
  lastObservedAt: Date | string | number
  sources: Array<{
    postId: string
    title: string
    subreddit: string
    permalink: string
  }>
  createdAt: Date | string | number
}

export async function getLatestRedditGrowthInsights(): Promise<ParsedRedditGrowthInsight[]> {
  const rawInsights = await db
    .select()
    .from(redditGrowthInsights)
    .orderBy(desc(redditGrowthInsights.lastObservedAt))
    .limit(20)

  return rawInsights.map(r => {
    let naturalLanguage: string[] = []
    let sources: Array<{ postId: string; title: string; subreddit: string; permalink: string }> = []

    try {
      naturalLanguage = JSON.parse(r.naturalLanguage)
    } catch {
      naturalLanguage = [r.naturalLanguage]
    }

    try {
      sources = JSON.parse(r.sources)
    } catch {
      sources = []
    }

    return {
      id: r.id,
      growthIntelligenceId: r.growthIntelligenceId,
      theme: r.theme,
      category: r.category as any,
      evidenceStatus: r.evidenceStatus as any,
      frequency: r.frequency,
      confidence: r.confidence,
      naturalLanguage,
      recommendedAction: r.recommendedAction,
      lastObservedAt: r.lastObservedAt,
      sources,
      createdAt: r.createdAt,
    }
  })
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

  // 1. Fetch active, classified Reddit opportunities (strict architecture: only classified intelligence, never raw dump)
  const activeOpportunities = (await db
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
      recommendedAngle: redditOpportunities.recommendedAngle,
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
    .where(ne(redditOpportunities.opportunityType, "IGNORE"))
    .orderBy(desc(redditOpportunities.opportunityScore))
    .limit(30)) as unknown as OpportunityWithRawPost[]

  // 2. Synthesize structured Reddit growth insights
  let redditGrowthSection = "No classified Reddit opportunities available yet."
  let redditResult: Awaited<ReturnType<typeof synthesizeRedditGrowthIntelligence>> | null = null

  if (activeOpportunities.length > 0) {
    try {
      redditResult = await synthesizeRedditGrowthIntelligence(activeOpportunities)
      redditGrowthSection = `
Summary of Reddit Signals:
${redditResult.summary}

Observed Community Themes & Natural User Vocabulary:
${redditResult.insights
  .map(
    i => `
- [${i.evidenceStatus}] ${i.theme} (Category: ${i.category}, Evidence: ${i.frequency} posts, Confidence: ${i.confidence}%)
  User Phrasing: ${i.naturalLanguage.map(q => `"${q}"`).join(", ")}
  Recommended Action: ${i.recommendedAction}`
  )
  .join("\n")}
      `.trim()
    } catch (err) {
      console.error("Failed synthesizing Reddit growth section:", err)
    }
  }

  // 3. Fallback if no Google AI key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn("No GOOGLE_GENERATIVE_AI_API_KEY found, using mock data for generation.")
    const mockId = crypto.randomUUID()
    await db.insert(growthIntelligence).values({
      id: mockId,
      snapshotId: snapshot.id,
      content: `# Growth Intelligence (Mock)\n\n## 1. Normalized Summary\nData sources combined with ${activeOpportunities.length} Reddit discussions.\n\n## 2. Key Patterns & Trends\n- ATS table parsing friction recurring across job seekers.\n\n## 3. Reddit Signals\n${redditGrowthSection}`,
    })

    if (redditResult?.insights && redditResult.insights.length > 0) {
      for (const insight of redditResult.insights) {
        await db.insert(redditGrowthInsights).values({
          growthIntelligenceId: mockId,
          theme: insight.theme,
          category: insight.category,
          evidenceStatus: insight.evidenceStatus,
          frequency: insight.frequency,
          confidence: insight.confidence,
          naturalLanguage: JSON.stringify(insight.naturalLanguage),
          recommendedAction: insight.recommendedAction,
          lastObservedAt: insight.lastObservedAt,
          sources: JSON.stringify(insight.sources),
        })
      }
    }

    revalidatePath("/")
    return
  }

  // 4. Generate overall cross-source intelligence with Google Gemini 3.6 Flash
  const { text } = await generateText({
    model: google("gemini-3.6-flash"),
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

--- REDDIT GROWTH INTELLIGENCE ---
${redditGrowthSection}
    `,
  })

  const newIntelId = crypto.randomUUID()

  await db.insert(growthIntelligence).values({
    id: newIntelId,
    snapshotId: snapshot.id,
    content: text,
  })

  // 5. Store structured Reddit growth insights linked to this generation
  if (redditResult?.insights && redditResult.insights.length > 0) {
    for (const insight of redditResult.insights) {
      await db.insert(redditGrowthInsights).values({
        growthIntelligenceId: newIntelId,
        theme: insight.theme,
        category: insight.category,
        evidenceStatus: insight.evidenceStatus,
        frequency: insight.frequency,
        confidence: insight.confidence,
        naturalLanguage: JSON.stringify(insight.naturalLanguage),
        recommendedAction: insight.recommendedAction,
        lastObservedAt: insight.lastObservedAt,
        sources: JSON.stringify(insight.sources),
      })
    }
  }

  revalidatePath("/")
}

