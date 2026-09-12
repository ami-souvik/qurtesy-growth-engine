"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  FileCheck,
  History,
  CheckCircle2,
  Send,
} from "lucide-react"
import { MarkAsPostedModal } from "@/components/reddit/mark-as-posted-modal"
import {
  OpportunityWithPostAndDraft,
  CommentDraftRecord,
  generateOrRegenerateCommentDraft,
  saveHumanEditedDraft,
  markCommentCopied,
} from "@/actions/reddit-comment-actions"
import { CommentStrategy } from "@/lib/reddit-comment-assistant-service"

export function CommentWorkspaceClient({
  initialData,
}: {
  initialData: OpportunityWithPostAndDraft
}) {
  const [opportunity] = useState(initialData.opportunity)
  const [rawPost] = useState(initialData.rawPost)
  const [draft, setDraft] = useState<CommentDraftRecord | null>(initialData.draft)

  // Editor states
  const [currentText, setCurrentText] = useState(
    initialData.draft?.humanEditedDraft || initialData.draft?.originalAiDraft || ""
  )
  const [selectedStrategy, setSelectedStrategy] = useState<CommentStrategy>(
    (initialData.draft?.strategy as CommentStrategy) ||
      (initialData.opportunity.opportunityType as CommentStrategy) ||
      "PAIN"
  )
  const [includeProductMention, setIncludeProductMention] = useState<boolean>(
    initialData.draft ? initialData.draft.includeProductMention : false
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(initialData.draft?.status === "COPIED")
  const [showOriginal, setShowOriginal] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [markPostedOpen, setMarkPostedOpen] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setFeedbackMessage(null)
    try {
      const updated = await generateOrRegenerateCommentDraft(opportunity.id, {
        strategy: selectedStrategy,
        forceProductMention: includeProductMention,
      })
      setDraft(updated)
      setCurrentText(updated.originalAiDraft)
      setIncludeProductMention(updated.includeProductMention)
      setFeedbackMessage("New draft generated with 90% value, 10% product ratio.")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to generate draft.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    try {
      await saveHumanEditedDraft(draft.id, currentText)
      setDraft(prev => (prev ? { ...prev, humanEditedDraft: currentText, status: "EDITED" } : null))
      setFeedbackMessage("Your manual edits were saved.")
    } catch (err: any) {
      console.error(err)
      alert("Failed to save draft.")
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!currentText.trim()) return
    try {
      await navigator.clipboard.writeText(currentText)
      setCopied(true)
      if (draft) {
        await markCommentCopied(draft.id, currentText)
        setDraft(prev => (prev ? { ...prev, finalApprovedDraft: currentText, status: "COPIED" } : null))
      }
      setFeedbackMessage("Comment copied to clipboard! You can now manually paste it into Reddit.")
      setTimeout(() => setCopied(false), 4000)
    } catch (err) {
      console.error(err)
      alert("Failed to copy to clipboard.")
    }
  }

  const fullRedditUrl = rawPost.permalink.startsWith("http")
    ? rawPost.permalink
    : `https://www.reddit.com${rawPost.permalink}`

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reddit-scout"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
              Comment Assistant
              <span className="text-xs font-mono font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Founder in the Loop
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Review, edit, and copy value-first comments. Zero automated posting.
            </p>
          </div>
        </div>

        {/* Mandatory Review Policy Banner */}
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-md text-xs font-medium">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Review before posting. The system never automatically posts to Reddit.</span>
        </div>
      </div>

      {feedbackMessage && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-md text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE (Col 5): Reddit Post & AI Opportunity Context */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow-xs">
            <CardContent className="p-5 space-y-4">
              {/* Post Header */}
              <div className="flex items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted">
                    r/{rawPost.subreddit}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    by {rawPost.author ? `u/${rawPost.author}` : "Anonymous"}
                  </span>
                </div>

                <a
                  href={fullRedditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 group"
                >
                  <span>Open Reddit</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                </a>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h2 className="font-bold text-base text-foreground leading-snug">
                  {rawPost.title}
                </h2>
                <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto pr-1 border-y py-3">
                  {rawPost.body || <span className="italic">No text body provided.</span>}
                </div>
              </div>

              {/* Opportunity Signals Breakdown */}
              <div className="rounded-lg bg-muted/30 border p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground">Detected Signals:</span>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    {opportunity.opportunityType.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-muted-foreground font-mono text-[11px]">
                  <div>Pain Score: <b className="text-foreground">{opportunity.painScore}/10</b></div>
                  <div>Intent Score: <b className="text-foreground">{opportunity.intentScore}/10</b></div>
                  <div>Relevance: <b className="text-foreground">{opportunity.relevanceScore}/10</b></div>
                  <div>Confidence: <b className="text-foreground">{opportunity.confidence}%</b></div>
                </div>

                <div className="pt-2 border-t">
                  <span className="font-semibold text-primary block mb-0.5">
                    Recommended Response Angle:
                  </span>
                  <p className="text-foreground leading-relaxed text-[11px]">
                    {opportunity.recommendedAngle}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANE (Col 7): Comment Drafting & Editing Workspace */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-xs">
            <CardContent className="p-5 space-y-4">
              {/* Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                {/* Strategy Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Strategy:</span>
                  <select
                    value={selectedStrategy}
                    onChange={e => setSelectedStrategy(e.target.value as CommentStrategy)}
                    className="px-2.5 py-1 text-xs rounded-md border bg-background font-medium focus:ring-1 focus:ring-primary"
                  >
                    <option value="PAIN">PAIN (Problem diagnosis + practical fix)</option>
                    <option value="GIVEAWAY">GIVEAWAY (Full manual framework first)</option>
                    <option value="RESUME_REVIEW">RESUME REVIEW (Specific bullet feedback)</option>
                    <option value="ANTI_FAKE_AI">ANTI-FAKE AI (Transparency & Truthful AI)</option>
                  </select>
                </div>

                {/* Status Badge */}
                {draft && (
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono ${
                      draft.status === "COPIED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                        : draft.status === "EDITED"
                        ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {draft.status}
                  </Badge>
                )}
              </div>

              {/* Product Mention Controls & Rule Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/20 border text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeProductMention}
                    onChange={e => setIncludeProductMention(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="font-medium text-foreground">
                    Include optional Qurtesy mention (10% max)
                  </span>
                </label>

                {draft && (
                  <span className="text-muted-foreground text-[11px] font-mono">
                    Mention Status:{" "}
                    <b className="text-foreground">
                      {draft.includeProductMention ? `Included (${draft.productMentionReason})` : `Omitted (${draft.productMentionReason})`}
                    </b>
                  </span>
                )}
              </div>

              {/* Draft Editor Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Editable Comment Draft (Reddit Markdown):
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {currentText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <Textarea
                  value={currentText}
                  onChange={e => setCurrentText(e.target.value)}
                  placeholder="Click 'Generate Comment Draft' to generate a response..."
                  rows={14}
                  className="font-mono text-xs leading-relaxed focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Original AI Draft Diff / View Toggle */}
              {draft && draft.humanEditedDraft && draft.humanEditedDraft !== draft.originalAiDraft && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>{showOriginal ? "Hide Original AI Draft" : "View Original Pristine AI Draft"}</span>
                  </button>

                  {showOriginal && (
                    <div className="mt-2 p-3 rounded bg-muted/40 border text-xs font-mono text-muted-foreground whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                      <span className="font-semibold block mb-1 text-foreground">
                        Original AI Draft (Never Overwritten):
                      </span>
                      {draft.originalAiDraft}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="text-xs"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  {draft ? "Regenerate Draft" : "Generate Comment Draft"}
                </Button>

                <div className="flex items-center gap-2">
                  {draft && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !currentText.trim()}
                      className="text-xs"
                    >
                      {saving ? "Saving..." : "Save Edits"}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMarkPostedOpen(true)}
                    disabled={!currentText.trim()}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Mark as Posted
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleCopy}
                    disabled={!currentText.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs font-semibold px-4"
                  >
                    {copied ? (
                      <Check className="mr-1.5 h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="mr-1.5 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy Comment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark As Posted Modal */}
      <MarkAsPostedModal
        isOpen={markPostedOpen}
        onClose={() => setMarkPostedOpen(false)}
        initialData={{
          opportunityId: opportunity.id,
          commentDraftId: draft?.id,
          subreddit: rawPost.subreddit,
          postTitle: rawPost.title,
          postUrl: fullRedditUrl,
          strategy: selectedStrategy,
          aiDraft: draft?.originalAiDraft,
          humanEditedDraft: draft?.humanEditedDraft || undefined,
          finalComment: currentText,
        }}
        onSuccess={() => {
          setFeedbackMessage("Marked as posted! You can now track performance in Posting History.")
          setDraft(prev => (prev ? { ...prev, status: "POSTED" } : null))
        }}
      />
    </div>
  )
}
