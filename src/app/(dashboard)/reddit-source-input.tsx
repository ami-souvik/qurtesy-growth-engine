"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Trash2, Loader2, Plus } from "lucide-react"
import { 
  addRedditCommunity, 
  removeRedditCommunity, 
  toggleRedditEnabled 
} from "@/actions/reddit-actions"
import { normalizeSubreddit } from "@/lib/reddit-utils"

type Community = {
  id: string
  name: string
  createdAt: Date
}

type RedditConfig = {
  enabled: boolean
  lastScanAt: Date | null
}

export function RedditSourceInput({
  initialConfig,
  initialCommunities,
}: {
  initialConfig: RedditConfig
  initialCommunities: Community[]
}) {
  const [isPending, startTransition] = useTransition()
  const [newSubreddit, setNewSubreddit] = useState("")

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      await toggleRedditEnabled(checked)
    })
  }

  const handleAdd = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault()
    if (!newSubreddit.trim()) return

    const normalized = normalizeSubreddit(newSubreddit)
    // Client-side duplicate check (optional, but good UX)
    if (initialCommunities.some((c) => c.name === normalized)) {
      setNewSubreddit("")
      return
    }

    startTransition(async () => {
      try {
        await addRedditCommunity(newSubreddit)
        setNewSubreddit("")
      } catch (err) {
        console.error("Failed to add subreddit:", err)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd(e)
    }
  }

  const handleRemove = (id: string) => {
    startTransition(async () => {
      await removeRedditCommunity(id)
    })
  }

  return (
    <div className="space-y-6 border rounded-md p-4 bg-muted/20">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-0.5">
          <Label className="text-base font-semibold">Enable Reddit Listener</Label>
          <p className="text-sm text-muted-foreground">
            Allow the system to scan configured subreddits for opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Switch 
            checked={initialConfig.enabled} 
            onCheckedChange={handleToggle} 
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Monitored Subreddits</Label>
          <p className="text-sm text-muted-foreground">
            The listener will scan these communities when enabled.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. resumes, r/jobs"
            value={newSubreddit}
            onChange={(e) => setNewSubreddit(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
          />
          <Button 
            type="button" 
            onClick={handleAdd}
            disabled={isPending || !newSubreddit.trim()}
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {initialCommunities.length === 0 ? (
            <div className="text-sm text-muted-foreground italic p-4 text-center border rounded-md border-dashed">
              No subreddits configured.
            </div>
          ) : (
            initialCommunities.map((community) => (
              <div 
                key={community.id} 
                className="flex items-center justify-between p-3 border rounded-md bg-background"
              >
                <span className="font-mono text-sm font-medium flex items-center gap-2">
                  <span className="text-muted-foreground">r/</span>
                  {community.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(community.id)}
                  disabled={isPending}
                  title="Remove subreddit"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {initialConfig.lastScanAt && (
          <p className="text-xs text-muted-foreground">
            Last successful scan: {new Date(initialConfig.lastScanAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
