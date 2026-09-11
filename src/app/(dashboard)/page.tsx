import { getLatestDataSourceSnapshot, getLatestIntelligence } from "@/actions/data-source-actions"
import { getRedditConfig, getRedditCommunities } from "@/actions/reddit-actions"
import { DataSourcesForm } from "./data-sources-form"
import Markdown from "react-markdown"

export default async function DashboardPage() {
  const snapshot = await getLatestDataSourceSnapshot()
  const intelligence = await getLatestIntelligence()
  const redditConfig = await getRedditConfig()
  const redditCommunities = await getRedditCommunities()

  return (
    <div className="flex flex-col md:flex-row min-h-full">
      {/* Left Panel: Data Sources */}
      <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r p-4">
        <div className="flex-1">
          <DataSourcesForm 
            initialData={snapshot} 
            redditConfig={redditConfig}
            redditCommunities={redditCommunities}
          />
        </div>
      </div>

      {/* Right Panel: Growth Intelligence */}
      <div className="w-full md:w-1/2 flex flex-col p-4">
        <h2 className="text-xl font-serif font-bold tracking-tight mb-4">Growth Intelligence</h2>
        <div className="flex-1 max-w-none">
          {intelligence ? (
            <Markdown>{intelligence.content}</Markdown>
          ) : (
            <div className="text-muted-foreground italic text-center py-20 flex flex-col items-center gap-4">
              <span className="text-4xl">🧠</span>
              <p>No intelligence generated yet.</p>
              <p>Fill out your data sources and click "Generate Intelligence".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
