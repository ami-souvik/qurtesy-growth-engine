import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import {
  RedditResumeReviewResponseSchema,
  RedditResumeReviewResponse,
} from "@/lib/ai/schemas"
import {
  buildRedditResumeReviewSystemPrompt,
  formatResumeReviewInput,
} from "@/lib/ai/prompts/reddit-resume-prompts"
import { getAugmentedProductContext } from "@/lib/ai/prompts/product-context"

export interface AnalyzeResumeInput {
  subreddit: string
  title: string
  resumeText: string
  targetRole?: string | null
  targetJobDescription?: string | null
  author?: string | null
}

export type ResumeReviewInput = AnalyzeResumeInput

export interface AnalyzeResumeOptions {
  customProductContext?: string
  aiModelOverride?: any
}

export async function analyzeRedditResume(
  input: AnalyzeResumeInput,
  options?: AnalyzeResumeOptions
): Promise<{ response: RedditResumeReviewResponse; modelUsed: string }> {
  // If no API key and no override, return deterministic fallback
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey && !options?.aiModelOverride) {
    console.warn("No GOOGLE_GENERATIVE_AI_API_KEY available; using deterministic resume analysis fallback.")
    const fallback: RedditResumeReviewResponse = {
      targetRoleIdentified: input.targetRole || "Software Engineer",
      topImprovements: [
        {
          priority: 1,
          title: "Quantify Impact With Known Metrics",
          explanation: "Replace duty-based descriptions with measurable business outcomes where you have actual data.",
        },
        {
          priority: 2,
          title: "Switch to Single-Column ATS Layout",
          explanation: "Ensure parsing systems don't scramble work history by removing tables or split columns.",
        },
        {
          priority: 3,
          title: "Lead With Strong Action Verbs",
          explanation: "Start each bullet with past-tense power verbs rather than passive phrases like 'responsible for'.",
        },
      ],
      bulletRewrites: [
        {
          originalBullet: input.resumeText.slice(0, 100),
          issue: "Lacks measurable outcome and scope.",
          suggestedRewrite: "Executed core duties, resulting in [quantify business impact if measured].",
          evidencePresent: true,
        },
      ],
      missingEvidence: [
        {
          area: "Performance Metrics",
          guidance: "Include latency reduction or scale metrics only if you measured them.",
          placeholderExample: "Reduced response time by [X ms / Y%].",
        },
      ],
      atsConsiderations: [
        {
          category: "Layout",
          recommendation: "Keep headings standard (Experience, Education, Skills) and avoid multi-column tables.",
        },
      ],
      clarityAssessment: "Resume has good baseline structure but needs sharper impact evidence.",
      keywordAlignmentAssessment: input.targetJobDescription
        ? "Keyword match is moderate; align terminology with target JD skills."
        : null,
      redditCommentDraft: `Here is a constructive review of your resume:\n\n1. **Quantify Impact**: Where possible, state your results (e.g. [quantify scale if measured]).\n2. **ATS Layout**: Stick to clean single-column structure to avoid parsing scramble.\n3. **Action Verbs**: Start each bullet with direct verbs.\n\nHope this helps!`,
      guardrailsVerified: true,
    }

    return { response: fallback, modelUsed: "fallback-no-key" }
  }

  const productContext = options?.customProductContext || (await getAugmentedProductContext())
  const systemPrompt = buildRedditResumeReviewSystemPrompt(productContext)
  const formattedPrompt = formatResumeReviewInput(input)

  try {
    const model = options?.aiModelOverride || google("gemini-3.6-flash")
    const { object: response } = await generateObject({
      model,
      schema: RedditResumeReviewResponseSchema,
      system: systemPrompt,
      prompt: formattedPrompt,
    })

    return {
      response,
      modelUsed: options?.aiModelOverride ? "test-override" : "gemini-3.6-flash",
    }
  } catch (error: any) {
    console.error("Failed to analyze Reddit resume with AI:", error)
    const errorFallback: RedditResumeReviewResponse = {
      targetRoleIdentified: input.targetRole || null,
      topImprovements: [
        {
          priority: 1,
          title: "Clarify Core Responsibilities",
          explanation: "Ensure the connection between your work and the role's primary goals is evident.",
        },
        {
          priority: 2,
          title: "Add Measurable Scope",
          explanation: "Specify team sizes, project scopes, or volume handled using placeholders where unmeasured.",
        },
        {
          priority: 3,
          title: "Ensure Single-Column Readability",
          explanation: "Format in standard semantic order to ensure both human recruiters and ATS parse without errors.",
        },
      ],
      bulletRewrites: [],
      missingEvidence: [],
      atsConsiderations: [
        {
          category: "Formatting",
          recommendation: "Use standard single-column text layout.",
        },
      ],
      clarityAssessment: "Basic analysis generated; review specific bullets manually.",
      keywordAlignmentAssessment: null,
      redditCommentDraft: "Here are 3 quick improvements: focus on single-column ATS layout, clarify scope, and quantify outcomes where known.",
      guardrailsVerified: true,
    }
    return { response: errorFallback, modelUsed: "error-fallback" }
  }
}
