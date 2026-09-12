"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink, Flame, ShieldAlert, CheckCircle2, Bookmark, EyeOff, Sparkles, Filter, MessageSquarePlus } from "lucide-react"
import { updateOpportunityStatus } from "@/actions/reddit-intelligence-actions"


export interface OpportunityItem {
  id: string
  postId: string
  opportunityType: string
  priority: string
  opportunityScore: number
  painScore: number
  intentScore: number
  relevanceScore: number
  helpfulnessScore: number
  freshnessScore: number
  promotionalRisk: string
  confidence: number
  recommendedAngle: string
  reasoning: string | null
  riskFlags: string | null
  status: string
  analysisVersion: string
  modelUsed: string | null
  analyzedAt: Date | string | number
  rawPost: {
    redditPostId: string
    subreddit: string
    title: string
    body: string | null
    permalink: string
    author: string | null
    score: number | null
    commentCount: number | null
    createdUtc: Date | string | number
  }
}

type FilterTab = "ALL" | "HIGH_PRIORITY" | "PAIN" | "GIVEAWAY" | "RESUME_REVIEW" | "ANTI_FAKE_AI" | "IGNORE"
type SortOrder = "SCORE" | "NEWEST"

function formatRelativeTime(dateInput: Date | string | number): string {
  const dateMs = typeof dateInput === "number" ? dateInput : new Date(dateInput).getTime()
  const seconds = Math.floor((Date.now() - dateMs) / 1000)

  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getPriorityBadgeStyle(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
    case "MEDIUM":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
    case "LOW":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
    case "IGNORE":
      return "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

function getTypeBadgeStyle(type: string) {
  switch (type) {
    case "PAIN":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
    case "GIVEAWAY":
      return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
    case "RESUME_REVIEW":
      return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300"
    case "ANTI_FAKE_AI":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300"
    case "IGNORE":
      return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function OpportunityList({ initialOpportunities }: { initialOpportunities: OpportunityItem[] }) {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(initialOpportunities)
  const [filter, setFilter] = useState<FilterTab>("ALL")
  const [sort, setSort] = useState<SortOrder>("SCORE")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return opportunities
      .filter(item => {
        // Tab filter
        if (filter === "HIGH_PRIORITY" && item.priority !== "HIGH") return false
        if (filter === "PAIN" && item.opportunityType !== "PAIN") return false
        if (filter === "GIVEAWAY" && item.opportunityType !== "GIVEAWAY") return false
        if (filter === "RESUME_REVIEW" && item.opportunityType !== "RESUME_REVIEW") return false
        if (filter === "ANTI_FAKE_AI" && item.opportunityType !== "ANTI_FAKE_AI") return false
        if (filter === "IGNORE" && item.opportunityType !== "IGNORE") return false
        if (filter === "ALL" && item.opportunityType === "IGNORE") return false // By default hide ignored in "ALL" unless explicitly requested

        // Text search
        if (search.trim()) {
          const q = search.toLowerCase()
          const matchesTitle = item.rawPost.title.toLowerCase().includes(q)
          const matchesSub = item.rawPost.subreddit.toLowerCase().includes(q)
          const matchesAngle = item.recommendedAngle.toLowerCase().includes(q)
          if (!matchesTitle && !matchesSub && !matchesAngle) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sort === "NEWEST") {
          const dateA = new Date(a.rawPost.createdUtc).getTime()
          const dateB = new Date(b.rawPost.createdUtc).getTime()
          return dateB - dateA
        }
        return b.opportunityScore - a.opportunityScore
      })
  }, [opportunities, filter, sort, search])

  const handleStatusChange = async (id: string, nextStatus: "DISCOVERED" | "SAVED" | "DISMISSED") => {
    setOpportunities(prev =>
      prev.map(item => (item.id === id ? { ...item, status: nextStatus } : item))
    )
    try {
      await updateOpportunityStatus(id, nextStatus)
    } catch (err) {
      console.error(err)
    }
  }

  const filterTabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: "ALL", label: "Active Opportunities" },
    { id: "HIGH_PRIORITY", label: "High Priority" },
    { id: "PAIN", label: "User Pain" },
    { id: "GIVEAWAY", label: "Giveaway / Free Help" },
    { id: "RESUME_REVIEW", label: "Resume Review" },
    { id: "ANTI_FAKE_AI", label: "Anti-Fake AI" },
    { id: "IGNORE", label: "Ignored / Filtered" },
  ]

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === tab.id
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort & Search */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-md border bg-background w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOrder)}
            className="px-2.5 py-1.5 text-xs rounded-md border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="SCORE">Sort: Opportunity Score</option>
            <option value="NEWEST">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {filtered.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground space-y-2 bg-muted/10">
          <Filter className="mx-auto h-8 w-8 opacity-40 mb-2" />
          <p className="font-medium text-base text-foreground">No opportunities matching this filter.</p>
          <p className="text-sm">
            {filter === "IGNORE"
              ? "No posts have been ignored yet."
              : "Try switching filters or click 'Analyze Opportunities' to scan fresh posts."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(opp => {
            const hasEngagement =
              opp.rawPost.score !== null &&
              opp.rawPost.score !== undefined &&
              opp.rawPost.commentCount !== null &&
              opp.rawPost.commentCount !== undefined

            let riskFlagsList: string[] = []
            try {
              if (opp.riskFlags) riskFlagsList = JSON.parse(opp.riskFlags)
            } catch {}

            return (
              <Card
                key={opp.id}
                className={`transition-all hover:shadow-md border-l-4 ${
                  opp.priority === "HIGH"
                    ? "border-l-emerald-500"
                    : opp.priority === "MEDIUM"
                    ? "border-l-amber-500"
                    : opp.priority === "LOW"
                    ? "border-l-blue-500"
                    : "border-l-zinc-300"
                }`}
              >
                <CardContent className="p-5 space-y-3.5">
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                        r/{opp.rawPost.subreddit}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        by {opp.rawPost.author ? `u/${opp.rawPost.author}` : "Anonymous"}
                      </span>

                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        • {formatRelativeTime(opp.rawPost.createdUtc)}
                      </span>

                      {/* Engagement: Strictly displays "Engagement data unavailable" if null, never zero */}
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-muted/40 font-mono">
                        {hasEngagement ? (
                          <span>
                            ▲ {opp.rawPost.score} • {opp.rawPost.commentCount} comments
                          </span>
                        ) : (
                          <span className="italic text-[11px] text-muted-foreground/80">
                            Engagement data unavailable
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Opportunity Type & Priority Badges */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs font-semibold ${getTypeBadgeStyle(opp.opportunityType)}`}>
                        {opp.opportunityType.replace(/_/g, " ")}
                      </Badge>

                      <Badge variant="outline" className={`text-xs font-bold ${getPriorityBadgeStyle(opp.priority)}`}>
                        {opp.priority} PRIORITY
                      </Badge>

                      <div className="flex items-center gap-1 font-mono font-bold text-xs bg-muted/80 px-2 py-1 rounded">
                        <Flame className="h-3.5 w-3.5 text-amber-500" />
                        <span>{opp.opportunityScore}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Title with Source Traceability Link */}
                  <div>
                    <a
                      href={opp.rawPost.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors flex items-start gap-1.5 group"
                    >
                      <span className="group-hover:underline">{opp.rawPost.title}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 mt-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {opp.rawPost.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {opp.rawPost.body}
                      </p>
                    )}
                  </div>

                  {/* Recommended Angle Callout (The Strategic Value for Founder) */}
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Recommended Response Angle:</span>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {opp.recommendedAngle}
                    </p>
                  </div>

                  {/* Sub-scores, Risk & Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
                    {/* Dimension Breakdown */}
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground font-mono">
                      <span title="Pain score (0-10)">Pain: <b className="text-foreground">{opp.painScore}/10</b></span>
                      <span>•</span>
                      <span title="Intent score (0-10)">Intent: <b className="text-foreground">{opp.intentScore}/10</b></span>
                      <span>•</span>
                      <span title="Relevance to Qurtesy (0-10)">Relevance: <b className="text-foreground">{opp.relevanceScore}/10</b></span>
                      <span>•</span>
                      <span title="Confidence score">Confidence: <b className="text-foreground">{opp.confidence}%</b></span>
                    </div>

                    {/* Risk Badge & Actions */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        opp.promotionalRisk === "LOW"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : opp.promotionalRisk === "MEDIUM"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {opp.promotionalRisk} Risk
                      </span>

                      {/* Draft Comment Action */}
                      <Link href={`/reddit-scout/draft/${opp.id}`}>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-semibold"
                        >
                          <MessageSquarePlus className="h-3.5 w-3.5 mr-1" /> Draft Comment
                        </Button>
                      </Link>

                      {/* Status Toggle Buttons */}
                      {opp.status === "DISCOVERED" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handleStatusChange(opp.id, "SAVED")}
                          >
                            <Bookmark className="h-3.5 w-3.5 mr-1" /> Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-rose-600"
                            onClick={() => handleStatusChange(opp.id, "DISMISSED")}
                          >
                            <EyeOff className="h-3.5 w-3.5 mr-1" /> Dismiss
                          </Button>
                        </>
                      )}

                      {opp.status === "SAVED" && (
                        <span className="flex items-center text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Saved
                        </span>
                      )}

                      {opp.status === "DISMISSED" && (
                        <span className="text-xs text-muted-foreground italic">Dismissed</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
