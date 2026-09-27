"use server"

import {
  extractRedditResumeDetails,
  downloadDocumentAsBase64,
  callRoastResumeApi,
} from "@/lib/reddit-resume-document-extractor"
import { RoastResumeActionResult } from "@/lib/types/roast-types"

/**
 * Server action to process a Reddit post URL, extract its resume document/image,
 * and call the Roast My Resume API.
 */
export async function roastResumeFromRedditAction(
  redditUrl: string,
  customDocumentUrl?: string
): Promise<RoastResumeActionResult> {
  if (!redditUrl || typeof redditUrl !== "string" || !redditUrl.trim()) {
    return {
      success: false,
      error: "Please enter a valid Reddit post URL.",
    }
  }

  try {
    // 1. Fetch Reddit post details and attached documents
    const extractRes = await extractRedditResumeDetails(redditUrl.trim())
    if (!extractRes.success || !extractRes.details) {
      return {
        success: false,
        error: extractRes.error || "Failed to extract post details from Reddit.",
      }
    }

    const { details } = extractRes
    const targetDocUrl = customDocumentUrl || details.primaryDocumentUrl

    if (!targetDocUrl) {
      return {
        success: false,
        error:
          "No resume document or image found in this post. Please verify the post includes an image or PDF attachment.",
      }
    }

    // 2. Download document binary and convert to base64
    const documentFile = await downloadDocumentAsBase64(targetDocUrl)

    // 3. Call the Roast Resume API
    const diagnosis = await callRoastResumeApi(documentFile)

    return {
      success: true,
      diagnosis,
      redditDetails: details,
    }
  } catch (error: unknown) {
    console.error("roastResumeFromRedditAction error:", error)
    const message = error instanceof Error ? error.message : "An unexpected error occurred while roasting the resume."
    return {
      success: false,
      error: message,
    }
  }
}
