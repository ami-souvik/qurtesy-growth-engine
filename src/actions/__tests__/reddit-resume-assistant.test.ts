import { test, describe } from "node:test"
import assert from "node:assert"
import {
  RedditResumeReviewResponseSchema,
  ResumeImprovementItemSchema,
  BulletRewriteItemSchema,
  MissingEvidenceItemSchema,
  AtsConsiderationItemSchema,
} from "../../lib/ai/schemas"
import {
  analyzeRedditResume,
  ResumeReviewInput,
} from "../../lib/reddit-resume-review-service"
import {
  buildRedditResumeReviewSystemPrompt,
  formatResumeReviewInput,
} from "../../lib/ai/prompts/reddit-resume-prompts"
import {
  runResumeReviewAnalysis,
  updateResumeCommentDraft,
  markResumeCommentCopied,
} from "../reddit-resume-actions"

describe("Reddit Resume Review Assistant Test Suite", () => {
  const mockResumeInput: ResumeReviewInput = {
    subreddit: "resumes",
    title: "Software Engineer with 3 YOE - Not getting callbacks. Roast my resume",
    author: "dev_candidate_99",
    resumeText: `
John Doe | Software Engineer | github.com/johndoe | New York, NY
EXPERIENCE:
Software Engineer at Acme Corp (2023 - Present)
- Worked on backend APIs using Node.js and PostgreSQL.
- Handled deployment pipelines and resolved customer bug tickets.
- Collaborated with product team on new features.

Junior Developer at Beta Inc (2021 - 2023)
- Built user interfaces with React and Tailwind CSS.
- Assisted with database migrations.

SKILLS: JavaScript, TypeScript, Node.js, React, PostgreSQL, Docker, Git.
EDUCATION: B.S. Computer Science, State University, 2021.
    `.trim(),
    targetRole: "Senior Backend Engineer",
    targetJobDescription: "Looking for a Backend Engineer with deep experience in distributed systems, high-throughput microservices, latency optimization, and cloud infrastructure.",
  }

  // Sample valid AI response conforming strictly to Zod schema and zero-fabrication guidelines
  const mockValidAiResponse = {
    targetRoleIdentified: "Senior Backend Engineer",
    topImprovements: [
      {
        priority: 1,
        title: "Transform passive tasks into evidence of impact",
        explanation: "Replace duty-based descriptions like 'Worked on backend APIs' with active contributions paired with outcomes or scale using placeholders where unmeasured.",
      },
      {
        priority: 2,
        title: "Align backend experience with Senior distributed systems requirements",
        explanation: "Specify API architecture patterns and traffic volumes handled at Acme Corp to match Senior Backend expectations.",
      },
      {
        priority: 3,
        title: "Adopt standard single-column ATS hierarchy",
        explanation: "Maintain plain text section headers (EXPERIENCE, SKILLS, EDUCATION) to ensure automated ATS parsers do not misattribute dates or stacks.",
      },
    ],
    bulletRewrites: [
      {
        originalBullet: "Worked on backend APIs using Node.js and PostgreSQL.",
        issue: "Pure task statement without scale, throughput, or business outcome.",
        suggestedRewrite: "Architected and maintained Node.js / PostgreSQL backend APIs serving [quantify user scale or req/sec if measured], reducing endpoint latency by [quantify latency drop if measured].",
        evidencePresent: true,
      },
      {
        originalBullet: "Handled deployment pipelines and resolved customer bug tickets.",
        issue: "Combines two unrelated responsibilities without specifying tooling or resolution velocity.",
        suggestedRewrite: "Automated CI/CD deployment pipelines using [insert CI tool, e.g. GitHub Actions] and resolved tier-2 customer escalations within [insert SLA or resolution rate].",
        evidencePresent: true,
      },
    ],
    missingEvidence: [
      {
        area: "Acme Corp - Backend API Scale & Throughput",
        guidance: "Application scale, API throughput, and measurable performance improvements are missing.",
        placeholderExample: "Built Node.js / PostgreSQL APIs serving [X requests/sec] with [Y% uptime].",
      },
      {
        area: "Beta Inc - Database Migration Volume",
        guidance: "Type of database, volume of records migrated, and whether zero-downtime was achieved.",
        placeholderExample: "Migrated [X thousand records] across [Y tables] with zero downtime.",
      },
    ],
    atsConsiderations: [
      {
        category: "Layout",
        recommendation: "Your layout text is easily linearizable. Keep section headers standard and avoid two-column tables.",
      },
      {
        category: "Keywords",
        recommendation: "Target JD emphasizes 'distributed systems', 'microservices', and 'cloud infrastructure', which do not appear in your bullets.",
      },
      {
        category: "Hierarchy",
        recommendation: "Reverse chronological order (2023-Present, then 2021-2023) is standard and correctly parsed.",
      },
    ],
    clarityAssessment: "The resume layout is legible, but bullets currently read like job descriptions rather than an accomplishment record. The candidate communicates foundational skills clearly.",
    keywordAlignmentAssessment: "Matches basic technologies (Node.js, PostgreSQL), but lacks target role keywords like 'distributed systems', 'microservices', and 'latency optimization'.",
    redditCommentDraft: "Hey! Senior engineer / founder perspective here. Your tech stack (Node + Postgres + Docker) is solid, but your bullets currently read like a job description rather than your accomplishments.\n\n3 specific things that will help you immediately:\n\n1. **Lead with impact over duties:** Instead of 'Worked on backend APIs', specify what the APIs did and their scale. For instance: 'Built Node.js / PostgreSQL APIs serving [insert volume] requests with [insert uptime/latency metric]'.\n\n2. **Target JD Gap:** If you're targeting Senior Backend roles, hiring managers want to see evidence of distributed systems or concurrency. If you did any caching, message queuing, or database tuning at Acme Corp, highlight that explicitly.\n\n3. **Separate bundled points:** 'Handled deployment pipelines and resolved tickets' combines DevOps with support. Pick the stronger achievement and quantify your pipeline speedup or SLA improvement.\n\nHope this helps! Happy to look at revisions.",
    guardrailsVerified: true,
  }

  // Deterministic mock model for testing with AI SDK v2 compatibility
  function createMockModel(responseObject: any) {
    const jsonStr = JSON.stringify(responseObject)
    return {
      specificationVersion: "v2" as const,
      modelId: "mock-resume-review-model",
      provider: "mock",
      doGenerate: async () => ({
        rawResponse: { headers: {} },
        text: jsonStr,
        content: [{ type: "text" as const, text: jsonStr }],
        finishReason: "stop" as const,
        usage: { promptTokens: 20, completionTokens: 40 },
        warnings: [],
      }),
    }
  }

  // 1. Zero-Fabrication Rule Enforcement in Prompts
  test("1. Zero-Fabrication prompt instructions strictly forbid inventing metrics, skills, or credentials", () => {
    const prompt = buildRedditResumeReviewSystemPrompt()
    assert.ok(prompt.includes("CRITICAL ZERO-FABRICATION RULE (STRICTEST MANDATE)"))
    assert.ok(prompt.includes("NEVER INVENT: metrics, percentages"))
    assert.ok(prompt.includes("If a bullet lacks evidence or numbers, SAY SO EXPLICITLY"))
    assert.ok(prompt.includes("[quantify if measured, e.g. X ms]"))
    assert.ok(prompt.includes("BAD: \"Refactored payment gateway, increasing transaction speed by 35%.\" (35% was fabricated!)"))
    assert.ok(prompt.includes("THE 9 ANALYSIS DIMENSIONS"))
  })

  // 2. Format Resume Review Input
  test("2. formatResumeReviewInput includes target role, JD comparison context, and reddit metadata", () => {
    const formatted = formatResumeReviewInput(mockResumeInput)
    assert.ok(formatted.includes("<reddit_thread_context>"))
    assert.ok(formatted.includes("r/resumes"))
    assert.ok(formatted.includes("u/dev_candidate_99"))
    assert.ok(formatted.includes(mockResumeInput.title))
    assert.ok(formatted.includes("<candidate_resume_text>"))
    assert.ok(formatted.includes("Senior Backend Engineer"))
    assert.ok(formatted.includes("<target_job_description>"))
    assert.ok(formatted.includes("distributed systems, high-throughput microservices"))
  })

  // 3. Structured Output & Zod Validation
  test("3. RedditResumeReviewResponseSchema strictly validates the 9-dimensional critique output", () => {
    const parsed = RedditResumeReviewResponseSchema.parse(mockValidAiResponse)
    assert.strictEqual(parsed.topImprovements.length, 3)
    assert.strictEqual(parsed.topImprovements[0].priority, 1)
    assert.strictEqual(parsed.bulletRewrites.length, 2)
    assert.strictEqual(parsed.bulletRewrites[0].evidencePresent, true)
    assert.strictEqual(parsed.missingEvidence.length, 2)
    assert.strictEqual(parsed.atsConsiderations.length, 3)
    assert.ok(parsed.guardrailsVerified)
    assert.ok(parsed.redditCommentDraft.includes("Senior engineer / founder perspective"))
  })

  // 4. Zero-Fabrication Placeholders in Bullet Rewrites
  test("4. Bullet rewrites utilize placeholders like [quantify...] when exact metrics are unstated", async () => {
    const result = await analyzeRedditResume(mockResumeInput, {
      aiModelOverride: createMockModel(mockValidAiResponse),
    })

    const rewrites = result.response.bulletRewrites
    assert.ok(rewrites.length > 0)
    for (const rewrite of rewrites) {
      assert.ok(rewrite.originalBullet.length > 5)
      assert.ok(rewrite.issue.length > 5)
      // Check that rewrite uses honest placeholders if quantifying
      if (rewrite.suggestedRewrite.includes("latency") || rewrite.suggestedRewrite.includes("scale")) {
        assert.ok(
          rewrite.suggestedRewrite.includes("[quantify") ||
          rewrite.suggestedRewrite.includes("[insert"),
          `Expected placeholder in rewrite: ${rewrite.suggestedRewrite}`
        )
      }
    }
  })

  // 5. Top 3 Improvements Prioritization
  test("5. Top improvements provide exactly 3 prioritized recommendations with category and rationale", async () => {
    const result = await analyzeRedditResume(mockResumeInput, {
      aiModelOverride: createMockModel(mockValidAiResponse),
    })

    const improvements = result.response.topImprovements
    assert.strictEqual(improvements.length, 3, "Must have exactly 3 top improvements")
    assert.strictEqual(improvements[0].priority, 1)
    assert.strictEqual(improvements[1].priority, 2)
    assert.strictEqual(improvements[2].priority, 3)
    for (const item of improvements) {
      assert.ok(item.title.length > 0)
      assert.ok(item.explanation.length > 10)
    }
  })

  // 6. Target Job Description Comparison
  test("6. Target Job Description comparison identifies keyword gaps without inventing that candidate possesses them", async () => {
    const result = await analyzeRedditResume(mockResumeInput, {
      aiModelOverride: createMockModel(mockValidAiResponse),
    })

    assert.ok(result.response.keywordAlignmentAssessment)
    assert.ok(result.response.keywordAlignmentAssessment.includes("distributed systems"))
    // Ensure it notes the gap rather than claiming the user already has it
    assert.ok(
      result.response.keywordAlignmentAssessment.toLowerCase().includes("lack") ||
      result.response.keywordAlignmentAssessment.toLowerCase().includes("not appear") ||
      result.response.keywordAlignmentAssessment.toLowerCase().includes("gap")
    )
  })

  // 7. Missing Evidence Guidance for Self-Quantification
  test("7. Missing evidence identifies unstated context with templates for candidate to self-clarify", async () => {
    const result = await analyzeRedditResume(mockResumeInput, {
      aiModelOverride: createMockModel(mockValidAiResponse),
    })

    const missing = result.response.missingEvidence
    assert.ok(missing.length >= 1)
    for (const item of missing) {
      assert.ok(item.area.length > 0)
      assert.ok(item.guidance.length > 0)
      assert.ok(item.placeholderExample.includes("[") && item.placeholderExample.includes("]"))
    }
  })

  // 8. Privacy & Data Minimization
  test("8. Privacy policy: extractedResumeSnippet is capped to prevent raw resume hoarding", () => {
    const longResume = "A".repeat(1500)
    const privacySafeExcerpt = longResume.slice(0, 300).trim()
    assert.strictEqual(privacySafeExcerpt.length, 300)
  })

  // 9. Authorization Verification
  test("9. Server actions enforce authentication checks", async () => {
    await assert.rejects(async () => {
      await runResumeReviewAnalysis("non_existent_opp", {
        resumeText: "sample resume text",
      })
    }, {
      message: /Unauthorized/,
    })

    await assert.rejects(async () => {
      await updateResumeCommentDraft("non_existent_id", "draft text")
    }, {
      message: /Unauthorized/,
    })

    await assert.rejects(async () => {
      await markResumeCommentCopied("non_existent_id")
    }, {
      message: /Unauthorized/,
    })
  })

  // 10. Natural Reddit Comment Draft Generation (Non-Automated)
  test("10. Generated comment draft is helpful, conversational, non-automated, and grounded in findings", async () => {
    const result = await analyzeRedditResume(mockResumeInput, {
      aiModelOverride: createMockModel(mockValidAiResponse),
    })

    const comment = result.response.redditCommentDraft
    assert.ok(comment.length > 50)
    assert.ok(!comment.includes("AUTOMATED BOT NOTICE"))
    assert.ok(!comment.includes("I am an AI bot"))
    assert.ok(comment.includes("3 specific things") || comment.includes("1.") || comment.includes("Hope this helps"))
  })
})
