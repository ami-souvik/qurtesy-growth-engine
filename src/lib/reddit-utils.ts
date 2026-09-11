export function normalizeSubreddit(name: string): string {
  // Remove r/ prefix, lowercase, and trim whitespace
  let normalized = name.trim().toLowerCase()
  if (normalized.startsWith("r/")) {
    normalized = normalized.substring(2)
  }
  // Remove any remaining invalid characters (letters, numbers, underscores are valid)
  normalized = normalized.replace(/[^a-z0-9_]/g, "")
  return normalized
}
