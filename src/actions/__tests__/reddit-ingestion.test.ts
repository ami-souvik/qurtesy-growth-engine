import { test, mock, beforeEach, afterEach } from "node:test"
import assert from "node:assert"
import { fetchRecentPosts } from "../../lib/reddit-client"

let fetchMock: any;

beforeEach(() => {
  fetchMock = mock.method(global, 'fetch')
})

afterEach(() => {
  mock.restoreAll()
})

test("Reddit Client Ingestion", async (t) => {
  await t.test("fetches and parses valid reddit response", async () => {
    fetchMock.mock.mockImplementationOnce(() => 
      Promise.resolve(new Response(JSON.stringify({
        data: {
          children: [
            {
              data: {
                name: "t3_abc123",
                subreddit: "jobs",
                title: "Need help",
                selftext: "Looking for a job",
                permalink: "/r/jobs/comments/abc123/need_help/",
                author: "jobseeker",
                score: 10,
                num_comments: 5,
                created_utc: 1600000000,
                over_18: false,
                is_robot_indexable: true
              }
            }
          ]
        }
      })))
    )

    const posts = await fetchRecentPosts("jobs")
    assert.strictEqual(posts.length, 1)
    assert.strictEqual(posts[0].id, "t3_abc123")
    assert.strictEqual(posts[0].subreddit, "jobs")
    assert.strictEqual(posts[0].is_robot_indexable, true)
  })

  await t.test("fetches and parses valid reddit RSS response", async () => {
    const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <id>t3_rss123</id>
        <title>Software Engineer Opening &amp; Remote</title>
        <link href="https://www.reddit.com/r/jobs/comments/rss123/software_engineer_opening/" />
        <author><name>/u/recruiter_pro</name></author>
        <category term="jobs" label="r/jobs" />
        <published>2026-09-12T05:00:00+00:00</published>
        <content type="html">&lt;!-- SC_OFF --&gt;&lt;div class="md"&gt;&lt;p&gt;Looking for skilled engineers.&lt;/p&gt;&lt;/div&gt;&lt;!-- SC_ON --&gt;</content>
      </entry>
    </feed>`

    fetchMock.mock.mockImplementationOnce(() =>
      Promise.resolve(new Response(mockXml, {
        headers: { 'Content-Type': 'application/atom+xml' }
      }))
    )

    const posts = await fetchRecentPosts("jobs")
    assert.strictEqual(posts.length, 1)
    assert.strictEqual(posts[0].id, "t3_rss123")
    assert.strictEqual(posts[0].subreddit, "jobs")
    assert.strictEqual(posts[0].title, "Software Engineer Opening & Remote")
    assert.strictEqual(posts[0].permalink, "/r/jobs/comments/rss123/software_engineer_opening/")
    assert.strictEqual(posts[0].author, "recruiter_pro")
    assert.strictEqual(posts[0].selftext, "Looking for skilled engineers.")
  })

  await t.test("handles malformed reddit response gracefully", async () => {
    fetchMock.mock.mockImplementationOnce(() => 
      Promise.resolve(new Response(JSON.stringify({
        kind: "Listing",
        // missing data.children
      })))
    )

    const posts = await fetchRecentPosts("jobs")
    assert.strictEqual(posts.length, 0)
  })

  await t.test("throws error on API failure (e.g. 429 rate limit)", async () => {
    fetchMock.mock.mockImplementationOnce(() => 
      Promise.resolve(new Response("Too Many Requests", { status: 429, statusText: "Too Many Requests" }))
    )

    await assert.rejects(
      async () => await fetchRecentPosts("jobs"),
      { message: /Reddit API rate limit exceeded/ }
    )
  })

  await t.test("throws error on generic 500 error", async () => {
    fetchMock.mock.mockImplementationOnce(() => 
      Promise.resolve(new Response("Server Error", { status: 500, statusText: "Internal Server Error" }))
    )

    await assert.rejects(
      async () => await fetchRecentPosts("jobs"),
      { message: /Reddit API error: Internal Server Error/ }
    )
  })
})
