import { test, describe } from "node:test"
import assert from "node:assert"
import { parseRedditUrl, extractImageUrls } from "../../lib/reddit-manual-fetcher"
import {
  buildRedditCommentReplySystemPrompt,
  formatCommentReplyForDrafting,
} from "../../lib/ai/prompts/reddit-comment-reply-prompts"
import {
  generateManualPostDraft,
  generateManualCommentReplyDraft,
} from "../../lib/reddit-manual-drafting-service"

describe("Manual Reddit Post & Comment Reply Drafting Test Suite", () => {
  // 1. URL Parser tests
  describe("Reddit URL Parser & Image Extractor", () => {
    test("correctly parses standard Reddit post URL", () => {
      const url = "https://www.reddit.com/r/resumes/comments/1wdunfy/2_yoe_unemployed_nonprofit_role_usa/"
      const parsed = parseRedditUrl(url)
      assert.strictEqual(parsed.isValid, true)
      assert.strictEqual(parsed.subreddit, "resumes")
      assert.strictEqual(parsed.postId, "1wdunfy")
      assert.strictEqual(parsed.feedUrl, "https://www.reddit.com/r/resumes/comments/1wdunfy/.rss")
    })

    test("correctly parses short redd.it link", () => {
      const url = "https://redd.it/1wdunfy"
      const parsed = parseRedditUrl(url)
      assert.strictEqual(parsed.isValid, true)
      assert.strictEqual(parsed.postId, "1wdunfy")
      assert.strictEqual(parsed.feedUrl, "https://www.reddit.com/comments/1wdunfy/.rss")
    })

    test("correctly parses comment permalink", () => {
      const url = "https://www.reddit.com/r/jobs/comments/xyz123/workday_error/comment/c987654/"
      const parsed = parseRedditUrl(url)
      assert.strictEqual(parsed.isValid, true)
      assert.strictEqual(parsed.subreddit, "jobs")
      assert.strictEqual(parsed.postId, "xyz123")
      assert.strictEqual(parsed.commentId, "c987654")
    })

    test("extracts image URLs from raw HTML and plain text", () => {
      const sampleHtml = `
        <p>Take a look at my resume:</p>
        <a href="https://preview.redd.it/sample_image_1.jpg?width=1080&amp;format=pjpg">https://preview.redd.it/sample_image_1.jpg</a>
        <img src="https://i.redd.it/sample_image_2.png" />
      `
      const images = extractImageUrls(sampleHtml)
      assert.strictEqual(images.length, 2)
      assert.ok(images.some((img) => img.includes("sample_image_1.jpg")))
      assert.ok(images.some((img) => img.includes("sample_image_2.png")))
    })
  })

  // 2. Comment Reply Prompt & Guardrails
  describe("Comment Reply Prompts & System Rules", () => {
    test("builds system prompt with DEBUNK_MYTH guidance and Qurtesy guardrails", () => {
      const prompt = buildRedditCommentReplySystemPrompt("DEBUNK_MYTH")
      assert.ok(prompt.includes("STRATEGY: DEBUNK MYTH"))
      assert.ok(prompt.includes("90% high-value insight"))
      assert.ok(prompt.includes("NEVER fabricate"))
    })

    test("builds system prompt with forced product mention omit", () => {
      const prompt = buildRedditCommentReplySystemPrompt("PRACTICAL_ADVICE", false)
      assert.ok(prompt.includes("OMIT any Qurtesy product mention"))
    })

    test("formats comment reply prompt with thread context and target comment", () => {
      const formatted = formatCommentReplyForDrafting({
        subreddit: "resumes",
        postTitle: "Why does Workday reject my tables?",
        postBody: "Applied to 50 jobs with multi-column table layout.",
        postAuthor: "applicant_1",
        targetCommentAuthor: "skeptical_recruiter",
        targetCommentBody: "Recruiters just read PDFs, ATS score isn't a real thing.",
        strategy: "DEBUNK_MYTH",
        customInstructions: "Clarify table parsing issues calmly without arguing.",
      })

      assert.ok(formatted.includes("Subreddit: r/resumes"))
      assert.ok(formatted.includes("Why does Workday reject my tables?"))
      assert.ok(formatted.includes("u/skeptical_recruiter"))
      assert.ok(formatted.includes("ATS score isn't a real thing"))
      assert.ok(formatted.includes("Founder Instructions: Clarify table parsing issues"))
    })
  })

  // 3. AI Drafting Service
  describe("AI Drafting Service (Manual Post & Comment Reply)", () => {
    function createMockModel(responseObject: any) {
      const jsonStr = JSON.stringify(responseObject)
      return {
        specificationVersion: "v2" as const,
        modelId: "mock-model",
        provider: "mock",
        doGenerate: async () => ({
          rawResponse: { headers: {} },
          text: jsonStr,
          content: [{ type: "text" as const, text: jsonStr }],
          finishReason: "stop" as const,
          usage: { promptTokens: 10, completionTokens: 20 },
          warnings: [],
        }),
      }
    }

    test("generateManualPostDraft: generates valid structured draft with mock model", async () => {
      const mockResult = {
        includeProductMention: false,
        productMentionReason: "not relevant",
        strategyUsed: "PAIN",
        commentDraft: "Switching to single column markdown will fix your Workday parsing issue immediately.",
        valueProvidedSummary: "Provided direct single column fix.",
        guardrailsVerified: true,
      }

      const { response, modelUsed } = await generateManualPostDraft(
        {
          subreddit: "resumes",
          title: "Workday scrambled my experience",
          body: "Tables got parsed backwards.",
          strategy: "PAIN",
        },
        { aiModelOverride: createMockModel(mockResult) }
      )

      assert.strictEqual(modelUsed, "test-override")
      assert.strictEqual(response.strategyUsed, "PAIN")
      assert.ok(response.commentDraft.includes("single column markdown"))
    })

    test("generateManualCommentReplyDraft: generates valid reply to target comment with mock model", async () => {
      const mockResult = {
        includeProductMention: false,
        productMentionReason: "not relevant",
        strategyUsed: "PAIN",
        commentDraft: "You're right that recruiters read PDFs, but Workday parses columns into database fields before keyword searches.",
        valueProvidedSummary: "Addressed ATS text extraction nuance.",
        guardrailsVerified: true,
      }

      const { response, modelUsed } = await generateManualCommentReplyDraft(
        {
          subreddit: "resumes",
          postTitle: "Workday parsing issues",
          targetCommentAuthor: "recruiter_dan",
          targetCommentBody: "Formatting doesn't matter, we just look at the PDF.",
          strategy: "DEBUNK_MYTH",
        },
        { aiModelOverride: createMockModel(mockResult) }
      )

      assert.strictEqual(modelUsed, "test-override")
      assert.ok(response.commentDraft.includes("Workday parses columns into database fields"))
      assert.strictEqual(response.guardrailsVerified, true)
    })

    test("fallback gracefully without API key or mock model", async () => {
      const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY

      try {
        const postResult = await generateManualPostDraft({
          subreddit: "resumes",
          title: "Test fallback post",
        })
        assert.strictEqual(postResult.modelUsed, "fallback-no-key")
        assert.ok(postResult.response.commentDraft.length > 10)

        const replyResult = await generateManualCommentReplyDraft({
          subreddit: "jobs",
          postTitle: "Test fallback thread",
          targetCommentBody: "Why is job searching so hard?",
        })
        assert.strictEqual(replyResult.modelUsed, "fallback-no-key")
        assert.ok(replyResult.response.commentDraft.length > 10)
      } finally {
        if (originalKey) {
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey
        }
      }
    })
  })
})
