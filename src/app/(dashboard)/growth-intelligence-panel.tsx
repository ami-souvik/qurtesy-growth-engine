"use client"

import { useState } from "react"
import Markdown from "react-markdown"
import { ParsedRedditGrowthInsight } from "@/actions/data-source-actions"
import { RedditGrowthInsightsList } from "./reddit-growth-insights-list"
import { Sparkles, Rss, FileText } from "lucide-react"

export function GrowthIntelligencePanel({
  content,
  redditInsights,
}: {
  content: string | null
  redditInsights: ParsedRedditGrowthInsight[]
}) {
  const [activeTab, setActiveTab] = useState<"reddit" | "synthesis">(
    redditInsights.length > 0 ? "reddit" : "synthesis"
  )

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <h2 className="text-xl font-serif font-bold tracking-tight">Growth Intelligence</h2>
          <p className="text-xs text-muted-foreground">
            Synthesized insights across Reddit, SEO, Product Updates, and Job Trends.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("reddit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === "reddit"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rss className="h-3.5 w-3.5 text-orange-500" />
            <span>Reddit Insights</span>
            {redditInsights.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold">
                {redditInsights.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("synthesis")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === "synthesis"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            <span>Cross-Source Synthesis</span>
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === "reddit" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Derived from classified Reddit discussions • Sample-size calibrated
              </span>
            </div>
            <RedditGrowthInsightsList insights={redditInsights} />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content ? (
              <Markdown>{content}</Markdown>
            ) : (
              <div className="text-muted-foreground italic text-center py-20 flex flex-col items-center gap-4">
                <span className="text-4xl">🧠</span>
                <p>No intelligence generated yet.</p>
                <p className="text-xs">Fill out your data sources and click "Generate Intelligence".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
