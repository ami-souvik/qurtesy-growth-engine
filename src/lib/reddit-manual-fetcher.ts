import { isValidSubredditName, normalizeSubreddit, sanitizeUntrustedXmlContent } from "./reddit-utils"

export interface ExtractedRedditPostDetails {
  subreddit: string
  title: string
  body: string
  author: string
  permalink: string
  attachedImages: string[]
  commentId?: string
  targetComment?: {
    author: string
    body: string
  }
}

export interface FetchRedditUrlResult {
  success: boolean
  data?: ExtractedRedditPostDetails
  error?: string
}

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
 * Parses and normalizes various Reddit URL formats.
 */
export function parseRedditUrl(rawUrl: string): {
  isValid: boolean
  subreddit?: string
  postId?: string
  commentId?: string
  normalizedUrl?: string
  feedUrl?: string
} {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false }
  }

  const trimmed = rawUrl.trim()

  // Handle redd.it/XYZ format
  const shortMatch = trimmed.match(/^https?:\/\/redd\.it\/([a-zA-Z0-9]+)/i)
  if (shortMatch) {
    const postId = shortMatch[1]
    return {
      isValid: true,
      postId,
      normalizedUrl: `https://www.reddit.com/comments/${postId}`,
      feedUrl: `https://www.reddit.com/comments/${postId}/.rss`,
    }
  }

  // Handle standard reddit.com/r/sub/comments/id/...
  const standardMatch = trimmed.match(
    /^https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\/r\/([a-zA-Z0-9_]{2,30})\/comments\/([a-zA-Z0-9]+)(?:\/[^\s/]+)?(?:\/comment\/([a-zA-Z0-9]+)|\/([a-zA-Z0-9]+))?/i
  )

  if (standardMatch) {
    const subreddit = normalizeSubreddit(standardMatch[1])
    const postId = standardMatch[2]
    const commentId = standardMatch[3] || (standardMatch[4] && standardMatch[4] !== "comment" ? standardMatch[4] : undefined)

    const normalizedUrl = commentId
      ? `https://www.reddit.com/r/${subreddit}/comments/${postId}/comment/${commentId}/`
      : `https://www.reddit.com/r/${subreddit}/comments/${postId}/`

    const feedUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}/.rss`

    return {
      isValid: true,
      subreddit,
      postId,
      commentId,
      normalizedUrl,
      feedUrl,
    }
  }

  // Handle direct comments/id format without subreddit in URL
  const directMatch = trimmed.match(
    /^https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\/comments\/([a-zA-Z0-9]+)/i
  )
  if (directMatch) {
    const postId = directMatch[1]
    return {
      isValid: true,
      postId,
      normalizedUrl: `https://www.reddit.com/comments/${postId}/`,
      feedUrl: `https://www.reddit.com/comments/${postId}/.rss`,
    }
  }

  return { isValid: false }
}

/**
 * Extracts image links from HTML or markdown text.
 */
export function extractImageUrls(htmlOrText: string): string[] {
  if (!htmlOrText) return []

  const imageMap = new Map<string, string>()

  const addUrl = (raw: string) => {
    const url = decodeHtmlEntities(raw).trim()
    if (!url) return

    if (
      url.includes("preview.redd.it") ||
      url.includes("i.redd.it") ||
      url.includes("external-preview.redd.it") ||
      /\.(?:png|jpe?g|webp)(?:\?.*)?$/i.test(url)
    ) {
      // Base path without query parameters for deduplication key
      const basePath = url.split("?")[0].toLowerCase()
      // If we haven't seen this image yet, or if the new URL has full query params (like preview dimensions), prioritize the richer URL
      if (!imageMap.has(basePath) || url.includes("?")) {
        imageMap.set(basePath, url)
      }
    }
  }

  // 1. Matches <a href="..."> or src="..." links
  const attrMatches = htmlOrText.matchAll(/(?:href|src)="([^"]+)"/gi)
  for (const match of attrMatches) {
    addUrl(match[1])
  }

  // 2. Direct raw URLs in plain text
  const rawUrlMatches = htmlOrText.matchAll(
    /https?:\/\/(?:preview\.redd\.it|i\.redd\.it|external-preview\.redd\.it)\/[^\s<>"')]+/gi
  )
  for (const match of rawUrlMatches) {
    addUrl(match[0])
  }

  return Array.from(imageMap.values())
}

/**
 * Safely fetches and parses Reddit post details using public post RSS feed.
 */
export async function fetchRedditPostDetails(rawUrl: string): Promise<FetchRedditUrlResult> {
  const parsed = parseRedditUrl(rawUrl)
  if (!parsed.isValid || !parsed.feedUrl) {
    return {
      success: false,
      error: "Invalid Reddit post URL. Please provide a standard Reddit post or comment link (e.g. reddit.com/r/.../comments/...)",
    }
  }

  try {
    const response = await fetch(parsed.feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          error: "Reddit is currently rate-limiting public requests. You can manually fill in the title and description below without waiting.",
        }
      }
      if (response.status === 404) {
        return {
          success: false,
          error: "Reddit post not found (404). It might be deleted or from a private subreddit.",
        }
      }
      return {
        success: false,
        error: `Reddit returned status ${response.status} (${response.statusText}). You can enter post details manually.`,
      }
    }

    const xml = await response.text()
    if (!xml || !xml.includes("<feed")) {
      return {
        success: false,
        error: "Failed to read post content from Reddit. You can enter post details manually.",
      }
    }

    // Parse Atom entries
    const entries = xml.split("<entry>").slice(1)
    if (entries.length === 0) {
      return {
        success: false,
        error: "No post details found in Reddit feed. You can enter details manually.",
      }
    }

    // The first entry is always the main Post
    const postEntry = entries[0]

    // Title
    const titleMatch = postEntry.match(/<title>([\s\S]*?)<\/title>/)
    let title = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : ""
    // Remove subreddit suffix if present in feed title (e.g. "Title : resumes")
    title = title.replace(/\s*:\s*[a-zA-Z0-9_]+$/, "").trim()

    // Author
    const authorMatch = postEntry.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)
    let author = authorMatch ? authorMatch[1].trim() : ""
    if (author.startsWith("/u/")) author = author.slice(3)

    // Subreddit
    const catMatch = postEntry.match(/<category\s+term="([^"]+)"/)
    let subreddit = catMatch ? catMatch[1].trim() : parsed.subreddit || ""
    subreddit = normalizeSubreddit(subreddit)

    // Permalink
    const linkMatch = postEntry.match(/<link\s+href="([^"]+)"/)
    const permalink = linkMatch ? linkMatch[1].trim() : parsed.normalizedUrl || ""

    // Content & Images
    const contentMatch = postEntry.match(/<content\s+type="html">([\s\S]*?)<\/content>/)
    let rawContent = contentMatch ? contentMatch[1] : ""
    const attachedImages = extractImageUrls(rawContent)

    // Clean body text
    let body = ""
    if (rawContent) {
      const decodedHtml = decodeHtmlEntities(rawContent)
      const mdMatch = decodedHtml.match(/<div class="md">([\s\S]*?)<\/div>/)
      const rawText = mdMatch ? mdMatch[1] : decodedHtml
      body = rawText
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/[ \t]+/g, " ")
        // Remove repetitive link footnotes from RSS
        .replace(/submitted by \/u\/[^\s]+.*$/i, "")
        .replace(/\[link\]\s*\[comments\]/gi, "")
        .trim()
    }

    // Optional target comment extraction if URL has a commentId
    let targetComment: { author: string; body: string } | undefined
    if (parsed.commentId && entries.length > 1) {
      // Find the entry with this commentId
      for (let i = 1; i < entries.length; i++) {
        const commentEntry = entries[i]
        const idMatch = commentEntry.match(/<id>([^<]+)<\/id>/)
        const idStr = idMatch ? idMatch[1] : ""
        if (idStr.includes(parsed.commentId)) {
          const cAuthorMatch = commentEntry.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)
          let cAuthor = cAuthorMatch ? cAuthorMatch[1].trim() : ""
          if (cAuthor.startsWith("/u/")) cAuthor = cAuthor.slice(3)

          const cContentMatch = commentEntry.match(/<content\s+type="html">([\s\S]*?)<\/content>/)
          let cBody = ""
          if (cContentMatch) {
            const decoded = decodeHtmlEntities(cContentMatch[1])
            const md = decoded.match(/<div class="md">([\s\S]*?)<\/div>/)
            cBody = (md ? md[1] : decoded)
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<\/p>/gi, "\n\n")
              .replace(/<[^>]+>/g, " ")
              .replace(/[ \t]+/g, " ")
              .trim()
          }

          if (cBody) {
            targetComment = {
              author: cAuthor || "commenter",
              body: cBody,
            }
          }
          break
        }
      }
    }

    return {
      success: true,
      data: {
        subreddit,
        title,
        body,
        author,
        permalink,
        attachedImages,
        commentId: parsed.commentId,
        targetComment,
      },
    }
  } catch (error: any) {
    console.error("fetchRedditPostDetails error:", error)
    return {
      success: false,
      error: error.message || "Failed to connect to Reddit. You can enter post details manually.",
    }
  }
}
