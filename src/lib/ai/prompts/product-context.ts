import { db } from "@/lib/db"
import { dataSourceSnapshots } from "@/db/schema"
import { desc } from "drizzle-orm"

/**
 * Canonical Qurtesy Product Context.
 * STRICT RULE: The AI classifier must NEVER invent capabilities outside this definition.
 */
export const CANONICAL_QURTESY_CONTEXT = `
QURTESY PRODUCT OVERVIEW & CAPABILITIES:
Qurtesy is a job-seeker enablement engine built on genuine alignment, transparency, and truthful positioning.

Core Capabilities:
1. ATS-Friendly Resume Builder: Clean, single-column semantic resumes that ATS scanners parse reliably without text-scrambling.
2. Job Description Analyzer: Extracts required skills, hidden keywords, qualifications, and core duties from job postings.
3. Resume Tailoring Engine: Tailors candidate's genuine existing experience directly to a specific target job without lying or padding.
4. Tailored Cover Letter Generator: Generates specific, role-focused cover letters addressing exact employer needs.
5. ATS Compatibility Audit: Analyzes resume match against target roles, identifying legitimate keyword and formatting gaps.

Core Principles & Positioning:
- Truthful AI (Zero Fabrication): Never invents skills, fake metrics, or unearned credentials. Rejects AI hallucinations.
- Anti-Spray-and-Pray: Advocates for 5 high-quality, deeply tailored applications over 500 spam applications.
- Anti-Fake AI: Rejects generic AI slop, unvetted bot applications, and automated buzzword stuffing.
- Human in the Loop: The candidate remains in full control. The tool augments rather than replaces human authenticity.
- Privacy First & Free Access: Free tool access for job seekers, respectful of user privacy.

What Qurtesy IS NOT (Strict Guardrails - Do NOT claim these):
- NOT an automated mass job application bot or scraper.
- NOT a resume lying or credential fabrication tool.
- NOT a recruiter marketplace, staffing agency, or candidate headhunter.
- NOT a proxy interview or voice/video deepfake tool.
`;

export async function getAugmentedProductContext(): Promise<string> {
  let context = CANONICAL_QURTESY_CONTEXT

  try {
    const [snapshot] = await db
      .select()
      .from(dataSourceSnapshots)
      .orderBy(desc(dataSourceSnapshots.createdAt))
      .limit(1)

    if (snapshot) {
      const additions: string[] = []

      if (snapshot.productUpdates?.trim()) {
        additions.push(`Recent Real Product Updates:\n${snapshot.productUpdates.trim()}`)
      }
      if (snapshot.userPainPoints?.trim()) {
        additions.push(`Known Job Seeker Pain Points:\n${snapshot.userPainPoints.trim()}`)
      }
      if (snapshot.experiments?.trim()) {
        additions.push(`Active Growth Experiments:\n${snapshot.experiments.trim()}`)
      }
      if (snapshot.jobTrends?.trim()) {
        additions.push(`Current Job Market Trends:\n${snapshot.jobTrends.trim()}`)
      }

      if (additions.length > 0) {
        context += `\n\nCURRENT BUSINESS & MARKET SIGNALS:\n${additions.join("\n\n")}`
      }
    }
  } catch (err) {
    console.warn("Failed to load dataSourceSnapshots for augmented context, falling back to canonical:", err)
  }

  return context
}
