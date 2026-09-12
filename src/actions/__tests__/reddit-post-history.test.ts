import { test, describe } from "node:test"
import assert from "node:assert"
import {
  RecordPostedCommentInputSchema,
  UpdatePostPerformanceInputSchema,
  LearningPatternItemSchema,
} from "../../lib/ai/schemas"
import {
  computePostingAnalytics,
  calculateObservationPeriod,
  PostedCommentRecord,
} from "../../lib/reddit-learning-service"
import {
  recordPostedComment,
  updatePostPerformance,
  deletePostedComment,
} from "../reddit-post-history-actions"

describe("Reddit Posting History & Performance Tracking Test Suite", () => {
  const mockPostSample: PostedCommentRecord = {
    id: "posted_1",
    opportunityId: "opp_1",
    commentDraftId: "draft_1",
    resumeReviewId: null,
    subreddit: "resumes",
    postTitle: "Why does Workday parse my resume into symbols?",
    postUrl: "https://reddit.com/r/resumes/comments/xyz123",
    postedUrl: "https://reddit.com/r/resumes/comments/xyz123/comment/abc789",
    postedAt: new Date("2026-09-01T10:00:00Z"),
    strategy: "PAIN",
    responseStyle: "VALUE_ONLY",
    topic: "ATS formatting",
    notes: "OP replied thanking for the single-column tip",
    aiDraft: "Pristine AI text: Switch to single column formatting to avoid parser scramble.",
    humanEditedDraft: "Human edit: Switch to clean single column plaintext formatting. Avoid tables.",
    finalPostedComment: "Final posted: Switch to clean single-column plain text to avoid tables scrambling in Workday.",
    upvotes: 12,
    replies: 4,
    profileVisits: 3,
    qurtesyClicks: 2,
    qurtesySessions: 2,
    builderStarts: 1,
    tailoringStarts: 1,
    otherProductActions: 0,
    lastMetricsUpdatedAt: new Date("2026-09-02T10:00:00Z"),
    createdAt: new Date("2026-09-01T10:00:00Z"),
    updatedAt: new Date("2026-09-02T10:00:00Z"),
  }

  // 1. Schema Validation & Version Preservation
  test("1. RecordPostedCommentInputSchema strictly requires and preserves all 3 versions", () => {
    const validPayload = {
      opportunityId: "opp_123",
      commentDraftId: "draft_456",
      subreddit: "resumes",
      postTitle: "Software Engineer resume feedback",
      postUrl: "https://reddit.com/r/resumes/comments/post1",
      postedUrl: "https://reddit.com/r/resumes/comments/post1/comment/comm1",
      postedAt: "2026-09-10T12:00:00Z",
      strategy: "RESUME_REVIEW",
      aiDraft: "1. AI initial draft",
      humanEditedDraft: "2. Human polished draft",
      finalPostedComment: "3. Final published comment on Reddit",
      notes: "Direct feedback on bullets",
    }

    const parsed = RecordPostedCommentInputSchema.parse(validPayload)
    assert.strictEqual(parsed.aiDraft, "1. AI initial draft")
    assert.strictEqual(parsed.humanEditedDraft, "2. Human polished draft")
    assert.strictEqual(parsed.finalPostedComment, "3. Final published comment on Reddit")
    assert.strictEqual(parsed.strategy, "RESUME_REVIEW")

    // Missing final comment must throw
    assert.throws(() => {
      RecordPostedCommentInputSchema.parse({
        ...validPayload,
        finalPostedComment: "",
      })
    })

    // Missing postedUrl must throw
    assert.throws(() => {
      RecordPostedCommentInputSchema.parse({
        ...validPayload,
        postedUrl: "",
      })
    })
  })

  // 2. Performance Tracking Schema
  test("2. UpdatePostPerformanceInputSchema validates all engagement and downstream conversion metrics", () => {
    const validMetrics = {
      id: "posted_1",
      upvotes: 25,
      replies: 8,
      profileVisits: 5,
      qurtesyClicks: 4,
      qurtesySessions: 3,
      builderStarts: 2,
      tailoringStarts: 1,
      otherProductActions: 1,
    }

    const parsed = UpdatePostPerformanceInputSchema.parse(validMetrics)
    assert.strictEqual(parsed.upvotes, 25)
    assert.strictEqual(parsed.replies, 8)
    assert.strictEqual(parsed.builderStarts, 2)
    assert.strictEqual(parsed.tailoringStarts, 1)

    // Negative numbers rejected
    assert.throws(() => {
      UpdatePostPerformanceInputSchema.parse({
        ...validMetrics,
        upvotes: -5,
      })
    })
  })

  // 3. Analytics Aggregation Logic
  test("3. computePostingAnalytics correctly aggregates metrics by subreddit, strategy, and funnel", () => {
    const post2: PostedCommentRecord = {
      ...mockPostSample,
      id: "posted_2",
      subreddit: "resumes",
      strategy: "RESUME_REVIEW",
      postedAt: new Date("2026-09-05T10:00:00Z"),
      upvotes: 18,
      replies: 6,
      builderStarts: 2,
      tailoringStarts: 2,
    }

    const post3: PostedCommentRecord = {
      ...mockPostSample,
      id: "posted_3",
      subreddit: "jobs",
      strategy: "PAIN",
      postedAt: new Date("2026-09-10T10:00:00Z"),
      upvotes: 5,
      replies: 2,
      builderStarts: 0,
      tailoringStarts: 0,
    }

    const analytics = computePostingAnalytics([mockPostSample, post2, post3])

    // Funnel asserts
    assert.strictEqual(analytics.funnel.totalPosts, 3)
    assert.strictEqual(analytics.funnel.totalUpvotes, 12 + 18 + 5) // 35
    assert.strictEqual(analytics.funnel.totalReplies, 4 + 6 + 2) // 12
    assert.strictEqual(analytics.funnel.totalBuilderStarts, 1 + 2 + 0) // 3
    assert.strictEqual(analytics.funnel.totalTailoringStarts, 1 + 2 + 0) // 3
    assert.strictEqual(analytics.funnel.totalConversions, 6)
    assert.strictEqual(analytics.funnel.conversionRatePercent, 200) // (6 conversions / 3 posts) * 100

    // Subreddit breakdown
    assert.strictEqual(analytics.bySubreddit.length, 2)
    const resumesSub = analytics.bySubreddit.find(s => s.subreddit === "resumes")
    assert.ok(resumesSub)
    assert.strictEqual(resumesSub.postCount, 2)
    assert.strictEqual(resumesSub.totalUpvotes, 30)
    assert.strictEqual(resumesSub.avgUpvotes, 15)
    assert.strictEqual(resumesSub.totalReplies, 10)
    assert.strictEqual(resumesSub.avgReplies, 5)

    // Strategy breakdown
    assert.strictEqual(analytics.byStrategy.length, 2)
    const reviewStrat = analytics.byStrategy.find(s => s.strategy === "RESUME_REVIEW")
    assert.ok(reviewStrat)
    assert.strictEqual(reviewStrat.postCount, 1)
    assert.strictEqual(reviewStrat.actionRatePerPost, 4) // 2 builder + 2 tailoring
  })

  // 4. Sample Size Guardrails in Learning Synthesis
  test("4. Sample size guardrail strictly flags < 3 posts as INSUFFICIENT_DATA with caution", () => {
    const singlePost = [mockPostSample]
    const analytics = computePostingAnalytics(singlePost)

    assert.strictEqual(analytics.learnings.length, 1)
    const learning = analytics.learnings[0]
    assert.strictEqual(learning.evidenceStrength, "INSUFFICIENT_DATA")
    assert.strictEqual(learning.sampleSize, 1)
    assert.ok(learning.confidence <= 50)
    assert.ok(learning.dataSummary.includes("Minimum 3 posts required"))
  })

  // 5. Emerging and Statistically Reliable Learning Patterns
  test("5. Generates EMERGING and STATISTICALLY_RELIABLE patterns with calculated confidence when n >= 3", () => {
    // Generate 6 posts for RESUME_REVIEW (high replies) and 5 posts for PAIN (low replies)
    const records: PostedCommentRecord[] = []

    for (let i = 0; i < 6; i++) {
      records.push({
        ...mockPostSample,
        id: `rr_${i}`,
        strategy: "RESUME_REVIEW",
        postedAt: new Date(2026, 8, 1 + i),
        upvotes: 20,
        replies: 8, // Average 8 replies
        builderStarts: 2,
        tailoringStarts: 1,
      })
    }

    for (let j = 0; j < 5; j++) {
      records.push({
        ...mockPostSample,
        id: `pain_${j}`,
        strategy: "PAIN",
        postedAt: new Date(2026, 8, 7 + j),
        upvotes: 10,
        replies: 2, // Average 2 replies
        builderStarts: 0,
        tailoringStarts: 0,
      })
    }

    const analytics = computePostingAnalytics(records)
    assert.ok(analytics.learnings.length >= 2)

    // Find strategy comparison learning
    const stratLearning = analytics.learnings.find(l => l.category === "STRATEGY_ENGAGEMENT")
    assert.ok(stratLearning, "Expected STRATEGY_ENGAGEMENT learning to be synthesized")
    assert.strictEqual(stratLearning.evidenceStrength, "STATISTICALLY_RELIABLE")
    assert.ok(stratLearning.confidence >= 85)
    assert.ok(stratLearning.sampleSize >= 11)
    assert.ok(stratLearning.pattern.includes("RESUME REVIEW responses generate 4.0x more candidate replies"))

    // Validate with Zod schema
    const validated = LearningPatternItemSchema.parse(stratLearning)
    assert.strictEqual(validated.evidenceStrength, "STATISTICALLY_RELIABLE")
  })

  // 6. Observation Period Calculation
  test("6. calculateObservationPeriod accurately computes span in days between earliest and latest post", () => {
    const p1: PostedCommentRecord = {
      ...mockPostSample,
      postedAt: new Date("2026-09-01T00:00:00Z"),
    }
    const p2: PostedCommentRecord = {
      ...mockPostSample,
      postedAt: new Date("2026-09-15T00:00:00Z"),
    }

    const period = calculateObservationPeriod([p1, p2])
    assert.ok(period.includes("14 days") || period.includes("Sep 1") && period.includes("Sep 15"))

    // Single post period
    const singlePeriod = calculateObservationPeriod([p1])
    assert.ok(singlePeriod.includes("Single observation"))
  })

  // 7. Primacy of Real Product Conversions over Vanity Metrics
  test("7. Growth funnel tracks real product action starts distinctly from social upvotes", () => {
    const postWithConversions: PostedCommentRecord = {
      ...mockPostSample,
      upvotes: 100, // High vanity
      replies: 20,
      builderStarts: 5, // High product action
      tailoringStarts: 4,
    }

    const analytics = computePostingAnalytics([postWithConversions])
    assert.strictEqual(analytics.funnel.totalUpvotes, 100)
    assert.strictEqual(analytics.funnel.totalBuilderStarts, 5)
    assert.strictEqual(analytics.funnel.totalTailoringStarts, 4)
    assert.strictEqual(analytics.funnel.totalConversions, 9)
  })

  // 8. Server Actions Authorization Verification
  test("8. Server actions strictly verify authorization before persisting or updating posts", async () => {
    await assert.rejects(async () => {
      await recordPostedComment({
        subreddit: "resumes",
        postTitle: "Title",
        postUrl: "https://reddit.com/r/resumes/comments/xyz",
        postedUrl: "https://reddit.com/r/resumes/comments/xyz/comment/abc",
        postedAt: new Date(),
        strategy: "PAIN",
        finalPostedComment: "Comment",
      })
    }, {
      message: /Unauthorized/,
    })

    await assert.rejects(async () => {
      await updatePostPerformance({
        id: "mock_id",
        upvotes: 10,
        replies: 2,
        profileVisits: 1,
        qurtesyClicks: 1,
        qurtesySessions: 1,
        builderStarts: 1,
        tailoringStarts: 1,
        otherProductActions: 0,
      })
    }, {
      message: /Unauthorized/,
    })

    await assert.rejects(async () => {
      await deletePostedComment("mock_id")
    }, {
      message: /Unauthorized/,
    })
  })
})
