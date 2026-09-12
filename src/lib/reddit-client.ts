import { isValidSubredditName, normalizeSubreddit } from "./reddit-utils"

export type RedditPost = {
  id: string
  subreddit: string
  title: string
  selftext: string
  permalink: string
  author: string
  score: number | null
  num_comments: number | null
  created_utc: number
  over_18: boolean
  is_robot_indexable: boolean
  removed_by_category?: string | null
}

/**
 * Abstraction interface for the Reddit Feed Client.
 * Allows replacing RSS ingestion with another authorized provider in the future
 * without rewriting the intelligence or opportunity layers.
 */
export interface IRedditFeedClient {
  fetchRecentPosts(subreddit: string): Promise<RedditPost[]>
}

// 2MB maximum response size limit for RSS feeds
const MAX_RSS_RESPONSE_BYTES = 2 * 1024 * 1024

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/&nbsp;/g, " ")
}

/**
 * Safely parses XML RSS/Atom feed into normalized RedditPost objects.
 * - Strips XML entity expansion (XXE) declarations before processing.
 * - Handles malformed entries without throwing unhandled exceptions.
 * - Safely handles invalid or missing timestamps with Date.now() fallback.
 */
export function parseRssFeed(rawXml: string, defaultSubreddit: string): RedditPost[] {
  if (!rawXml || typeof rawXml !== "string") return []

  try {
    // 1. Defend against XXE / XML entity expansion attacks
    const sanitizedXml = rawXml
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .replace(/<!ENTITY[\s\S]*?>/gi, "")

    const entries = sanitizedXml.split("<entry>").slice(1)
    if (entries.length === 0) return []

    return entries
      .map(entry => {
        try {
          // ID (e.g. t3_1we55hb)
          const idMatch = entry.match(/<id>([^<]+)<\/id>/)
          const id = idMatch ? idMatch[1].trim() : ""
          if (!id) return null

          // Title
          const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
          const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : ""

          // Link / Permalink
          const linkMatch = entry.match(/<link\s+href="([^"]+)"/)
          let permalink = linkMatch ? linkMatch[1].trim() : ""
          permalink = permalink.replace(/^https?:\/\/(www\.)?reddit\.com/, "")

          // Author (/u/username)
          const authorMatch = entry.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)
          let author = authorMatch ? authorMatch[1].trim() : ""
          if (author.startsWith("/u/")) author = author.slice(3)

          // Subreddit category
          const catMatch = entry.match(/<category\s+term="([^"]+)"/)
          const subreddit = catMatch ? catMatch[1].trim() : defaultSubreddit

          // Published timestamp with safe NaN fallback
          const pubMatch = entry.match(/<(published|updated)>([^<]+)<\/\1>/)
          let created_utc = Date.now()
          if (pubMatch) {
            const parsedTs = new Date(pubMatch[2].trim()).getTime()
            if (!isNaN(parsedTs)) {
              created_utc = parsedTs
            }
          }

          // Content / Selftext
          const contentMatch = entry.match(/<content\s+type="html">([\s\S]*?)<\/content>/)
          let selftext = ""
          if (contentMatch) {
            const decodedHtml = decodeHtmlEntities(contentMatch[1])
            const mdMatch = decodedHtml.match(/<div class="md">([\s\S]*?)<\/div>/)
            const rawText = mdMatch ? mdMatch[1] : ""
            selftext = rawText
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<\/p>/gi, "\n\n")
              .replace(/<[^>]+>/g, " ")
              .replace(/[ \t]+/g, " ")
              .trim()
          }

          const isNsfw = /<category\s+term="nsfw"/i.test(entry) || /\[nsfw\]/i.test(title)

          return {
            id,
            subreddit,
            title,
            selftext,
            permalink,
            author,
            score: null,
            num_comments: null,
            created_utc,
            over_18: isNsfw,
            is_robot_indexable: true,
            removed_by_category: null,
          } as RedditPost
        } catch {
          return null
        }
      })
      .filter((post): post is RedditPost => post !== null && Boolean(post.id))
  } catch (err) {
    console.error("Failed to parse Reddit RSS XML:", err)
    return []
  }
}

/**
 * Default implementation of the Reddit Feed Client using server-side RSS.
 * Validates subreddit names strictly to prevent SSRF and arbitrary proxying.
 */
export class DefaultRedditFeedClient implements IRedditFeedClient {
  async fetchRecentPosts(subreddit: string): Promise<RedditPost[]> {
    if (!isValidSubredditName(subreddit)) {
      throw new Error(
        `Invalid subreddit identifier: "${subreddit}". Subreddit names must contain only 2-30 letters, numbers, or underscores.`
      )
    }
    const normalizedSub = normalizeSubreddit(subreddit)

    const url = `https://www.reddit.com/r/${normalizedSub}/new.rss`

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/atom+xml,application/xml,text/xml,application/json;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        if (response.status === 429) {
          const resetSec = response.headers.get("x-ratelimit-reset") || response.headers.get("retry-after")
          const waitHint = resetSec ? ` (wait ~${resetSec}s before retrying)` : ""
          throw new Error(`Reddit API rate limit exceeded${waitHint}`)
        }
        throw new Error(`Reddit API error: ${response.statusText}`)
      }

      // Check Content-Length header if present to avoid memory bombs
      const contentLengthHeader = response.headers.get("content-length")
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10)
        if (contentLength > MAX_RSS_RESPONSE_BYTES) {
          throw new Error(`Reddit response too large (${contentLength} bytes exceeds ${MAX_RSS_RESPONSE_BYTES} limit)`)
        }
      }

      const text = await response.text()
      if (text.length > MAX_RSS_RESPONSE_BYTES) {
        throw new Error(`Reddit response body exceeded ${MAX_RSS_RESPONSE_BYTES} bytes`)
      }

      // If response is JSON (e.g. in test mocks or alternative test endpoints)
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          const data = JSON.parse(text)
          if (!data?.data?.children) {
            return []
          }
          type RedditApiChild = { data: Record<string, unknown> }
          return (data.data.children as RedditApiChild[]).map((child) => {
            const post = child.data
            return {
              id: String(post.name ?? ""),
              subreddit: String(post.subreddit ?? ""),
              title: String(post.title ?? ""),
              selftext: String(post.selftext ?? ""),
              permalink: String(post.permalink ?? ""),
              author: String(post.author ?? ""),
              score: Number(post.score ?? 0),
              num_comments: Number(post.num_comments ?? 0),
              created_utc: Number(post.created_utc ?? 0) * 1000,
              over_18: Boolean(post.over_18),
              is_robot_indexable: post.is_robot_indexable !== false,
              removed_by_category: post.removed_by_category ? String(post.removed_by_category) : null,
            } as RedditPost
          })
        } catch {
          // Continue to XML parsing
        }
      }

      return parseRssFeed(text, normalizedSub)
    } catch (error) {
      console.error(`Failed to fetch from r/${normalizedSub}:`, error)
      throw error
    }
  }
}

export const redditFeedClient: IRedditFeedClient = new DefaultRedditFeedClient()

export async function fetchRecentPosts(subreddit: string): Promise<RedditPost[]> {
  return redditFeedClient.fetchRecentPosts(subreddit)
}
