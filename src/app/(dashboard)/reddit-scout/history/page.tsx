import { getPostingHistory, getPostingAnalyticsAndLearnings } from "@/actions/reddit-post-history-actions"
import { HistoryClient } from "./history-client"

export default async function RedditPostingHistoryPage() {
  const [posts, analytics] = await Promise.all([
    getPostingHistory(),
    getPostingAnalyticsAndLearnings(),
  ])

  return (
    <HistoryClient
      initialPosts={posts}
      initialAnalytics={analytics}
    />
  )
}
