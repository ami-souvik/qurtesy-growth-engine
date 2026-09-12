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
import { Label } from "@/components/ui/label"
import { updatePostPerformance } from "@/actions/reddit-post-history-actions"
import { PostedCommentRecord } from "@/lib/reddit-learning-service"
import { BarChart3, CheckCircle2, ExternalLink, Loader2, Sparkles, TrendingUp } from "lucide-react"

export interface UpdatePerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  post: PostedCommentRecord
  onSuccess?: () => void
}

export function UpdatePerformanceModal({
  isOpen,
  onClose,
  post,
  onSuccess,
}: UpdatePerformanceModalProps) {
  const [upvotes, setUpvotes] = useState(post.upvotes ?? 0)
  const [replies, setReplies] = useState(post.replies ?? 0)
  const [profileVisits, setProfileVisits] = useState(post.profileVisits ?? 0)
  const [qurtesyClicks, setQurtesyClicks] = useState(post.qurtesyClicks ?? 0)
  const [qurtesySessions, setQurtesySessions] = useState(post.qurtesySessions ?? 0)
  const [builderStarts, setBuilderStarts] = useState(post.builderStarts ?? 0)
  const [tailoringStarts, setTailoringStarts] = useState(post.tailoringStarts ?? 0)
  const [otherProductActions, setOtherProductActions] = useState(post.otherProductActions ?? 0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await updatePostPerformance({
        id: post.id,
        upvotes: Number(upvotes) || 0,
        replies: Number(replies) || 0,
        profileVisits: Number(profileVisits) || 0,
        qurtesyClicks: Number(qurtesyClicks) || 0,
        qurtesySessions: Number(qurtesySessions) || 0,
        builderStarts: Number(builderStarts) || 0,
        tailoringStarts: Number(tailoringStarts) || 0,
        otherProductActions: Number(otherProductActions) || 0,
      })

      setSuccess(true)
      if (onSuccess) onSuccess()
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1200)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to update performance metrics.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Update Post Performance
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Record actual observed engagement and downstream product conversions. No automated scraping is used.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 animate-bounce" />
            <p className="font-semibold text-sm text-foreground">Metrics Updated!</p>
            <p className="text-xs text-muted-foreground">Analytics and empirical learnings updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Post Summary & Link */}
            <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs">r/{post.subreddit}</span>
                <a
                  href={post.postedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-[11px] flex items-center gap-1 font-medium"
                >
                  <span>View on Reddit</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-muted-foreground line-clamp-1 text-xs">{post.postTitle}</p>
            </div>

            {/* Engagement Metrics (Reddit Side) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                Reddit Engagement Metrics
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Upvotes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={upvotes}
                    onChange={e => setUpvotes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Replies</Label>
                  <Input
                    type="number"
                    min={0}
                    value={replies}
                    onChange={e => setReplies(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Profile Visits</Label>
                  <Input
                    type="number"
                    min={0}
                    value={profileVisits}
                    onChange={e => setProfileVisits(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Downstream Product Growth Funnel */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Downstream Qurtesy Conversions
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Record real user actions initiated from this post (via referrer tags or direct candidate confirmation).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Qurtesy Clicks</Label>
                  <Input
                    type="number"
                    min={0}
                    value={qurtesyClicks}
                    onChange={e => setQurtesyClicks(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Site Sessions</Label>
                  <Input
                    type="number"
                    min={0}
                    value={qurtesySessions}
                    onChange={e => setQurtesySessions(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">Resume Builder Starts</Label>
                  <Input
                    type="number"
                    min={0}
                    value={builderStarts}
                    onChange={e => setBuilderStarts(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-mono border-emerald-500/30 bg-emerald-50/20"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">Job Tailoring Starts</Label>
                  <Input
                    type="number"
                    min={0}
                    value={tailoringStarts}
                    onChange={e => setTailoringStarts(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-mono border-emerald-500/30 bg-emerald-50/20"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-[11px]">Other Product Actions (e.g. downloads, signups)</Label>
                <Input
                  type="number"
                  min={0}
                  value={otherProductActions}
                  onChange={e => setOtherProductActions(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
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
                className="bg-primary text-primary-foreground text-xs font-semibold"
              >
                {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Save Performance
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
