"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { analyzeRedditPosts } from "@/actions/reddit-intelligence-actions"

export function AnalyzeButton({ unprocessedCount }: { unprocessedCount: number }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await analyzeRedditPosts({ limit: 25 })
      setResult(`Analyzed ${res.analyzed} posts (${res.opportunitiesCreated} opportunities found)`)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to analyze posts.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Button
        onClick={handleAnalyze}
        disabled={loading || unprocessedCount === 0}
        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {loading ? "Analyzing Posts with AI..." : `Analyze Opportunities (${unprocessedCount} Unprocessed)`}
      </Button>

      {result && <span className="text-xs text-muted-foreground font-medium">{result}</span>}
    </div>
  )
}
