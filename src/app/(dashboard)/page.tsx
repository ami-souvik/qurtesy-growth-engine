import { getLatestDataSourceSnapshot, getLatestIntelligence, getLatestRedditGrowthInsights } from "@/actions/data-source-actions"
import { getRedditConfig, getRedditCommunities } from "@/actions/reddit-actions"
import { DataSourcesForm } from "./data-sources-form"
import { GrowthIntelligencePanel } from "./growth-intelligence-panel"

export default async function DashboardPage() {
  const [snapshot, intelligence, redditConfig, redditCommunities, redditInsights] = await Promise.all([
    getLatestDataSourceSnapshot(),
    getLatestIntelligence(),
    getRedditConfig(),
    getRedditCommunities(),
    getLatestRedditGrowthInsights(),
  ])

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
        <GrowthIntelligencePanel
          content={intelligence?.content || null}
          redditInsights={redditInsights}
        />
      </div>
    </div>
  )
}

