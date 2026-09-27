export type RoastSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"

export interface BiggestProblem {
  title: string
  severity: RoastSeverity
  evidence: string
  explanation: string
  recommendedFix: string
}

export interface BulletSurgery {
  originalBullet: string
  problem: string
  whyItIsWeak: string
  suggestedRewrite: string
}

export interface AtsParsingReview {
  structure: string
  headings: string
  parsingRisks: string[]
  dateConsistency: string
  layoutRisks: string[]
  keywordStructure: string
}

export interface FixPlan {
  fixFirst: string[]
  fixNext: string[]
  polishLater: string[]
}

export interface ResumeEvidenceModel {
  candidateName?: string
  detectedRole?: string
  totalRolesCount?: number
  totalBulletsCount?: number
  metricsCount?: number
  weakVerbsDetected?: string[]
  strongVerbsDetected?: string[]
  buzzwordsDetected?: string[]
  hasSummary?: boolean
  skillsCount?: number
  formattingAnomalies?: string[]
}

export interface RoastDiagnosis {
  roastHeadline: string
  executiveDiagnosis: string[]
  biggestProblems: BiggestProblem[]
  bulletSurgery: BulletSurgery[]
  positioning: string
  atsParsingReview: AtsParsingReview
  strengths: string[]
  fixPlan: FixPlan
  evidence?: ResumeEvidenceModel
  extractedResume?: Record<string, unknown>
  overallScore?: number
  scoreLabel?: string
}

export interface RedditResumeDetails {
  url: string
  title: string
  author: string
  subreddit: string
  permalink: string
  body: string
  documentUrls: string[]
  primaryDocumentUrl?: string
}

export interface RoastResumeActionResult {
  success: boolean
  diagnosis?: RoastDiagnosis
  redditDetails?: RedditResumeDetails
  error?: string
}
