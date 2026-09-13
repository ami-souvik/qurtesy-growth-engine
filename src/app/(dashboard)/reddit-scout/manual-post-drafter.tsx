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
  Image as ImageIcon,
  Trash2,
  Plus,
  Send,
  Info,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import {
  fetchRedditUrlDetailsAction,
  generateManualPostDraftAction,
  saveManualDraftEditsAction,
  markManualDraftCopiedAction,
} from "@/actions/reddit-manual-actions"
import { MarkAsPostedModal } from "@/components/reddit/mark-as-posted-modal"
import { CommentStrategy } from "@/lib/reddit-comment-assistant-service"

export function ManualPostDrafter() {
  // Input states
  const [redditUrl, setRedditUrl] = useState("")
  const [subreddit, setSubreddit] = useState("resumes")
  const [postTitle, setPostTitle] = useState("")
  const [postAuthor, setPostAuthor] = useState("")
  const [postBody, setPostBody] = useState("")
  const [attachedImages, setAttachedImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState("")
  const [strategy, setStrategy] = useState<CommentStrategy>("PAIN")
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
  const handleFetchUrl = () => {
    if (!redditUrl.trim()) return
    setFetchNotice(null)

    startFetchUrl(async () => {
      try {
        const result = await fetchRedditUrlDetailsAction(redditUrl.trim())
        if (result.success && result.data) {
          setSubreddit(result.data.subreddit || "resumes")
          setPostTitle(result.data.title)
          setPostBody(result.data.body)
          if (result.data.author) setPostAuthor(result.data.author)
          if (result.data.attachedImages && result.data.attachedImages.length > 0) {
            setAttachedImages(result.data.attachedImages)
          }
          setFetchNotice({
            type: "success",
            message: `Fetched post details${
              result.data.attachedImages.length > 0 ? ` and ${result.data.attachedImages.length} attached image(s)` : ""
            }.`,
          })
        } else {
          setFetchNotice({
            type: "error",
            message: result.error || "Could not fetch URL. You can enter or paste post details directly below.",
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

  // Add Image URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return
    setAttachedImages((prev) => [...prev, newImageUrl.trim()])
    setNewImageUrl("")
  }

  // Upload Local File Image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string
      if (dataUrl) {
        setAttachedImages((prev) => [...prev, dataUrl])
      }
    }
    reader.readAsDataURL(file)
  }

  // Remove Image
  const handleRemoveImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Generate AI Comment
  const handleDraftComment = () => {
    if (!postTitle.trim() || !subreddit.trim()) return

    startDrafting(async () => {
      try {
        const forceProductMention = mentionChoice === "auto" ? null : mentionChoice === "include"

        const res = await generateManualPostDraftAction({
          subreddit,
          title: postTitle,
          body: postBody,
          author: postAuthor,
          postUrl: redditUrl,
          attachedImages,
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
        alert(err.message || "Failed to generate comment draft.")
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
      {/* Left Column: Post Inputs & Controls */}
      <div className="lg:col-span-6 space-y-6">
        {/* Quick URL Fetch Bar */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Fetch from Reddit URL
            </CardTitle>
            <CardDescription className="text-xs">
              Paste a Reddit post link to auto-fill title, description, and attached images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.reddit.com/r/resumes/comments/..."
                value={redditUrl}
                onChange={(e) => setRedditUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                className="text-sm font-mono"
              />
              <Button onClick={handleFetchUrl} disabled={isFetchingUrl || !redditUrl.trim()} size="sm">
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Details"
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

        {/* Post Details Form */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Post Details</CardTitle>
            <CardDescription className="text-xs">
              Edit the details below or enter them manually if you don&apos;t have a URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="post-subreddit" className="text-xs font-medium">Subreddit</Label>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-1.5 font-mono">r/</span>
                  <Input
                    id="post-subreddit"
                    value={subreddit}
                    onChange={(e) => setSubreddit(e.target.value)}
                    placeholder="resumes"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="post-author" className="text-xs font-medium">Author (Optional)</Label>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-1.5 font-mono">u/</span>
                  <Input
                    id="post-author"
                    value={postAuthor}
                    onChange={(e) => setPostAuthor(e.target.value)}
                    placeholder="jobseeker99"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-title" className="text-xs font-medium">
                Post Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="post-title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g. Applied to 200 jobs with 0 interviews. What is wrong with my resume?"
                className="text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="post-body" className="text-xs font-medium">Post Body / Description</Label>
              <Textarea
                id="post-body"
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="Paste the post text, candidate background, or specific question..."
                rows={5}
                className="text-xs leading-relaxed"
              />
            </div>

            {/* Attached Images Section */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Attached Images & Screenshots ({attachedImages.length})
                </Label>
                <label className="cursor-pointer text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Upload Screenshot
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {attachedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {attachedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group border rounded-md p-1 bg-muted/30 flex flex-col items-center justify-center overflow-hidden h-24"
                    >
                      {/* Preview Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Attachment ${idx + 1}`}
                        className="max-h-full max-w-full object-contain rounded-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-destructive/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Or paste an image URL (e.g. preview.redd.it/...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddImageUrl()}
                  className="text-xs"
                />
                <Button variant="outline" size="sm" onClick={handleAddImageUrl} disabled={!newImageUrl.trim()}>
                  Add URL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy & Guidance Controls */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Comment Strategy & Tone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Core Strategy Angle</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "PAIN", label: "Troubleshooting / Pain", desc: "Root-cause ATS/parsing fix" },
                  { key: "RESUME_REVIEW", label: "Resume Critique", desc: "Impact metrics & layout check" },
                  { key: "GIVEAWAY", label: "Framework Giveaway", desc: "Complete manual step-by-step" },
                  { key: "ANTI_FAKE_AI", label: "Truthful AI", desc: "Authenticity & no hallucinations" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStrategy(item.key as CommentStrategy)}
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
                  { key: "auto", label: "Auto (Natural)", desc: "Include only if directly helpful" },
                  { key: "include", label: "Subtle Mention", desc: "10% max of comment" },
                  { key: "omit", label: "Omit Mention", desc: "100% value, no product name" },
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
              <Label htmlFor="post-custom-inst" className="text-xs font-medium">Founder Notes / Guidance (Optional)</Label>
              <Input
                id="post-custom-inst"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Focus on their experience section, recommend single-column markdown"
                className="text-xs"
              />
            </div>

            <Button
              onClick={handleDraftComment}
              disabled={isDrafting || !postTitle.trim()}
              className="w-full py-5 text-sm font-semibold shadow-xs"
            >
              {isDrafting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Authentic Comment Draft...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Draft Comment with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Generated Comment Output & Manual Posting */}
      <div className="lg:col-span-6 space-y-6">
        <Card className="border shadow-xs h-full flex flex-col">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Drafted Comment
              </CardTitle>
              <CardDescription className="text-xs">
                Review, edit, copy to clipboard, and paste manually into Reddit.
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
                {/* Meta summary pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary" className="flex items-center gap-1 font-normal">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    90/10 Ratio Verified
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

                {/* Editable Draft Textarea */}
                <div className="flex-1 min-h-[300px] flex flex-col">
                  <Textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Your generated draft will appear here..."
                    className="flex-1 font-mono text-xs leading-relaxed p-3.5 bg-muted/10 resize-y min-h-[320px]"
                  />
                </div>

                {/* Action Toolbar */}
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
                          Copy Comment
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
                    {redditUrl && (
                      <a href={redditUrl} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Open on Reddit
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
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold">No Draft Generated Yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Paste a Reddit post link on the left or fill in the details manually, then click{" "}
                  <strong className="text-foreground">Draft Comment with AI</strong>.
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
            postTitle,
            postUrl: redditUrl || `https://www.reddit.com/r/${subreddit}`,
            strategy,
            finalComment: draftText,
          }}
        />
      )}
    </div>
  )
}
