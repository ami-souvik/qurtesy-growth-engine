"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PostedCommentRecord } from "@/lib/reddit-learning-service"
import { History, Bot, User, Send, Check } from "lucide-react"

export interface PreservedVersionsModalProps {
  isOpen: boolean
  onClose: () => void
  post: PostedCommentRecord
}

export function PreservedVersionsModal({
  isOpen,
  onClose,
  post,
}: PreservedVersionsModalProps) {
  const [activeTab, setActiveTab] = useState<string>("final")

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Preserved Draft Versions
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Compare the original AI suggestion, founder edits, and final published comment to evaluate human calibration.
          </DialogDescription>
        </DialogHeader>

        {/* Post Metadata Header */}
        <div className="p-3 rounded-lg bg-muted/40 border space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              r/{post.subreddit}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">
              {post.strategy}
            </Badge>
            {post.responseStyle && (
              <span className="text-[11px] text-muted-foreground">
                • {post.responseStyle.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <p className="font-medium text-foreground line-clamp-1">{post.postTitle}</p>
        </div>

        {/* Tabs for Versions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="grid grid-cols-3 w-full text-xs">
            <TabsTrigger value="ai" className="flex items-center gap-1.5 text-xs">
              <Bot className="h-3.5 w-3.5 text-blue-500" />
              <span>1. AI Draft</span>
            </TabsTrigger>
            <TabsTrigger value="human" className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-amber-500" />
              <span>2. Human Edit</span>
            </TabsTrigger>
            <TabsTrigger value="final" className="flex items-center gap-1.5 text-xs">
              <Send className="h-3.5 w-3.5 text-emerald-600" />
              <span>3. Final Posted</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Draft Content */}
          <TabsContent value="ai" className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-1">
              <span>Original Pristine AI Suggestion (Unmodified)</span>
              <Badge variant="outline" className="text-[10px]">Generated</Badge>
            </div>
            {post.aiDraft ? (
              <pre className="p-3.5 rounded-lg bg-muted/30 border font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {post.aiDraft}
              </pre>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-xs italic bg-muted/10 rounded-lg">
                No initial AI draft was recorded for this post (direct human draft).
              </div>
            )}
          </TabsContent>

          {/* Human Edited Draft Content */}
          <TabsContent value="human" className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-1">
              <span>Founder Calibration & Edits (Pre-Copy)</span>
              <Badge variant="outline" className="text-[10px]">Edited</Badge>
            </div>
            {post.humanEditedDraft ? (
              <pre className="p-3.5 rounded-lg bg-muted/30 border font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {post.humanEditedDraft}
              </pre>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-xs italic bg-muted/10 rounded-lg">
                No intermediate human edits were recorded.
              </div>
            )}
          </TabsContent>

          {/* Final Posted Comment Content */}
          <TabsContent value="final" className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-1">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Exact Comment Published to Reddit
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                Live Version
              </Badge>
            </div>
            <pre className="p-3.5 rounded-lg bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-500/20 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {post.finalPostedComment}
            </pre>
            {post.notes && (
              <div className="p-2.5 rounded-md bg-muted/40 border text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Founder Notes: </span>
                {post.notes}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
