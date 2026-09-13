"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Send,
  Info,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  MessageSquareReply,
} from "lucide-react"
import {
  fetchRedditUrlDetailsAction,
  generateManualCommentReplyDraftAction,
  saveManualDraftEditsAction,
  markManualDraftCopiedAction,
} from "@/actions/reddit-manual-actions"
import { MarkAsPostedModal } from "@/components/reddit/mark-as-posted-modal"
import { CommentReplyStrategy } from "@/lib/ai/prompts/reddit-comment-reply-prompts"

export function CommentReplyDrafter() {
  // Post context states
  const [threadUrl, setThreadUrl] = useState("")
  const [subreddit, setSubreddit] = useState("resumes")
  const [postTitle, setPostTitle] = useState("")
  const [postAuthor, setPostAuthor] = useState("")
  const [postBody, setPostBody] = useState("")

  // Target comment states
  const [targetCommentAuthor, setTargetCommentAuthor] = useState("")
  const [targetCommentBody, setTargetCommentBody] = useState("")

  // Strategy & controls
  const [strategy, setStrategy] = useState<CommentReplyStrategy>("DEBUNK_MYTH")
  const [mentionChoice, setMentionChoice] = useState<"auto" | "include" | "omit">("auto")
  const [customInstructions, setCustomInstructions] = useState("")

  // Operation states
  const [isFetchingUrl, startFetchUrl] = useTransition()
  const [isDrafting, startDrafting] = useTransition()
  const [fetchNotice, setFetchNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  // Draft result states
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState("")
  const [valueSummary, setValueSummary] = useState("")
  const [productReason, setProductReason] = useState("")
  const [hasMention, setHasMention] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [markPostedOpen, setMarkPostedOpen] = useState(false)

  // URL Fetch Handler
  const handleFetchThread = () => {
    if (!threadUrl.trim()) return
    setFetchNotice(null)

    startFetchUrl(async () => {
      try {
        const result = await fetchRedditUrlDetailsAction(threadUrl.trim())
        if (result.success && result.data) {
          setSubreddit(result.data.subreddit || "resumes")
          setPostTitle(result.data.title)
          setPostBody(result.data.body)
          if (result.data.author) setPostAuthor(result.data.author)

          if (result.data.targetComment) {
            setTargetCommentAuthor(result.data.targetComment.author)
            setTargetCommentBody(result.data.targetComment.body)
            setFetchNotice({
              type: "success",
              message: `Fetched thread and target comment by u/${result.data.targetComment.author}.`,
            })
          } else {
            setFetchNotice({
              type: "success",
              message: "Fetched post thread context. Paste the specific comment text you wish to reply to below.",
            })
          }
        } else {
          setFetchNotice({
            type: "error",
            message: result.error || "Could not fetch URL. You can enter or paste the thread and comment details below.",
          })
        }
      } catch (err: any) {
        setFetchNotice({
          type: "error",
          message: err.message || "Failed to connect to Reddit. You can enter details manually.",
        })
      }
    })
  }

  // Generate AI Reply
  const handleDraftReply = () => {
    if (!postTitle.trim() || !targetCommentBody.trim()) return

    startDrafting(async () => {
      try {
        const forceProductMention = mentionChoice === "auto" ? null : mentionChoice === "include"

        const res = await generateManualCommentReplyDraftAction({
          subreddit,
          postTitle,
          postBody,
          postAuthor,
          postUrl: threadUrl,
          targetCommentAuthor,
          targetCommentBody,
          strategy,
          forceProductMention,
          customInstructions,
          existingDraftId: draftId,
        })

        if (res.success && res.response) {
          setDraftId(res.draftId)
          setDraftText(res.response.commentDraft)
          setValueSummary(res.response.valueProvidedSummary)
          setHasMention(res.response.includeProductMention)
          setProductReason(res.response.productMentionReason)
          setSaveSuccess(false)
        }
      } catch (err: any) {
        alert(err.message || "Failed to generate comment reply.")
      }
    })
  }

  // Copy to Clipboard
  const handleCopy = async () => {
    if (!draftText.trim()) return
    try {
      await navigator.clipboard.writeText(draftText)
      setCopied(true)
      if (draftId) {
        await markManualDraftCopiedAction(draftId)
      }
      setTimeout(() => setCopied(false), 3000)
    } catch {
      alert("Failed to copy to clipboard.")
    }
  }

  // Save Edits
  const handleSaveEdits = async () => {
    if (!draftId || !draftText.trim()) return
    try {
      await saveManualDraftEditsAction(draftId, draftText)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      alert("Failed to save draft edits.")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Thread & Comment Inputs */}
      <div className="lg:col-span-6 space-y-6">
        {/* Quick URL Fetch Bar */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Fetch Thread from URL
            </CardTitle>
            <CardDescription className="text-xs">
              Paste a Reddit post link or comment permalink to auto-fill thread context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.reddit.com/r/resumes/comments/.../comment/..."
                value={threadUrl}
                onChange={(e) => setThreadUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchThread()}
                className="text-sm font-mono"
              />
              <Button onClick={handleFetchThread} disabled={isFetchingUrl || !threadUrl.trim()} size="sm">
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Thread"
                )}
              </Button>
            </div>

            {fetchNotice && (
              <div
                className={`text-xs p-2.5 rounded-md flex items-start gap-2 ${
                  fetchNotice.type === "success"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : fetchNotice.type === "error"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{fetchNotice.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent Thread Context */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">1. Parent Post Context</CardTitle>
            <CardDescription className="text-xs">
              The overarching discussion topic the comment was posted under.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reply-sub" className="text-xs font-medium">Subreddit</Label>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-1.5 font-mono">r/</span>
                  <Input
                    id="reply-sub"
                    value={subreddit}
                    onChange={(e) => setSubreddit(e.target.value)}
                    placeholder="resumes"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reply-op" className="text-xs font-medium">Post Author (OP)</Label>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-1.5 font-mono">u/</span>
                  <Input
                    id="reply-op"
                    value={postAuthor}
                    onChange={(e) => setPostAuthor(e.target.value)}
                    placeholder="original_poster"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reply-post-title" className="text-xs font-medium">
                Post Title / Thread Topic <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reply-post-title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g. Workday parsing errors - is single column necessary?"
                className="text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reply-post-body" className="text-xs font-medium">Post Body (Optional Context)</Label>
              <Textarea
                id="reply-post-body"
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="Brief summary or excerpt of OP's situation..."
                rows={2}
                className="text-xs leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Comment Details */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquareReply className="h-4 w-4 text-primary" />
              2. Target Comment to Reply To
            </CardTitle>
            <CardDescription className="text-xs">
              The specific comment text you want to address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <Label htmlFor="reply-comment-author" className="text-xs font-medium">Commenter Username (Optional)</Label>
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground mr-1.5 font-mono">u/</span>
                <Input
                  id="reply-comment-author"
                  value={targetCommentAuthor}
                  onChange={(e) => setTargetCommentAuthor(e.target.value)}
                  placeholder="skeptical_recruiter"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reply-comment-body" className="text-xs font-medium">
                Comment Text <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reply-comment-body"
                value={targetCommentBody}
                onChange={(e) => setTargetCommentBody(e.target.value)}
                placeholder="e.g. 'Recruiters just look at PDFs, ATS scores are made up by resume companies to scare people. Don't worry about tables.'"
                rows={4}
                className="text-xs leading-relaxed font-sans"
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-medium">Reply Strategy & Angle</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "DEBUNK_MYTH", label: "Debunk Myth with Facts", desc: "Calmly clarify ATS database mechanics" },
                  { key: "PRACTICAL_ADVICE", label: "Practical Fix", desc: "Direct troubleshooting steps" },
                  { key: "CONSTRUCTIVE_CLARIFICATION", label: "Constructive Nuance", desc: "Collaborative peer perspective" },
                  { key: "EMPATHETIC_SUPPORT", label: "Empathetic Support", desc: "Acknowledge frustration & uplift" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStrategy(item.key as CommentReplyStrategy)}
                    className={`p-2.5 text-left rounded-md border text-xs transition-all ${
                      strategy === item.key
                        ? "border-primary bg-primary/5 text-foreground font-medium shadow-2xs"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Qurtesy Mention Directive</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "auto", label: "Auto (Natural)", desc: "Include only if helpful" },
                  { key: "include", label: "Subtle Mention", desc: "10% max of reply" },
                  { key: "omit", label: "Omit Mention", desc: "No product name" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMentionChoice(opt.key as any)}
                    className={`p-2 text-center rounded-md border text-xs transition-all ${
                      mentionChoice === opt.key
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reply-custom-inst" className="text-xs font-medium">Founder Notes (Optional)</Label>
              <Input
                id="reply-custom-inst"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Agree that ATS score is marketing fluff, but explain how table text scrambles in databases"
                className="text-xs"
              />
            </div>

            <Button
              onClick={handleDraftReply}
              disabled={isDrafting || !postTitle.trim() || !targetCommentBody.trim()}
              className="w-full py-5 text-sm font-semibold shadow-xs"
            >
              {isDrafting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Drafting Contextual Reply...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Draft Comment Reply with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Generated Reply Output & Posting */}
      <div className="lg:col-span-6 space-y-6">
        <Card className="border shadow-xs h-full flex flex-col">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquareReply className="h-4 w-4 text-primary" />
                Drafted Reply
              </CardTitle>
              <CardDescription className="text-xs">
                Tailored response addressing the specific commenter within the thread.
              </CardDescription>
            </div>
            {draftText && (
              <Badge variant="outline" className="text-xs font-mono">
                {strategy}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-4 flex flex-col space-y-4">
            {draftText ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="flex items-center gap-1 font-normal">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Authentic & Value-First
                  </Badge>
                  {hasMention ? (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Product Mention: {productReason || "Natural"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No Product Mention
                    </Badge>
                  )}
                  {valueSummary && (
                    <span className="text-muted-foreground text-[11px] truncate max-w-xs">
                      Value: {valueSummary}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-h-[300px] flex flex-col">
                  <Textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Your drafted reply will appear here..."
                    className="flex-1 font-mono text-xs leading-relaxed p-3.5 bg-muted/10 resize-y min-h-[320px]"
                  />
                </div>

                <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCopy} size="sm" className="font-semibold">
                      {copied ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy Reply
                        </>
                      )}
                    </Button>

                    <Button variant="outline" size="sm" onClick={handleSaveEdits} disabled={!draftId}>
                      {saveSuccess ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                          Saved!
                        </>
                      ) : (
                        "Save Edits"
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {threadUrl && (
                      <a href={threadUrl} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Open Thread
                        </Button>
                      </a>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setMarkPostedOpen(true)}
                      className="font-medium text-xs"
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Mark as Posted
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-[380px] flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/10">
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                  <MessageSquareReply className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold">No Reply Drafted Yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Add the thread context and target comment text on the left, then click{" "}
                  <strong className="text-foreground">Draft Comment Reply with AI</strong>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mark as Posted Modal */}
      {markPostedOpen && (
        <MarkAsPostedModal
          isOpen={markPostedOpen}
          onClose={() => setMarkPostedOpen(false)}
          initialData={{
            subreddit,
            postTitle: `Reply to u/${targetCommentAuthor || "user"}: ${postTitle}`,
            postUrl: threadUrl || `https://www.reddit.com/r/${subreddit}`,
            strategy,
            finalComment: draftText,
          }}
        />
      )}
    </div>
  )
}
