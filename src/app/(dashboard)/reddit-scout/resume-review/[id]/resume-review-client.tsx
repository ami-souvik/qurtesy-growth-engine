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
  ArrowLeft,
  ShieldAlert,
  Loader2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  FileSearch,
  ListOrdered,
  Send,
} from "lucide-react"
import { MarkAsPostedModal } from "@/components/reddit/mark-as-posted-modal"
import {
  OpportunityWithResumeReview,
  ParsedResumeReview,
  runResumeReviewAnalysis,
  updateResumeCommentDraft,
  markResumeCommentCopied,
} from "@/actions/reddit-resume-actions"

export function ResumeReviewClient({
  initialData,
}: {
  initialData: OpportunityWithResumeReview
}) {
  const [opportunity] = useState(initialData.opportunity)
  const [rawPost] = useState(initialData.rawPost)
  const [review, setReview] = useState<ParsedResumeReview | null>(initialData.review)

  // Inputs
  const [resumeText, setResumeText] = useState(
    initialData.review?.extractedResumeSnippet || rawPost.body || ""
  )
  const [targetRole, setTargetRole] = useState(
    initialData.review?.targetRole || ""
  )
  const [targetJobDescription, setTargetJobDescription] = useState(
    initialData.review?.targetJobDescription || ""
  )

  // Draft comment state
  const [commentDraft, setCommentDraft] = useState(
    initialData.review?.commentDraft || ""
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(initialData.review?.status === "COPIED")
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [markPostedOpen, setMarkPostedOpen] = useState(false)

  const handleRunAnalysis = async () => {
    if (!resumeText.trim()) {
      alert("Please provide resume text to analyze.")
      return
    }

    setLoading(true)
    setFeedbackMessage(null)

    try {
      const res = await runResumeReviewAnalysis(opportunity.id, {
        resumeText,
        targetRole: targetRole.trim() || undefined,
        targetJobDescription: targetJobDescription.trim() || undefined,
      })
      setReview(res)
      setCommentDraft(res.commentDraft)
      setFeedbackMessage("Resume critique generated with strict zero-fabrication guardrails.")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to analyze resume.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!review) return
    setSaving(true)
    try {
      await updateResumeCommentDraft(review.id, commentDraft)
      setReview(prev => (prev ? { ...prev, commentDraft, status: "EDITED" } : null))
      setFeedbackMessage("Saved comment draft edits.")
    } catch (err) {
      console.error(err)
      alert("Failed to save draft.")
    } finally {
      setSaving(false)
    }
  }

  const handleCopyComment = async () => {
    if (!commentDraft.trim()) return
    try {
      await navigator.clipboard.writeText(commentDraft)
      setCopied(true)
      if (review) {
        await markResumeCommentCopied(review.id)
        setReview(prev => (prev ? { ...prev, status: "COPIED" } : null))
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
      {/* Top Header */}
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
              Resume Review Assistant
              <span className="text-xs font-mono font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Zero Fabrication
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Deep research & actionable resume critique for Reddit feedback requests.
            </p>
          </div>
        </div>

        {/* Review Policy Banner */}
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

      {/* 3-Column Multi-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL 1 (Cols 4): Context & Target Input */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="shadow-xs">
            <CardContent className="p-4 space-y-3.5">
              {/* Reddit Thread Context */}
              <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                <div className="flex items-center gap-1.5">
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
                  <span>Open Thread</span>
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </a>
              </div>

              <div>
                <h2 className="font-semibold text-sm text-foreground line-clamp-2">
                  {rawPost.title}
                </h2>
              </div>

              {/* Resume Text Input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Candidate Resume Text (Publicly Shared):
                </label>
                <Textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste or edit the resume text from the Reddit post..."
                  rows={8}
                  className="font-mono text-xs leading-relaxed focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Target Role */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Target Role (Optional):
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-1.5 text-xs rounded-md border bg-background focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Target Job Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Target Job Description (Optional for Keyword Match):
                </label>
                <Textarea
                  value={targetJobDescription}
                  onChange={e => setTargetJobDescription(e.target.value)}
                  placeholder="Paste a target job posting to analyze skill & keyword alignment..."
                  rows={4}
                  className="font-mono text-xs leading-relaxed focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Trigger Button */}
              <div className="pt-2 border-t">
                <Button
                  onClick={handleRunAnalysis}
                  disabled={loading || !resumeText.trim()}
                  className="w-full bg-primary text-primary-foreground text-xs font-semibold"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSearch className="mr-2 h-4 w-4" />
                  )}
                  {review ? "Re-Analyze Resume" : "Analyze Resume with AI"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PANEL 2 (Cols 4): Analysis & Actionable Critique */}
        <div className="lg:col-span-4 space-y-4">
          {!review ? (
            <div className="border rounded-xl p-8 text-center bg-muted/10 space-y-2">
              <FileCheck className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-sm text-foreground">No Analysis Generated</p>
              <p className="text-xs text-muted-foreground">
                Paste the resume text on the left and click "Analyze Resume with AI" to generate prioritized feedback.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top 3 Prioritized Improvements */}
              <Card className="shadow-xs border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-primary">
                      <ListOrdered className="h-4 w-4" />
                      Top 3 Improvements (Prioritized)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Actionable
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {review.topImprovements.map(item => (
                      <div
                        key={item.priority}
                        className="p-2.5 rounded-md bg-muted/30 border border-muted-foreground/15 text-xs space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                            {item.priority}
                          </span>
                          <span className="font-semibold text-foreground">{item.title}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed pl-6">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Missing Evidence Callouts */}
              {review.missingEvidence.length > 0 && (
                <Card className="shadow-xs">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b pb-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span>Missing Evidence (Self-Clarify)</span>
                    </div>

                    <div className="space-y-2">
                      {review.missingEvidence.map((item, idx) => (
                        <div key={idx} className="text-xs space-y-0.5">
                          <span className="font-semibold text-foreground block">
                            • {item.area}:
                          </span>
                          <p className="text-muted-foreground pl-3">{item.guidance}</p>
                          <code className="text-[11px] bg-muted/60 px-1.5 py-0.5 rounded text-primary block ml-3 mt-1 font-mono">
                            Example: {item.placeholderExample}
                          </code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ATS Considerations */}
              {review.atsConsiderations.length > 0 && (
                <Card className="shadow-xs">
                  <CardContent className="p-4 space-y-2">
                    <span className="font-bold text-xs text-foreground block border-b pb-1.5">
                      ATS Readability Considerations
                    </span>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {review.atsConsiderations.map((ats, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-semibold text-foreground shrink-0">
                            [{ats.category}]:
                          </span>
                          <span>{ats.recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* PANEL 3 (Cols 4): Bullet Rewrites & Reddit Comment Draft */}
        <div className="lg:col-span-4 space-y-4">
          {!review ? (
            <div className="border rounded-xl p-8 text-center bg-muted/10 space-y-2">
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-sm text-foreground">Bullet Rewrites & Response Draft</p>
              <p className="text-xs text-muted-foreground">
                Suggested rewrites and a ready-to-copy Reddit comment draft will appear here after analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Suggested Bullet Rewrites */}
              {review.bulletRewrites.length > 0 && (
                <Card className="shadow-xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-foreground">
                        Suggested Bullet Rewrites (Zero Fabrication)
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Placeholders Used
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {review.bulletRewrites.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-muted/20 border space-y-1.5 text-xs"
                        >
                          <div className="text-muted-foreground font-mono text-[11px] line-clamp-2">
                            <span className="font-semibold text-rose-600 block">Original:</span>
                            "{b.originalBullet}"
                          </div>
                          <div className="text-[11px] text-amber-700 dark:text-amber-400">
                            <span className="font-semibold">Issue:</span> {b.issue}
                          </div>
                          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <span className="font-bold block mb-0.5">Rewrite:</span>
                            {b.suggestedRewrite}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ready-to-Use Reddit Comment Draft */}
              <Card className="shadow-xs border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs text-primary flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Reddit Comment Draft
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        review.status === "COPIED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : review.status === "EDITED"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {review.status}
                    </Badge>
                  </div>

                  <Textarea
                    value={commentDraft}
                    onChange={e => setCommentDraft(e.target.value)}
                    rows={12}
                    className="font-mono text-xs leading-relaxed focus:ring-1 focus:ring-primary"
                  />

                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveDraft}
                      disabled={saving || !commentDraft.trim()}
                      className="text-xs"
                    >
                      {saving ? "Saving..." : "Save Edits"}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMarkPostedOpen(true)}
                        disabled={!commentDraft.trim()}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                        Mark as Posted
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleCopyComment}
                        disabled={!commentDraft.trim()}
                        className="bg-primary text-primary-foreground text-xs font-semibold px-4"
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
          )}
        </div>
      </div>

      {/* Mark As Posted Modal */}
      <MarkAsPostedModal
        isOpen={markPostedOpen}
        onClose={() => setMarkPostedOpen(false)}
        initialData={{
          opportunityId: opportunity.id,
          resumeReviewId: review?.id,
          subreddit: rawPost.subreddit,
          postTitle: rawPost.title,
          postUrl: fullRedditUrl,
          strategy: "RESUME_REVIEW",
          responseStyle: "DIRECT_CRITIQUE",
          topic: review?.targetRole || "Resume Review",
          humanEditedDraft: commentDraft,
          finalComment: commentDraft,
        }}
        onSuccess={() => {
          setFeedbackMessage("Marked as posted! You can now track performance in Posting History.")
          setReview(prev => (prev ? { ...prev, status: "POSTED" } : null))
        }}
      />
    </div>
  )
}
