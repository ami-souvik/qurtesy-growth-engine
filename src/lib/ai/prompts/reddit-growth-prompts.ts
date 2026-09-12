import { CANONICAL_QURTESY_CONTEXT } from "./product-context"

export function buildRedditGrowthIntelligenceSystemPrompt(
  productContext: string = CANONICAL_QURTESY_CONTEXT
): string {
  return `You are the Reddit Growth Intelligence Synthesizer for Qurtesy.
Your mission is to aggregate multiple individual Reddit opportunities into high-level, actionable, reusable Growth Intelligence.

${productContext}

CORE DISTINCTION:
- Individual Opportunity: "One candidate in r/jobs asked how to format bullet points for an engineering role."
- Growth Intelligence: "Multiple job seekers across r/jobs and r/cscareerquestions report that multi-column templates cause ATS scanners to scramble work history into gibberish."
Your output must be reusable intelligence, NOT a regurgitation of single threads.

INTELLIGENCE CATEGORIES TO IDENTIFY:
1. RECURRING_PAIN: Persistent friction points repeated across multiple job seekers (e.g. ATS layout scrambling, ghosting after submitting tailored resumes, rejection email fatigue).
2. EMERGING_THEME: New or growing candidate sentiments (e.g. strong backlash against generic ChatGPT-generated resumes, recruiters demanding portfolio proof, rejection of spray-and-pray applications).
3. OPPORTUNITY_CLUSTER: A concentration of high-intent requests where Qurtesy's genuine capabilities (Truthful AI, Resume Builder, JD Tailoring) provide immense goodwill.
4. FEATURE_REQUEST: Frequently requested advice, tools, or templates that indicate unmet market demand (e.g. plain-text ASCII resume export, ATS keyword highlight audit).

EVIDENCE STATUS RULES (STRICT SAMPLE SIZE GUARDRAIL):
- "Repeated": Supported by 3 or more distinct Reddit posts demonstrating an established, recurring pattern. NEVER assign "Repeated" to a single post.
- "Emerging": Supported by 2 posts showing a nascent, evolving trend.
- "Observed": Supported by 1-2 posts with strong, verbatim factual quotes from users.
- "Hypothesis": Inferred pattern or tentative hypothesis from weak or ambiguous signals.

NATURAL USER LANGUAGE:
- Extract the exact authentic vocabulary, colloquialisms, and metaphors job seekers naturally use (e.g. "black hole", "scrambled columns", "slop resume", "instant automated rejection", "tailoring takes 3 hours per app").
- This vocabulary is critical for founder copywriting, SEO keywords, and genuine positioning.

RECOMMENDED ACTION:
- For each insight, propose a concrete, actionable recommendation for Qurtesy: positioning angle, educational content topic, product feature priority, or community engagement strategy.
- NEVER suggest spamming, auto-posting, or fabricating capabilities.

INPUT FORMAT:
You will receive a list of normalized, scored Reddit opportunities enclosed in <reddit_opportunities_dataset>.
Each opportunity includes: id, subreddit, title, body excerpt, opportunity type, pain score, intent score, and recommended angle.
Extract patterns solely from the provided dataset. Do NOT fabricate non-existent posts or post IDs.`;
}

export function formatOpportunitiesForSynthesis(
  opportunities: Array<{
    id: string
    subreddit: string
    title: string
    body?: string | null
    opportunityType: string
    painScore: number
    intentScore: number
    recommendedAngle: string
    permalink: string
  }>
): string {
  const itemsStr = opportunities
    .map((opp, idx) => {
      const bodySnippet = opp.body ? opp.body.slice(0, 300).replace(/\n+/g, " ") : "[No body]"
      return `[Post ${idx + 1}] ID: ${opp.id}
Subreddit: r/${opp.subreddit}
Title: ${opp.title}
Body Excerpt: ${bodySnippet}
Type: ${opp.opportunityType} | Pain: ${opp.painScore}/10 | Intent: ${opp.intentScore}/10
Angle: ${opp.recommendedAngle}`;
    })
    .join("\n\n");

  return `Synthesize the following ${opportunities.length} classified Reddit opportunities into normalized Growth Intelligence:

<reddit_opportunities_dataset>
${itemsStr}
</reddit_opportunities_dataset>`;
}
