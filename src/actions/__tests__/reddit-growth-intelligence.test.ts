import { test, describe } from "node:test"
import assert from "node:assert"
import {
  RedditGrowthInsightItemSchema,
  RedditGrowthIntelligencePayloadSchema,
} from "../../lib/ai/schemas"
import {
  synthesizeRedditGrowthIntelligence,
  OpportunityWithRawPost,
} from "../../lib/reddit-growth-intelligence-service"
import {
  buildRedditGrowthIntelligenceSystemPrompt,
  formatOpportunitiesForSynthesis,
} from "../../lib/ai/prompts/reddit-growth-prompts"
import { INTELLIGENCE_PROMPT } from "../../lib/ai/prompts/intelligence"

describe("Reddit → Growth Intelligence Integration Test Suite", () => {
  // 1. Sample size guardrail
  test("1. Sample size guardrail strictly prevents single-post observations from being labeled 'Repeated'", () => {
    // 1a. Single post with 'Repeated' must fail validation
    const singlePostRepeated = {
      theme: "ATS column scramble",
      category: "RECURRING_PAIN" as const,
      evidenceStatus: "Repeated" as const,
      frequency: 1, // Invalid for Repeated!
      confidence: 85,
      naturalLanguage: ["scrambled my headers"],
      recommendedAction: "Highlight single-column builder",
      sourcePostIds: ["post_1"],
    }

    const invalidResult = RedditGrowthInsightItemSchema.safeParse(singlePostRepeated)
    assert.strictEqual(invalidResult.success, false)
    if (!invalidResult.success) {
      assert.ok(
        invalidResult.error.issues.some(i =>
          i.message.includes("Repeated status requires at least 3 supporting posts")
        )
      )
    }

    // 1b. 3 posts with 'Repeated' must pass validation
    const threePostsRepeated = {
      ...singlePostRepeated,
      frequency: 3,
      sourcePostIds: ["post_1", "post_2", "post_3"],
    }
    const validResult = RedditGrowthInsightItemSchema.safeParse(threePostsRepeated)
    assert.strictEqual(validResult.success, true)
  })

  // 2. Evidence status mapping
  test("2. Evidence status maps appropriately across Repeated, Emerging, Observed, and Hypothesis", () => {
    const statuses = [
      { status: "Repeated", freq: 4 },
      { status: "Emerging", freq: 2 },
      { status: "Observed", freq: 1 },
      { status: "Hypothesis", freq: 1 },
    ] as const

    for (const item of statuses) {
      const payload = {
        theme: `Theme for ${item.status}`,
        category: "EMERGING_THEME" as const,
        evidenceStatus: item.status,
        frequency: item.freq,
        confidence: 80,
        naturalLanguage: ["authentic quote"],
        recommendedAction: "Actionable recommendation",
        sourcePostIds: ["p1"],
      }

      const parsed = RedditGrowthInsightItemSchema.safeParse(payload)
      assert.strictEqual(parsed.success, true)
    }
  })

  // 3. Distinction: Individual Opportunity vs Reusable Growth Intelligence
  test("3. System prompt enforces distinction between single threads and reusable intelligence", () => {
    const prompt = buildRedditGrowthIntelligenceSystemPrompt("Test product context")
    assert.ok(prompt.includes("CORE DISTINCTION"))
    assert.ok(prompt.includes("Individual Opportunity"))
    assert.ok(prompt.includes("Growth Intelligence"))
    assert.ok(prompt.includes("reusable intelligence, NOT a regurgitation of single threads"))
    assert.ok(prompt.includes("RECURRING_PAIN"))
    assert.ok(prompt.includes("NATURAL USER LANGUAGE"))
  })

  // 4. Source traceability back to original Reddit discussion
  test("4. Retains source traceability with postId, subreddit, and permalink for every insight", async () => {
    const mockOpportunities: OpportunityWithRawPost[] = [
      {
        id: "opp_1",
        postId: "post_101",
        opportunityType: "PAIN",
        priority: "HIGH",
        opportunityScore: 88,
        painScore: 9,
        intentScore: 8,
        relevanceScore: 9,
        helpfulnessScore: 8,
        recommendedAngle: "Offer ATS table guidelines",
        rawPost: {
          redditPostId: "t3_abc1",
          subreddit: "resumes",
          title: "ATS keeps scrambling my two-column layout",
          body: "Applied to 50 jobs and discovered my PDF was parsed as random gibberish.",
          permalink: "/r/resumes/comments/abc1/ats_keeps_scrambling/",
          author: "frustrated_dev",
          createdUtc: new Date("2026-09-13T02:00:00Z"),
        },
      },
      {
        id: "opp_2",
        postId: "post_102",
        opportunityType: "PAIN",
        priority: "HIGH",
        opportunityScore: 82,
        painScore: 8,
        intentScore: 8,
        relevanceScore: 9,
        helpfulnessScore: 8,
        recommendedAngle: "Recommend single-column format",
        rawPost: {
          redditPostId: "t3_abc2",
          subreddit: "jobs",
          title: "Workday destroyed my resume formatting",
          body: "Tables turned into unreadable characters.",
          permalink: "/r/jobs/comments/abc2/workday_destroyed_my_resume/",
          author: "jobseeker99",
          createdUtc: new Date("2026-09-13T03:00:00Z"),
        },
      },
    ]

    const result = await synthesizeRedditGrowthIntelligence(mockOpportunities)

    assert.ok(result.insights.length > 0)
    const firstInsight = result.insights[0]

    // Verify source traceability
    assert.ok(firstInsight.sources.length > 0)
    const src = firstInsight.sources[0]
    assert.strictEqual(src.postId, "post_101")
    assert.strictEqual(src.subreddit, "resumes")
    assert.strictEqual(src.permalink, "/r/resumes/comments/abc1/ats_keeps_scrambling/")
    assert.strictEqual(src.title, "ATS keeps scrambling my two-column layout")
  })

  // 5. Schema validation rejects malformed payload
  test("5. Payload schema rejects invalid data structures and out-of-range confidence", () => {
    // 5a. Confidence > 100 rejected
    const invalidConfidence = RedditGrowthInsightItemSchema.safeParse({
      theme: "Theme",
      category: "RECURRING_PAIN",
      evidenceStatus: "Observed",
      frequency: 1,
      confidence: 150, // Invalid > 100
      naturalLanguage: ["quote"],
      recommendedAction: "Action",
      sourcePostIds: ["p1"],
    })
    assert.strictEqual(invalidConfidence.success, false)

    // 5b. Empty naturalLanguage array rejected
    const emptyQuotes = RedditGrowthInsightItemSchema.safeParse({
      theme: "Theme",
      category: "RECURRING_PAIN",
      evidenceStatus: "Observed",
      frequency: 1,
      confidence: 80,
      naturalLanguage: [], // Invalid min(1)
      recommendedAction: "Action",
      sourcePostIds: ["p1"],
    })
    assert.strictEqual(emptyQuotes.success, false)
  })

  // 6. Existing sources backward compatibility (Zero Reddit opportunities)
  test("6. Gracefully handles dataset with zero active Reddit opportunities", async () => {
    const emptyDataset: OpportunityWithRawPost[] = []
    const result = await synthesizeRedditGrowthIntelligence(emptyDataset)

    assert.strictEqual(result.insights.length, 0)
    assert.ok(result.summary.includes("No active Reddit opportunities"))

    // Also test with only IGNORE opportunities
    const onlyIgnored: OpportunityWithRawPost[] = [
      {
        id: "opp_ig",
        postId: "p_ig",
        opportunityType: "IGNORE",
        priority: "IGNORE",
        opportunityScore: 0,
        painScore: 0,
        intentScore: 0,
        relevanceScore: 0,
        helpfulnessScore: 0,
        recommendedAngle: "Ignored",
        rawPost: {
          redditPostId: "t3_bot",
          subreddit: "jobs",
          title: "Weekly discussion bot thread",
          permalink: "/r/jobs/comments/bot/weekly/",
          createdUtc: new Date(),
        },
      },
    ]

    const resultIgnored = await synthesizeRedditGrowthIntelligence(onlyIgnored)
    assert.strictEqual(resultIgnored.insights.length, 0)
  })

  // 7. Cross-source prompt integration
  test("7. Cross-source prompt integrates Reddit community signals with SEO, Product, and Job Trends", () => {
    assert.ok(INTELLIGENCE_PROMPT.includes("Reddit Growth Intelligence"))
    assert.ok(INTELLIGENCE_PROMPT.includes("Key Source Synergy"))
    assert.ok(INTELLIGENCE_PROMPT.includes("# 3. Reddit Community Signals & User Vocabulary"))
    assert.ok(INTELLIGENCE_PROMPT.includes("Do NOT present hypotheses as established facts"))

    const formatted = formatOpportunitiesForSynthesis([
      {
        id: "post_1",
        subreddit: "jobs",
        title: "Test title",
        body: "Test body",
        opportunityType: "PAIN",
        painScore: 8,
        intentScore: 7,
        recommendedAngle: "Provide ATS tips",
        permalink: "/r/jobs/1",
      },
    ])

    assert.ok(formatted.includes("<reddit_opportunities_dataset>"))
    assert.ok(formatted.includes("Pain: 8/10"))
    assert.ok(formatted.includes("Intent: 7/10"))
    assert.ok(formatted.includes("Provide ATS tips"))
  })
})
