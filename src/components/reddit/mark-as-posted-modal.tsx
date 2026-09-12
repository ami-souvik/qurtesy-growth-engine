"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { recordPostedComment } from "@/actions/reddit-post-history-actions"
import { PostedCommentRecord } from "@/lib/reddit-learning-service"
import { CheckCircle2, Loader2, Send, ShieldAlert, Sparkles } from "lucide-react"

export interface MarkAsPostedModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (record: PostedCommentRecord) => void
  initialData: {
    opportunityId?: string
    commentDraftId?: string
    resumeReviewId?: string
    subreddit: string
    postTitle: string
    postUrl: string
    strategy: string
    responseStyle?: string
    topic?: string
    aiDraft?: string
    humanEditedDraft?: string
    finalComment: string
  }
}

export function MarkAsPostedModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: MarkAsPostedModalProps) {
  const [postedUrl, setPostedUrl] = useState("")
  const [postedAt, setPostedAt] = useState(() => {
    const now = new Date()
    // format as YYYY-MM-DDTHH:mm
    return now.toISOString().slice(0, 16)
  })
  const [strategy, setStrategy] = useState(initialData.strategy || "PAIN")
  const [responseStyle, setResponseStyle] = useState(initialData.responseStyle || "VALUE_ONLY")
  const [topic, setTopic] = useState(initialData.topic || "")
  const [finalComment, setFinalComment] = useState(initialData.finalComment || "")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postedUrl.trim()) {
      setError("Please provide the direct Reddit comment or thread URL.")
      return
    }
    if (!finalComment.trim()) {
      setError("Final comment content cannot be empty.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const record = await recordPostedComment({
        opportunityId: initialData.opportunityId,
        commentDraftId: initialData.commentDraftId,
        resumeReviewId: initialData.resumeReviewId,
        subreddit: initialData.subreddit,
        postTitle: initialData.postTitle,
        postUrl: initialData.postUrl,
        postedUrl: postedUrl.trim(),
        postedAt: new Date(postedAt),
        strategy,
        responseStyle: responseStyle || undefined,
        topic: topic.trim() || undefined,
        notes: notes.trim() || undefined,
        aiDraft: initialData.aiDraft,
        humanEditedDraft: initialData.humanEditedDraft,
        finalPostedComment: finalComment.trim(),
      })

      setSuccess(true)
      if (onSuccess) {
        onSuccess(record)
      }
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error("Failed to record posted comment:", err)
      setError(err.message || "Failed to save posted comment. Please check your inputs.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-bold flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-600" />
            Mark as Posted to Reddit
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Record the exact comment you manually published to Reddit. This preserves versions (AI Draft, Human Edit, Final) and enables empirical performance tracking.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 animate-bounce" />
            <p className="font-semibold text-sm text-foreground">Post Recorded Successfully!</p>
            <p className="text-xs text-muted-foreground">
              You can now track upvotes, replies, profile visits, and downstream Qurtesy actions in Posting History.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Target Post Context */}
            <div className="p-2.5 rounded-md bg-muted/40 border space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">r/{initialData.subreddit}</span>
                <span>•</span>
                <span className="line-clamp-1">{initialData.postTitle}</span>
              </div>
            </div>

            {/* Direct Comment URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Direct Reddit Comment URL <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="url"
                required
                placeholder="https://www.reddit.com/r/resumes/comments/.../comment/..."
                value={postedUrl}
                onChange={e => setPostedUrl(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Copy the link to your specific published comment or the thread URL.
              </p>
            </div>

            {/* Strategy & Posted At Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Strategy Used</Label>
                <select
                  value={strategy}
                  onChange={e => setStrategy(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="PAIN">PAIN (Problem diagnosis + practical fix)</option>
                  <option value="GIVEAWAY">GIVEAWAY (Complete manual solution)</option>
                  <option value="RESUME_REVIEW">RESUME_REVIEW (Actionable bullet critique)</option>
                  <option value="ANTI_FAKE_AI">ANTI_FAKE_AI (Truthful AI guidance)</option>
                  <option value="OTHER">OTHER (General community reply)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Posted Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={postedAt}
                  onChange={e => setPostedAt(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Topic & Response Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Core Topic / Keyword</Label>
                <Input
                  type="text"
                  placeholder="e.g. ATS layout, Workday parsing, Bullet metrics"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Response Style</Label>
                <select
                  value={responseStyle}
                  onChange={e => setResponseStyle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="VALUE_ONLY">100% Pure Value (No Product Mention)</option>
                  <option value="SHORTCUT_MENTION">Value First + Optional Product Shortcut</option>
                  <option value="DIRECT_CRITIQUE">Detailed Line-by-Line Critique</option>
                  <option value="FRAMEWORK_GIVEAWAY">Self-Contained Framework Template</option>
                </select>
              </div>
            </div>

            {/* Final Comment Text Posted */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Final Posted Comment (Preserved Version) <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Markdown supported</span>
              </div>
              <Textarea
                required
                rows={6}
                value={finalComment}
                onChange={e => setFinalComment(e.target.value)}
                className="font-mono text-xs leading-relaxed"
                placeholder="The exact text that was published to Reddit..."
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Founder Notes (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. OP replied within 5 minutes asking about single column formatting"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Policy Reminder */}
            <div className="flex items-start gap-2 bg-muted/50 p-2.5 rounded-md text-[11px] text-muted-foreground border">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Manual tracking only. Qurtesy never connects to your Reddit account or posts automatically.
              </span>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={loading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {loading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save to Posting History
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
