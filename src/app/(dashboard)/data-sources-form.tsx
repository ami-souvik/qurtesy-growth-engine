"use client"

import { useState } from "react"
import { saveDataSources, generateIntelligence } from "@/actions/data-source-actions"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

import { SeoDataInput } from "./seo-data-input"

export function DataSourcesForm({ initialData }: { initialData: any }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateIntelligence()
    } catch (e) {
      console.error(e)
      alert("Failed to generate intelligence.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form action={saveDataSources} className="flex flex-col h-full space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b">
        <h1 className="text-xl font-serif font-bold tracking-tight">Data Sources</h1>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <Button type="submit">Save Sources</Button>
          <Button type="button" variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? "Generating..." : "Generate Intelligence"}
          </Button>
        </div>
      </div>

      <div className="space-y-8 flex-1 pb-12">
        <div className="space-y-2">
          <div>
            <Label htmlFor="productUpdates" className="font-semibold text-lg text-primary">Product Updates</Label>
            <p className="text-sm text-muted-foreground">Sync from Qurtesy GitHub/changelog.</p>
          </div>
          <Textarea id="productUpdates" name="productUpdates" defaultValue={initialData?.productUpdates || ""} rows={4} className="font-mono text-sm" placeholder="Added tailored cover-letter generation..." />
        </div>

        <div className="space-y-4">
          <div>
            <Label className="font-semibold text-lg text-primary">SEO Data (CSV Upload)</Label>
            <p className="text-sm text-muted-foreground">Upload CSV exports from Google Search Console for pages, queries, and search appearance.</p>
          </div>
          <SeoDataInput initialData={initialData?.seoData} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experiments" className="font-semibold text-lg text-primary">Experiments</Label>
          <p className="text-sm text-muted-foreground">Manually record experiments you have actually run.</p>
          <Textarea id="experiments" name="experiments" defaultValue={initialData?.experiments || ""} rows={4} className="font-mono text-sm" placeholder="Tested contrarian ATS hooks on X..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="userPainPoints" className="font-semibold text-lg text-primary">User Pain Points ⭐</Label>
          <p className="text-sm text-muted-foreground">What are job seekers actually complaining about? (Reddit, reviews, Quora, etc.)</p>
          <Textarea id="userPainPoints" name="userPainPoints" defaultValue={initialData?.userPainPoints || ""} rows={6} className="font-mono text-sm" placeholder="Users complaining that ATS parsers scramble their PDF tables..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTrends" className="font-semibold text-lg text-primary">Job Trends</Label>
          <p className="text-sm text-muted-foreground">Changes in the job market, skills, roles, remote work trends.</p>
          <Textarea id="jobTrends" name="jobTrends" defaultValue={initialData?.jobTrends || ""} rows={4} className="font-mono text-sm" placeholder="Python + AI/LLM experience appearing frequently in backend JDs..." />
        </div>
      </div>
    </form>
  )
}
