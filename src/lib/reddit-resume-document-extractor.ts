import { parseRedditUrl } from "./reddit-manual-fetcher"
import { RedditResumeDetails, RoastDiagnosis } from "./types/roast-types"

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
]

function getRandomUserAgent(): string {
  const index = Math.floor(Math.random() * USER_AGENTS.length)
  return USER_AGENTS[index]
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/&nbsp;/g, " ")
}

export function cleanDocumentUrl(raw: string): string {
  let cleaned = decodeHtmlEntities(raw).trim()
  // Strip trailing HTML tags or entity fragments
  cleaned = cleaned.replace(/[">]+$/, "")
  // If it's a preview.redd.it link, extract original if possible
  const previewMatch = cleaned.match(/https?:\/\/preview\.redd\.it\/([a-zA-Z0-9_-]+\.(?:png|jpe?g|webp))/i)
  if (previewMatch) {
    return `https://i.redd.it/${previewMatch[1]}`
  }
  return cleaned
}

/**
 * Extracts all document and image URLs from Reddit post XML content.
 */
export function extractMediaUrlsFromXml(xmlContent: string): string[] {
  const decoded = decodeHtmlEntities(xmlContent)
  const urls: string[] = []

  // 1. Match i.redd.it links
  const iReddItMatches = decoded.matchAll(/https?:\/\/i\.redd\.it\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)/gi)
  for (const m of iReddItMatches) {
    urls.push(cleanDocumentUrl(m[0]))
  }

  // 2. Match preview.redd.it links
  const previewMatches = decoded.matchAll(/https?:\/\/preview\.redd\.it\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)[^\s"'<>)]*/gi)
  for (const m of previewMatches) {
    urls.push(cleanDocumentUrl(m[0]))
  }

  // 3. Match Imgur image links
  const imgurMatches = decoded.matchAll(/https?:\/\/i\.imgur\.com\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)/gi)
  for (const m of imgurMatches) {
    urls.push(cleanDocumentUrl(m[0]))
  }

  // 4. Match general image/pdf hrefs or srcs
  const generalMatches = decoded.matchAll(/https?:\/\/[^\s"'<>]+\.(?:pdf|png|jpe?g|webp)(?:\?[^\s"'<>]*)?/gi)
  for (const m of generalMatches) {
    urls.push(cleanDocumentUrl(m[0]))
  }

  // Deduplicate and filter valid URLs
  const uniqueUrls: string[] = []
  const seen = new Set<string>()

  for (const u of urls) {
    const base = u.split("?")[0].toLowerCase()
    if (!seen.has(base)) {
      seen.add(base)
      uniqueUrls.push(u)
    }
  }

  return uniqueUrls
}

/**
 * Fetches Reddit post metadata and attached resume document/image links.
 */
export async function extractRedditResumeDetails(rawUrl: string): Promise<{
  success: boolean
  details?: RedditResumeDetails
  error?: string
}> {
  const parsed = parseRedditUrl(rawUrl)
  if (!parsed.isValid || !parsed.postId) {
    return {
      success: false,
      error: "Invalid Reddit post URL. Please provide a standard Reddit post link (e.g., https://www.reddit.com/r/resumes/comments/...)",
    }
  }

  const feedUrl = parsed.feedUrl || `https://www.reddit.com/comments/${parsed.postId}/.rss`

  let response: Response | null = null
  let attempts = 0
  const maxAttempts = 2

  while (attempts < maxAttempts) {
    attempts++
    try {
      response = await fetch(feedUrl, {
        headers: {
          "User-Agent": getRandomUserAgent(),
          Accept: "application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        break
      }

      if (response.status === 429 && attempts < maxAttempts) {
        // Short pause before retry
        await new Promise((resolve) => setTimeout(resolve, 1500))
        continue
      }
    } catch (err: unknown) {
      if (attempts >= maxAttempts) {
        const msg = err instanceof Error ? err.message : "Network error"
        return {
          success: false,
          error: `Failed to connect to Reddit: ${msg}`,
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  if (!response || !response.ok) {
    if (response?.status === 429) {
      return {
        success: false,
        error: "Reddit is temporarily rate-limiting requests. Please wait a moment and try again.",
      }
    }
    if (response?.status === 404) {
      return {
        success: false,
        error: "Reddit post not found (404). Please ensure the URL is correct and the post is public.",
      }
    }
    return {
      success: false,
      error: `Reddit returned status ${response?.status || "error"}.`,
    }
  }

  const xml = await response.text()
  const entries = xml.split("<entry>").slice(1)
  if (entries.length === 0) {
    return {
      success: false,
      error: "No post details found in Reddit feed.",
    }
  }

  const postEntry = entries[0]

  // Title
  const titleMatch = postEntry.match(/<title>([\s\S]*?)<\/title>/)
  let title = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : "Reddit Resume Submission"
  title = title.replace(/\s*:\s*[a-zA-Z0-9_]+$/, "").trim()

  // Author
  const authorMatch = postEntry.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)
  let author = authorMatch ? authorMatch[1].trim() : ""
  if (author.startsWith("/u/")) author = author.slice(3)

  // Subreddit
  const catMatch = postEntry.match(/<category\s+term="([^"]+)"/)
  const subreddit = catMatch ? catMatch[1].trim() : parsed.subreddit || "resumes"

  // Permalink
  const linkMatch = postEntry.match(/<link\s+href="([^"]+)"/)
  const permalink = linkMatch ? linkMatch[1].trim() : parsed.normalizedUrl || rawUrl

  // Content
  const contentMatch = postEntry.match(/<content\s+type="html">([\s\S]*?)<\/content>/)
  const rawContent = contentMatch ? contentMatch[1] : ""

  // Extract documents / images
  const documentUrls = extractMediaUrlsFromXml(rawContent)

  // Also check if linkMatch points directly to an image/pdf
  if (permalink && /\.(?:png|jpe?g|webp|pdf)(?:\?.*)?$/i.test(permalink)) {
    const cleaned = cleanDocumentUrl(permalink)
    if (!documentUrls.includes(cleaned)) {
      documentUrls.unshift(cleaned)
    }
  }

  // Parse body text
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
      .replace(/submitted by \/u\/[^\s]+.*$/i, "")
      .replace(/\[link\]\s*\[comments\]/gi, "")
      .trim()
  }

  if (documentUrls.length === 0) {
    return {
      success: false,
      error:
        "No resume image (PNG, JPG, WEBP) or PDF document found in this Reddit post. Please make sure the post has an attached resume image or document.",
    }
  }

  return {
    success: true,
    details: {
      url: rawUrl,
      title,
      author,
      subreddit,
      permalink,
      body,
      documentUrls,
      primaryDocumentUrl: documentUrls[0],
    },
  }
}

/**
 * Downloads a document from a URL and converts it to base64 with MIME type.
 */
export async function downloadDocumentAsBase64(url: string): Promise<{
  base64: string
  mimeType: string
}> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": getRandomUserAgent(),
      Accept: "image/*,application/pdf,*/*",
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    throw new Error(`Failed to download resume document from Reddit CDN (status ${res.status})`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString("base64")

  const headerType = res.headers.get("content-type") || ""
  let mimeType = headerType.split(";")[0].trim().toLowerCase()

  if (!mimeType || mimeType === "application/octet-stream") {
    const cleanLower = url.split("?")[0].toLowerCase()
    if (cleanLower.endsWith(".pdf")) mimeType = "application/pdf"
    else if (cleanLower.endsWith(".png")) mimeType = "image/png"
    else if (cleanLower.endsWith(".webp")) mimeType = "image/webp"
    else mimeType = "image/jpeg"
  }

  return { base64, mimeType }
}

/**
 * Calls the Roast My Resume API on localhost:3000 (or configured URL)
 * passing the documentFile object.
 */
export async function callRoastResumeApi(documentFile: {
  base64: string
  mimeType: string
}): Promise<RoastDiagnosis> {
  const apiUrl =
    process.env.ROAST_RESUME_API_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/roast-resume`

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentFile,
    }),
  })

  if (!response.ok) {
    let errorDetail = `Status ${response.status}`
    try {
      const errJson = (await response.json()) as { error?: string }
      if (errJson?.error) errorDetail = errJson.error
    } catch {
      // ignore json parse error
    }
    throw new Error(`Roast API Error: ${errorDetail}`)
  }

  const data = (await response.json()) as RoastDiagnosis
  return data
}
