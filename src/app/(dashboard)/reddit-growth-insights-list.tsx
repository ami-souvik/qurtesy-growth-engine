"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ExternalLink,
  Flame,
  MessageSquareQuote,
  Sparkles,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RotateCcw,
} from "lucide-react"
import { ParsedRedditGrowthInsight } from "@/actions/data-source-actions"

type FilterTab = "ALL" | "REPEATED" | "EMERGING" | "PAIN" | "THEME"

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

function getEvidenceBadgeStyle(status: string) {
  switch (status) {
    case "Repeated":
      return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300"
    case "Emerging":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
    case "Observed":
      return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300"
    case "Hypothesis":
      return "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getCategoryBadgeStyle(category: string) {
  switch (category) {
    case "RECURRING_PAIN":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
    case "EMERGING_THEME":
      return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
    case "OPPORTUNITY_CLUSTER":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
    case "FEATURE_REQUEST":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function RedditGrowthInsightsList({
  insights,
}: {
  insights: ParsedRedditGrowthInsight[]
}) {
  const [filter, setFilter] = useState<FilterTab>("ALL")
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedSources(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filtered = useMemo(() => {
    return insights.filter(item => {
      if (filter === "REPEATED" && item.evidenceStatus !== "Repeated") return false
      if (filter === "EMERGING" && item.evidenceStatus !== "Emerging") return false
      if (filter === "PAIN" && item.category !== "RECURRING_PAIN") return false
      if (
        filter === "THEME" &&
        item.category !== "EMERGING_THEME" &&
        item.category !== "OPPORTUNITY_CLUSTER"
      ) {
        return false
      }
      return true
    })
  }, [insights, filter])

  if (insights.length === 0) {
    return (
      <div className="border rounded-xl p-8 text-center bg-muted/10 space-y-3">
        <Layers className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground text-sm">No Reddit Growth Insights Generated Yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Scan and classify Reddit discussions in Reddit Scout, then click "Generate Intelligence" to synthesize recurring friction and candidate vocabulary.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b pb-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === "ALL"
              ? "bg-foreground text-background"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          All Insights ({insights.length})
        </button>
        <button
          onClick={() => setFilter("REPEATED")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === "REPEATED"
              ? "bg-purple-600 text-white"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          Repeated (3+)
        </button>
        <button
          onClick={() => setFilter("EMERGING")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === "EMERGING"
              ? "bg-amber-600 text-white"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          Emerging
        </button>
        <button
          onClick={() => setFilter("PAIN")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === "PAIN"
              ? "bg-rose-600 text-white"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          Recurring Pain
        </button>
        <button
          onClick={() => setFilter("THEME")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === "THEME"
              ? "bg-indigo-600 text-white"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          Themes & Clusters
        </button>
      </div>

      {/* Insights Cards */}
      <div className="space-y-4">
        {filtered.map(item => {
          const isExpanded = !!expandedSources[item.id]

          return (
            <Card
              key={item.id}
              className={`border-l-4 transition-shadow hover:shadow-sm ${
                item.evidenceStatus === "Repeated"
                  ? "border-l-purple-500"
                  : item.evidenceStatus === "Emerging"
                  ? "border-l-amber-500"
                  : item.evidenceStatus === "Observed"
                  ? "border-l-sky-500"
                  : "border-l-zinc-400"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold ${getEvidenceBadgeStyle(item.evidenceStatus)}`}
                    >
                      {item.evidenceStatus === "Repeated" && <RotateCcw className="h-3 w-3 mr-1" />}
                      {item.evidenceStatus === "Emerging" && <TrendingUp className="h-3 w-3 mr-1" />}
                      {item.evidenceStatus === "Observed" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {item.evidenceStatus === "Hypothesis" && <HelpCircle className="h-3 w-3 mr-1" />}
                      {item.evidenceStatus}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getCategoryBadgeStyle(item.category)}`}
                    >
                      {item.category.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {item.frequency} {item.frequency === 1 ? "discussion" : "discussions"}
                    </span>
                    <span>•</span>
                    <span>{item.confidence}% confidence</span>
                    <span>•</span>
                    <span suppressHydrationWarning className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(item.lastObservedAt)}
                    </span>
                  </div>
                </div>

                {/* Theme Title */}
                <div>
                  <h3 className="font-serif font-bold text-base text-foreground leading-snug">
                    {item.theme}
                  </h3>
                </div>

                {/* User Natural Vocabulary Callout */}
                {item.naturalLanguage.length > 0 && (
                  <div className="p-2.5 rounded-md bg-muted/30 border border-muted-foreground/15 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <MessageSquareQuote className="h-3.5 w-3.5" />
                      <span>Language Users Naturally Use:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {item.naturalLanguage.map((phrase, idx) => (
                        <span
                          key={idx}
                          className="bg-background px-2 py-0.5 rounded border text-[11px] font-mono text-foreground"
                        >
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Action */}
                <div className="p-2.5 rounded-md bg-primary/5 border border-primary/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Recommended Action for Qurtesy:</span>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {item.recommendedAction}
                  </p>
                </div>

                {/* Source Traceability Drawer */}
                <div className="pt-1 border-t text-xs">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="flex items-center justify-between w-full py-1 text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    <span>
                      Contributing Reddit Evidence ({item.sources.length}{" "}
                      {item.sources.length === 1 ? "discussion" : "discussions"})
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-muted">
                      {item.sources.map((src, idx) => {
                        const fullUrl = src.permalink.startsWith("http")
                          ? src.permalink
                          : `https://www.reddit.com${src.permalink}`

                        return (
                          <div key={idx} className="flex items-start gap-2 py-1">
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded shrink-0">
                              r/{src.subreddit}
                            </span>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline flex items-center gap-1 group text-xs truncate"
                            >
                              <span className="truncate">{src.title}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
