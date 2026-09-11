import { test } from "node:test"
import assert from "node:assert"
import { normalizeSubreddit } from "../../lib/reddit-utils"

test("Subreddit Normalization", async (t) => {
  await t.test("removes r/ prefix", () => {
    assert.strictEqual(normalizeSubreddit("r/jobs"), "jobs")
    assert.strictEqual(normalizeSubreddit("r/resumes"), "resumes")
  })

  await t.test("lowercases input", () => {
    assert.strictEqual(normalizeSubreddit("Jobs"), "jobs")
    assert.strictEqual(normalizeSubreddit("r/EngineeringResumes"), "engineeringresumes")
  })

  await t.test("trims whitespace", () => {
    assert.strictEqual(normalizeSubreddit("  r/jobs  "), "jobs")
    assert.strictEqual(normalizeSubreddit(" resumes "), "resumes")
  })

  await t.test("removes invalid characters", () => {
    assert.strictEqual(normalizeSubreddit("r/hello-world!"), "helloworld")
    assert.strictEqual(normalizeSubreddit("valid_name_123"), "valid_name_123")
  })
})
