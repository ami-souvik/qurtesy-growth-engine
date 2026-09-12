/**
 * Validates whether a subreddit name matches Reddit's identifier rules:
 * 2 to 30 characters, letters, numbers, and underscores only.
 */
export function isValidSubredditName(name: string): boolean {
  if (!name || typeof name !== "string") return false
  const trimmed = name.trim().replace(/^r\//i, "")
  return /^[a-zA-Z0-9_]{2,30}$/.test(trimmed)
}

/**
 * Normalizes a subreddit name by trimming whitespace, removing any r/ prefix,
 * converting to lowercase, and stripping invalid characters.
 */
export function normalizeSubreddit(name: string): string {
  if (!name || typeof name !== "string") return ""
  let normalized = name.trim().toLowerCase()
  if (normalized.startsWith("r/")) {
    normalized = normalized.substring(2)
  }
  normalized = normalized.replace(/[^a-z0-9_]/g, "")
  return normalized
}

/**
 * Sanitizes untrusted user content (titles, selftext, resume excerpts)
 * before interpolation into LLM system or user prompts.
 *
 * Prevents XML boundary breakout attacks (e.g. injecting </untrusted_reddit_post>)
 * by neutralizing closing tag markers and escaping control sequences.
 */
export function sanitizeUntrustedXmlContent(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return ""

  return text
    // Neutralize XML closing tags used as prompt boundaries
    .replace(/<\/(untrusted_reddit_post|target_reddit_post|candidate_resume_text|reddit_thread_context|target_job_description)>/gi, "&lt;/$1&gt;")
    .replace(/<(untrusted_reddit_post|target_reddit_post|candidate_resume_text|reddit_thread_context|target_job_description)>/gi, "&lt;$1&gt;")
    // Neutralize general tag breakouts inside XML boundaries
    .replace(/<\//g, "&lt;/")
    // Remove null bytes and non-printable control chars except \n, \r, \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
}
