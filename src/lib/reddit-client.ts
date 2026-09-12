export type RedditPost = {
  id: string
  subreddit: string
  title: string
  selftext: string
  permalink: string
  author: string
  score: number
  num_comments: number
  created_utc: number
  over_18: boolean
  is_robot_indexable: boolean // Can use to detect if removed/spam often
  removed_by_category?: string | null
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

function parseRssFeed(xml: string, defaultSubreddit: string): RedditPost[] {
  const entries = xml.split("<entry>").slice(1)
  return entries
    .map(entry => {
      // ID (e.g. t3_1we55hb)
      const idMatch = entry.match(/<id>([^<]+)<\/id>/)
      const id = idMatch ? idMatch[1].trim() : ""

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

      // Published timestamp
      const pubMatch = entry.match(/<(published|updated)>([^<]+)<\/\1>/)
      const created_utc = pubMatch ? new Date(pubMatch[2].trim()).getTime() : Date.now()

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
        score: 0,
        num_comments: 0,
        created_utc,
        over_18: isNsfw,
        is_robot_indexable: true,
        removed_by_category: null,
      } as RedditPost
    })
    .filter(post => Boolean(post.id))
}

export async function fetchRecentPosts(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.rss`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/atom+xml,application/xml,text/xml,application/json;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      if (response.status === 429) {
        const resetSec = response.headers.get("x-ratelimit-reset") || response.headers.get("retry-after")
        const waitHint = resetSec ? ` (wait ~${resetSec}s before retrying)` : ""
        throw new Error(`Reddit API rate limit exceeded${waitHint}`)
      }
      throw new Error(`Reddit API error: ${response.statusText}`)
    }

    const text = await response.text()

    // If response is JSON (e.g. in test mocks or alternative endpoints)
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

    return parseRssFeed(text, subreddit)
  } catch (error) {
    console.error(`Failed to fetch from ${subreddit}:`, error)
    throw error
  }
}
