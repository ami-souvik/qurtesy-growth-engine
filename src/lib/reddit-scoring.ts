export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW" | "IGNORE"
export type OpportunityType = "PAIN" | "GIVEAWAY" | "RESUME_REVIEW" | "ANTI_FAKE_AI" | "IGNORE"
export type PromotionalRisk = "LOW" | "MEDIUM" | "HIGH"

export interface ScoringInputs {
  opportunityType: OpportunityType
  painScore: number // 0 - 10
  intentScore: number // 0 - 10
  relevanceScore: number // 0 - 10
  helpfulnessScore: number // 0 - 10
  createdUtc: number | Date // ms or Date
  promotionalRisk: PromotionalRisk
  score?: number | null // Optional upvotes from API or null for RSS
  commentCount?: number | null // Optional comments from API or null for RSS
  now?: number // optional current timestamp for deterministic testing
}

export interface ScoringResult {
  opportunityScore: number // 0 - 100
  freshnessScore: number // 0 - 10
  priority: PriorityLevel
  breakdown: {
    baseScore: number
    riskMultiplier: number
    engagementAdjustment: number
    hasEngagementData: boolean
  }
}

/**
 * Calculates Freshness Score (0 - 10) deterministically from post creation time.
 */
export function calculateFreshnessScore(createdUtc: number | Date, now = Date.now()): number {
  const createdMs = typeof createdUtc === "number" ? createdUtc : createdUtc.getTime()
  const ageHours = Math.max(0, (now - createdMs) / (1000 * 60 * 60))

  if (ageHours <= 6) return 10
  if (ageHours <= 12) return 8
  if (ageHours <= 24) return 6
  if (ageHours <= 48) return 4
  return 2
}

/**
 * Returns promotional risk penalty multiplier.
 */
export function getPromotionalRiskMultiplier(risk: PromotionalRisk): number {
  switch (risk) {
    case "LOW":
      return 1.0
    case "MEDIUM":
      return 0.85
    case "HIGH":
      return 0.60
    default:
      return 1.0
  }
}

/**
 * Transparent opportunity scoring model:
 * - 25% Pain Score (0-10)
 * - 25% Intent Score (0-10)
 * - 25% Qurtesy Relevance Score (0-10)
 * - 15% Helpfulness Potential (0-10)
 * - 10% Freshness Score (0-10)
 * 
 * Scaled to 0-100, multiplied by Promotional Risk factor.
 * Engagement is strictly OPTIONAL and never required. Missing engagement has zero penalty.
 */
export function calculateOpportunityScore(inputs: ScoringInputs): ScoringResult {
  if (inputs.opportunityType === "IGNORE") {
    return {
      opportunityScore: 0,
      freshnessScore: calculateFreshnessScore(inputs.createdUtc, inputs.now),
      priority: "IGNORE",
      breakdown: {
        baseScore: 0,
        riskMultiplier: 1.0,
        engagementAdjustment: 0,
        hasEngagementData: false,
      },
    }
  }

  // Clamp sub-scores between 0 and 10
  const pain = Math.max(0, Math.min(10, inputs.painScore))
  const intent = Math.max(0, Math.min(10, inputs.intentScore))
  const relevance = Math.max(0, Math.min(10, inputs.relevanceScore))
  const helpfulness = Math.max(0, Math.min(10, inputs.helpfulnessScore))
  const freshness = calculateFreshnessScore(inputs.createdUtc, inputs.now)

  // Base weighted score (0 to 10)
  const baseScore =
    pain * 0.25 +
    intent * 0.25 +
    relevance * 0.25 +
    helpfulness * 0.15 +
    freshness * 0.10

  const riskMultiplier = getPromotionalRiskMultiplier(inputs.promotionalRisk)

  // Optional engagement modifier: ONLY applied if engagement data is explicitly available.
  // Rule: High engagement does NOT mean high opportunity. Fresh low-comment posts get a visibility boost.
  let engagementAdjustment = 0
  const hasEngagementData =
    inputs.commentCount !== null &&
    inputs.commentCount !== undefined &&
    inputs.score !== null &&
    inputs.score !== undefined

  if (hasEngagementData && typeof inputs.commentCount === "number") {
    if (inputs.commentCount <= 10) {
      // Early conversation: high visibility for founder reply
      engagementAdjustment = 3
    } else if (inputs.commentCount > 150) {
      // Saturated thread: founder reply likely buried
      engagementAdjustment = -4
    }
  }

  // Final opportunity score clamped to 0 - 100
  const rawScore = baseScore * 10 * riskMultiplier + engagementAdjustment
  const opportunityScore = Math.max(0, Math.min(100, Math.round(rawScore)))

  // Priority Tier mapping
  let priority: PriorityLevel
  if (opportunityScore >= 75) {
    priority = "HIGH"
  } else if (opportunityScore >= 50) {
    priority = "MEDIUM"
  } else {
    priority = "LOW"
  }

  return {
    opportunityScore,
    freshnessScore: freshness,
    priority,
    breakdown: {
      baseScore: Math.round(baseScore * 10) / 10,
      riskMultiplier,
      engagementAdjustment,
      hasEngagementData,
    },
  }
}
