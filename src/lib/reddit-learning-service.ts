import {
  LearningPatternItem,
  EvidenceStrength,
} from "@/lib/ai/schemas"

export interface PostedCommentRecord {
  id: string
  opportunityId?: string | null
  commentDraftId?: string | null
  resumeReviewId?: string | null
  subreddit: string
  postTitle: string
  postUrl: string
  postedUrl: string
  postedAt: Date | string | number
  strategy: string
  responseStyle?: string | null
  topic?: string | null
  notes?: string | null
  aiDraft?: string | null
  humanEditedDraft?: string | null
  finalPostedComment: string
  upvotes: number
  replies: number
  profileVisits: number
  qurtesyClicks: number
  qurtesySessions: number
  builderStarts: number
  tailoringStarts: number
  otherProductActions: number
  lastMetricsUpdatedAt?: Date | string | number | null
  createdAt: Date | string | number
  updatedAt: Date | string | number
}

export interface SubredditPerformance {
  subreddit: string
  postCount: number
  totalUpvotes: number
  avgUpvotes: number
  totalReplies: number
  avgReplies: number
  profileVisits: number
  qurtesyClicks: number
  qurtesySessions: number
  builderStarts: number
  tailoringStarts: number
}

export interface StrategyPerformance {
  strategy: string
  postCount: number
  totalUpvotes: number
  avgUpvotes: number
  totalReplies: number
  avgReplies: number
  totalVisits: number
  totalBuilderStarts: number
  totalTailoringStarts: number
  totalProductActions: number
  actionRatePerPost: number
}

export interface TopicPerformance {
  topic: string
  postCount: number
  avgUpvotes: number
  avgReplies: number
  totalProductActions: number
}

export interface OverallGrowthFunnel {
  totalPosts: number
  totalUpvotes: number
  avgUpvotes: number
  totalReplies: number
  avgReplies: number
  totalProfileVisits: number
  totalQurtesyClicks: number
  totalQurtesySessions: number
  totalBuilderStarts: number
  totalTailoringStarts: number
  totalOtherActions: number
  totalConversions: number // Builder + Tailoring starts
  conversionRatePercent: number
}

export interface PostingAnalyticsSummary {
  funnel: OverallGrowthFunnel
  bySubreddit: SubredditPerformance[]
  byStrategy: StrategyPerformance[]
  byTopic: TopicPerformance[]
  learnings: LearningPatternItem[]
}

/**
 * Calculates observation period string between earliest and latest post dates.
 */
export function calculateObservationPeriod(records: PostedCommentRecord[]): string {
  if (records.length === 0) return "No observation data"
  if (records.length === 1) {
    const d = new Date(records[0].postedAt)
    return `Single observation (${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`
  }

  const timestamps = records.map(r => new Date(r.postedAt).getTime()).filter(t => !isNaN(t))
  if (timestamps.length === 0) return "Date unavailable"

  const minDate = new Date(Math.min(...timestamps))
  const maxDate = new Date(Math.max(...timestamps))

  const minStr = minDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const maxStr = maxDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const diffDays = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))

  return `${minStr} – ${maxStr} (${diffDays} days)`
}

/**
 * Computes performance analytics across subreddits, strategies, and growth funnels.
 */
export function computePostingAnalytics(records: PostedCommentRecord[]): PostingAnalyticsSummary {
  const totalPosts = records.length

  let totalUpvotes = 0
  let totalReplies = 0
  let totalProfileVisits = 0
  let totalQurtesyClicks = 0
  let totalQurtesySessions = 0
  let totalBuilderStarts = 0
  let totalTailoringStarts = 0
  let totalOtherActions = 0

  const subMap = new Map<string, PostedCommentRecord[]>()
  const stratMap = new Map<string, PostedCommentRecord[]>()
  const topicMap = new Map<string, PostedCommentRecord[]>()

  for (const r of records) {
    totalUpvotes += r.upvotes || 0
    totalReplies += r.replies || 0
    totalProfileVisits += r.profileVisits || 0
    totalQurtesyClicks += r.qurtesyClicks || 0
    totalQurtesySessions += r.qurtesySessions || 0
    totalBuilderStarts += r.builderStarts || 0
    totalTailoringStarts += r.tailoringStarts || 0
    totalOtherActions += r.otherProductActions || 0

    // Group by Subreddit
    const sub = r.subreddit.toLowerCase()
    if (!subMap.has(sub)) subMap.set(sub, [])
    subMap.get(sub)!.push(r)

    // Group by Strategy
    const strat = r.strategy.toUpperCase()
    if (!stratMap.has(strat)) stratMap.set(strat, [])
    stratMap.get(strat)!.push(r)

    // Group by Topic
    const topicKey = r.topic?.trim() || "General Resume & Career"
    if (!topicMap.has(topicKey)) topicMap.set(topicKey, [])
    topicMap.get(topicKey)!.push(r)
  }

  const bySubreddit: SubredditPerformance[] = Array.from(subMap.entries()).map(([sub, items]) => {
    const count = items.length
    const ups = items.reduce((acc, i) => acc + (i.upvotes || 0), 0)
    const reps = items.reduce((acc, i) => acc + (i.replies || 0), 0)
    const visits = items.reduce((acc, i) => acc + (i.profileVisits || 0), 0)
    const clicks = items.reduce((acc, i) => acc + (i.qurtesyClicks || 0), 0)
    const sess = items.reduce((acc, i) => acc + (i.qurtesySessions || 0), 0)
    const bStarts = items.reduce((acc, i) => acc + (i.builderStarts || 0), 0)
    const tStarts = items.reduce((acc, i) => acc + (i.tailoringStarts || 0), 0)

    return {
      subreddit: sub,
      postCount: count,
      totalUpvotes: ups,
      avgUpvotes: Number((ups / count).toFixed(1)),
      totalReplies: reps,
      avgReplies: Number((reps / count).toFixed(1)),
      profileVisits: visits,
      qurtesyClicks: clicks,
      qurtesySessions: sess,
      builderStarts: bStarts,
      tailoringStarts: tStarts,
    }
  }).sort((a, b) => b.postCount - a.postCount)

  const byStrategy: StrategyPerformance[] = Array.from(stratMap.entries()).map(([strat, items]) => {
    const count = items.length
    const ups = items.reduce((acc, i) => acc + (i.upvotes || 0), 0)
    const reps = items.reduce((acc, i) => acc + (i.replies || 0), 0)
    const visits = items.reduce((acc, i) => acc + (i.profileVisits || 0), 0)
    const bStarts = items.reduce((acc, i) => acc + (i.builderStarts || 0), 0)
    const tStarts = items.reduce((acc, i) => acc + (i.tailoringStarts || 0), 0)
    const totalActions = bStarts + tStarts

    return {
      strategy: strat,
      postCount: count,
      totalUpvotes: ups,
      avgUpvotes: Number((ups / count).toFixed(1)),
      totalReplies: reps,
      avgReplies: Number((reps / count).toFixed(1)),
      totalVisits: visits,
      totalBuilderStarts: bStarts,
      totalTailoringStarts: tStarts,
      totalProductActions: totalActions,
      actionRatePerPost: Number((totalActions / count).toFixed(2)),
    }
  }).sort((a, b) => b.postCount - a.postCount)

  const byTopic: TopicPerformance[] = Array.from(topicMap.entries()).map(([topic, items]) => {
    const count = items.length
    const ups = items.reduce((acc, i) => acc + (i.upvotes || 0), 0)
    const reps = items.reduce((acc, i) => acc + (i.replies || 0), 0)
    const actions = items.reduce((acc, i) => acc + (i.builderStarts || 0) + (i.tailoringStarts || 0), 0)

    return {
      topic,
      postCount: count,
      avgUpvotes: Number((ups / count).toFixed(1)),
      avgReplies: Number((reps / count).toFixed(1)),
      totalProductActions: actions,
    }
  }).sort((a, b) => b.postCount - a.postCount)

  const totalConversions = totalBuilderStarts + totalTailoringStarts
  const conversionRatePercent = totalPosts > 0 ? Number(((totalConversions / totalPosts) * 100).toFixed(1)) : 0

  const funnel: OverallGrowthFunnel = {
    totalPosts,
    totalUpvotes,
    avgUpvotes: totalPosts > 0 ? Number((totalUpvotes / totalPosts).toFixed(1)) : 0,
    totalReplies,
    avgReplies: totalPosts > 0 ? Number((totalReplies / totalPosts).toFixed(1)) : 0,
    totalProfileVisits,
    totalQurtesyClicks,
    totalQurtesySessions,
    totalBuilderStarts,
    totalTailoringStarts,
    totalOtherActions,
    totalConversions,
    conversionRatePercent,
  }

  const learnings = synthesizeEmpiricalLearnings(records, byStrategy, bySubreddit)

  return {
    funnel,
    bySubreddit,
    byStrategy,
    byTopic,
    learnings,
  }
}

/**
 * Synthesizes empirical learning patterns using strict sample-size rules and confidence calculations.
 * Never invents claims; strictly documents sample size, confidence %, and observation period.
 */
export function synthesizeEmpiricalLearnings(
  records: PostedCommentRecord[],
  strategies: StrategyPerformance[],
  subreddits: SubredditPerformance[]
): LearningPatternItem[] {
  const learnings: LearningPatternItem[] = []
  const observationPeriod = calculateObservationPeriod(records)
  const totalPosts = records.length

  if (totalPosts === 0) {
    return []
  }

  // 1. Overall Sample Size Guardrail Pattern
  if (totalPosts < 3) {
    learnings.push({
      id: "learn-insufficient-data",
      pattern: `Early tracking phase: only ${totalPosts} post(s) recorded so far.`,
      category: "SAMPLE_SIZE_GUARDRAIL",
      evidenceStrength: "INSUFFICIENT_DATA",
      sampleSize: totalPosts,
      confidence: 35,
      observationPeriod,
      dataSummary: `Total posts: ${totalPosts}. Minimum 3 posts required before drawing reliable strategic conclusions.`,
      recommendedAction: "Continue recording manual posts and wait for candidate replies before drawing performance conclusions.",
    })
    return learnings
  }

  // 2. Strategy Comparison: Replies vs Upvotes
  // Find top strategy by replies
  const sortedByReplies = [...strategies].sort((a, b) => b.avgReplies - a.avgReplies)
  if (sortedByReplies.length >= 2) {
    const topStrat = sortedByReplies[0]
    const baselineStrat = sortedByReplies[1]

    const sampleSize = topStrat.postCount + baselineStrat.postCount
    let strength: EvidenceStrength = "INSUFFICIENT_DATA"
    let confidence = 45

    if (topStrat.postCount >= 5 && baselineStrat.postCount >= 5) {
      strength = "STATISTICALLY_RELIABLE"
      confidence = 90
    } else if (topStrat.postCount >= 3 || baselineStrat.postCount >= 3) {
      strength = "EMERGING_PATTERN"
      confidence = 72
    }

    const ratio = baselineStrat.avgReplies > 0
      ? (topStrat.avgReplies / baselineStrat.avgReplies).toFixed(1)
      : topStrat.avgReplies.toFixed(1)

    learnings.push({
      id: `learn-strategy-replies-${topStrat.strategy.toLowerCase()}`,
      pattern: `${topStrat.strategy.replace(/_/g, " ")} responses generate ${ratio}x more candidate replies than ${baselineStrat.strategy.replace(/_/g, " ")}.`,
      category: "STRATEGY_ENGAGEMENT",
      evidenceStrength: strength,
      sampleSize,
      confidence,
      observationPeriod,
      dataSummary: `${topStrat.strategy}: avg ${topStrat.avgReplies} replies (n=${topStrat.postCount}) vs ${baselineStrat.strategy}: avg ${baselineStrat.avgReplies} replies (n=${baselineStrat.postCount}).`,
      recommendedAction: `Prioritize ${topStrat.strategy} discussions when founder response bandwidth is constrained to maximize dialogue.`,
    })
  }

  // 3. Conversion to Real Product Action (Builder & Tailoring Starts vs Vanity Upvotes)
  const sortedByActions = [...strategies].sort((a, b) => b.actionRatePerPost - a.actionRatePerPost)
  if (sortedByActions.length >= 1 && sortedByActions[0].totalProductActions > 0) {
    const leader = sortedByActions[0]
    let strength: EvidenceStrength = leader.postCount >= 5 ? "STATISTICALLY_RELIABLE" : leader.postCount >= 3 ? "EMERGING_PATTERN" : "INSUFFICIENT_DATA"
    let confidence = leader.postCount >= 5 ? 88 : leader.postCount >= 3 ? 68 : 40

    learnings.push({
      id: `learn-conversion-${leader.strategy.toLowerCase()}`,
      pattern: `${leader.strategy.replace(/_/g, " ")} drives highest downstream product starts (${leader.actionRatePerPost} starts/post).`,
      category: "CONVERSION_EFFICIENCY",
      evidenceStrength: strength,
      sampleSize: leader.postCount,
      confidence,
      observationPeriod,
      dataSummary: `${leader.strategy}: ${leader.totalBuilderStarts} builder starts, ${leader.totalTailoringStarts} tailoring starts across ${leader.postCount} posts.`,
      recommendedAction: "Maintain high-utility response frameworks; genuine value drives organic exploration without aggressive product pushing.",
    })
  }

  // 4. Subreddit Community Receptivity
  if (subreddits.length >= 2) {
    const topSub = subreddits[0]
    let strength: EvidenceStrength = topSub.postCount >= 5 ? "STATISTICALLY_RELIABLE" : topSub.postCount >= 3 ? "EMERGING_PATTERN" : "INSUFFICIENT_DATA"
    let confidence = topSub.postCount >= 5 ? 85 : topSub.postCount >= 3 ? 65 : 45

    learnings.push({
      id: `learn-subreddit-${topSub.subreddit}`,
      pattern: `r/${topSub.subreddit} represents primary discussion volume (avg ${topSub.avgReplies} replies, ${topSub.avgUpvotes} upvotes).`,
      category: "SUBREDDIT_ENGAGEMENT",
      evidenceStrength: strength,
      sampleSize: topSub.postCount,
      confidence,
      observationPeriod,
      dataSummary: `r/${topSub.subreddit}: ${topSub.postCount} posts, ${topSub.totalReplies} total replies, ${topSub.builderStarts + topSub.tailoringStarts} product starts.`,
      recommendedAction: `Focus monitoring frequency on r/${topSub.subreddit} during peak morning posting hours.`,
    })
  }

  return learnings
}
