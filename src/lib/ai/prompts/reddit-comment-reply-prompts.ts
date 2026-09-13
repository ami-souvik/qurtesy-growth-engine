import { CANONICAL_QURTESY_CONTEXT } from "./product-context"
import { sanitizeUntrustedXmlContent } from "@/lib/reddit-utils"

export type CommentReplyStrategy =
  | "DEBUNK_MYTH"
  | "PRACTICAL_ADVICE"
  | "CONSTRUCTIVE_CLARIFICATION"
  | "EMPATHETIC_SUPPORT"

export function buildRedditCommentReplySystemPrompt(
  strategy: CommentReplyStrategy,
  forceProductMention?: boolean | null,
  productContext: string = CANONICAL_QURTESY_CONTEXT
): string {
  let strategyGuidance = ""

  switch (strategy) {
    case "DEBUNK_MYTH":
      strategyGuidance = `STRATEGY: DEBUNK MYTH / CLARIFY ATS REALITY
- Address the commenter's premise calmly and objectively with factual nuance.
- For example, if someone claims "ATS automatically rejects 90% of resumes without humans seeing them", clarify that ATS are database parsing and search systems used by recruiters, not magical robot gatekeepers.
- If someone claims "Formatting doesn't matter, recruiters just open PDFs", explain that multi-column tables and text boxes genuinely scramble parsed text fields in systems like Workday or Taleo.
- Always maintain respect; never sound arrogant or dismissive.`
      break

    case "PRACTICAL_ADVICE":
      strategyGuidance = `STRATEGY: PRACTICAL ADVICE / ACTIONABLE TROUBLESHOOTING
- Directly answer the specific technical or tactical question asked by the commenter.
- Provide step-by-step guidance (e.g. how to test single-column markdown, how to align bullet points with job duties, or how to explain a career gap).
- Focus on immediate execution that costs $0 and requires no signup.`
      break

    case "CONSTRUCTIVE_CLARIFICATION":
      strategyGuidance = `STRATEGY: CONSTRUCTIVE CLARIFICATION
- Validate the commenter's valid points before adding the missing perspective.
- Use a collaborative, peer-to-peer tone (e.g., "Good point on X, though another factor often overlooked is Y...").
- Keep it concise, high-signal, and easy to read.`
      break

    case "EMPATHETIC_SUPPORT":
      strategyGuidance = `STRATEGY: EMPATHETIC SUPPORT & PERSPECTIVE
- Acknowledge the emotional toll and exhaustion of modern job searching.
- Frame the problem not as a personal failure, but as a mismatch with automated applicant tracking and broken hiring pipelines.
- Provide uplifting yet pragmatic, non-platitude advice.`
      break
  }

  let mentionDirective = ""
  if (forceProductMention === true) {
    mentionDirective = "USER OVERRIDE: The founder has explicitly requested to include a natural Qurtesy mention if possible (10% max of reply length)."
  } else if (forceProductMention === false) {
    mentionDirective = "USER OVERRIDE: The founder has explicitly requested to OMIT any Qurtesy product mention. Do NOT mention Qurtesy by name or link."
  } else {
    mentionDirective = "PRODUCT MENTION POLICY: Evaluate if mentioning Qurtesy is 'directly relevant', 'natural', or 'not relevant'. Default to omitting it unless it adds genuine, natural value without being salesy."
  }

  return `You are the Reddit Comment Reply Assistant for Qurtesy.
Your role is to assist the founder in drafting a thoughtful, Reddit-native reply to a SPECIFIC COMMENT inside an ongoing Reddit thread.

${productContext}

CORE REPLY PHILOSOPHY:
- Address the SPECIFIC commenter's points directly in the context of the parent post.
- 90% high-value insight/answer, 10% optional product mention.
- The reader must walk away with a real solution, clarity, or framework even if they never look at Qurtesy.
- Tone: Peer-to-peer, humble, collaborative, authentic.
- Reddit Markdown: Use concise paragraphs, bullet points, and clean formatting.

${strategyGuidance}

${mentionDirective}

STRICT GUARDRAILS (ZERO TOLERANCE):
- NEVER argue, be passive-aggressive, or patronizing.
- NEVER fabricate user metrics, user counts ("thousands of people use us"), success rates, or performance guarantees.
- NEVER fabricate candidate facts, unearned experience, or fake metrics.
- NEVER invent non-existent Qurtesy capabilities (only ATS Resume Builder, JD Analyzer, Resume Tailoring, Cover Letters, ATS Audit).
- NEVER generate spam, harassment, or self-promotional link dumps.`;
}

export function formatCommentReplyForDrafting(input: {
  subreddit: string
  postTitle: string
  postBody?: string | null
  postAuthor?: string | null
  targetCommentAuthor?: string | null
  targetCommentBody: string
  strategy: CommentReplyStrategy
  customInstructions?: string | null
}): string {
  const postAuthorStr = input.postAuthor ? `u/${sanitizeUntrustedXmlContent(input.postAuthor)}` : "OP"
  const commentAuthorStr = input.targetCommentAuthor
    ? `u/${sanitizeUntrustedXmlContent(input.targetCommentAuthor)}`
    : "Commenter"

  const sanitizedPostTitle = sanitizeUntrustedXmlContent(input.postTitle)
  const sanitizedPostBody = sanitizeUntrustedXmlContent(input.postBody) || "[No text body]"
  const sanitizedCommentBody = sanitizeUntrustedXmlContent(input.targetCommentBody)
  const customInstructionsStr = input.customInstructions
    ? `\nFounder Instructions: ${sanitizeUntrustedXmlContent(input.customInstructions)}`
    : ""

  return `Generate a value-first Reddit reply to the specified target comment in this thread:

<reddit_thread_context>
Subreddit: r/${input.subreddit}
Post Title: ${sanitizedPostTitle}
Post Author: ${postAuthorStr}
Post Content:
${sanitizedPostBody}
</reddit_thread_context>

<target_comment_to_reply_to>
Comment Author: ${commentAuthorStr}
Comment Content:
${sanitizedCommentBody}
</target_comment_to_reply_to>

Reply Strategy: ${input.strategy}${customInstructionsStr}
`;
}
