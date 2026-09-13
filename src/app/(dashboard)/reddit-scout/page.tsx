import { getRecentScans } from "@/actions/reddit-ingestion-actions"
import { getRedditConfig, getRedditCommunities } from "@/actions/reddit-actions"
import { getRedditOpportunities, getOpportunityMetrics } from "@/actions/reddit-intelligence-actions"
import { ScanButton } from "./scan-button"
import { AnalyzeButton } from "./analyze-button"
import { OpportunityList, OpportunityItem } from "./opportunity-list"
import { ManualPostDrafter } from "./manual-post-drafter"
import { CommentReplyDrafter } from "./comment-reply-drafter"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sparkles, Flame, Target, Database, Rss, History, FileText, MessageSquareReply } from "lucide-react"

export default async function RedditScoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const initialTab =
    resolvedParams.tab === "manual-post" || resolvedParams.tab === "comment-reply"
      ? resolvedParams.tab
      : "opportunities"

  const [config, communities, recentScans, rawOpportunities, metrics] = await Promise.all([
    getRedditConfig(),
    getRedditCommunities(),
    getRecentScans(5),
    getRedditOpportunities({ priority: "ALL" }, "score"),
    getOpportunityMetrics(),
  ])

  // Process counts
  let highPriorityCount = 0
  let totalActiveOpportunities = 0

  for (const item of metrics.breakdown) {
    if (item.type !== "IGNORE") {
      totalActiveOpportunities += Number(item.count)
      if (item.priority === "HIGH") {
        highPriorityCount += Number(item.count)
      }
    }
  }

  // Cast opportunities for client component
  const opportunities = rawOpportunities as unknown as OpportunityItem[]

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight flex items-center gap-2">
            Reddit Scout
            <span className="text-xs font-mono font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Intelligence & Scoring
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover, draft, and score high-intent Reddit outreach and discussions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/reddit-scout/history">
            <Button variant="outline" className="text-xs font-semibold">
              <History className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Posting History & Performance
            </Button>
          </Link>
          <ScanButton />
          <AnalyzeButton unprocessedCount={metrics.unprocessedPosts} />
        </div>
      </div>

      {/* Main Tabbed Workspace */}
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-xl text-xs font-semibold p-1">
          <TabsTrigger value="opportunities" className="flex items-center gap-1.5 py-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span>Opportunities ({totalActiveOpportunities})</span>
          </TabsTrigger>
          <TabsTrigger value="manual-post" className="flex items-center gap-1.5 py-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            <span>Post Comment Drafter</span>
          </TabsTrigger>
          <TabsTrigger value="comment-reply" className="flex items-center gap-1.5 py-1.5">
            <MessageSquareReply className="h-3.5 w-3.5 text-emerald-500" />
            <span>Comment Reply Drafter</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AUTOMATED OPPORTUNITY QUEUE */}
        <TabsContent value="opportunities" className="space-y-8">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {highPriorityCount}
                  </p>
                </div>
                <Flame className="h-7 w-7 text-emerald-500/30" />
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Opportunities</p>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {totalActiveOpportunities}
                  </p>
                </div>
                <Target className="h-7 w-7 text-primary/30" />
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pending Analysis</p>
                  <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    {metrics.unprocessedPosts}
                  </p>
                </div>
                <Sparkles className="h-7 w-7 text-amber-500/30" />
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Monitored Subreddits</p>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {communities.length}
                  </p>
                </div>
                <Rss className="h-7 w-7 text-blue-500/30" />
              </CardContent>
            </Card>
          </div>

          {/* Main Opportunity Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Ranked Opportunities</h2>
              <span className="text-xs text-muted-foreground font-mono">
                Source: RSS feeds • Scoring model v1.0
              </span>
            </div>

            <OpportunityList initialOpportunities={opportunities} />
          </div>

          {/* Feed Configuration & Ingestion Health (Collapsible / Secondary) */}
          <details className="border rounded-lg p-4 bg-muted/10 group">
            <summary className="font-semibold text-sm cursor-pointer select-none flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                RSS Ingestion Settings & Health
              </span>
              <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>

            <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Feed Status</h3>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Scanner Status:</span>
                    <span className={config.enabled ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                      {config.enabled ? "Enabled (RSS)" : "Disabled"}
                    </span>
                  </div>
                  <div className="py-1 border-b">
                    <span className="text-muted-foreground block mb-1">Subreddits Monitored:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {communities.map(c => (
                        <span key={c.id} className="bg-background px-2 py-0.5 rounded text-xs font-mono border">
                          r/{c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Recent RSS Ingestion Runs</h3>
                <div className="border rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Discovered</TableHead>
                        <TableHead>New</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {recentScans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No scans recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentScans.map(scan => (
                          <TableRow key={scan.id}>
                            <TableCell suppressHydrationWarning>
                              {new Date(scan.startedAt).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                  scan.status === "SUCCESS"
                                    ? "bg-green-100 text-green-700"
                                    : scan.status === "FAILED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {scan.status}
                              </span>
                            </TableCell>
                            <TableCell>{scan.postsDiscovered}</TableCell>
                            <TableCell className="font-semibold">{scan.newPosts}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </details>
        </TabsContent>

        {/* TAB 2: MANUAL POST COMMENT DRAFTER */}
        <TabsContent value="manual-post" className="space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-semibold tracking-tight">Manual Post Comment Drafter</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste any Reddit post link to auto-fetch details and attached screenshots, or enter them manually to generate an authentic founder comment.
            </p>
          </div>
          <ManualPostDrafter />
        </TabsContent>

        {/* TAB 3: COMMENT REPLY DRAFTER */}
        <TabsContent value="comment-reply" className="space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-semibold tracking-tight">Comment Reply Drafter</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide the thread context and a specific commenter&apos;s statement to draft a tailored, value-first reply.
            </p>
          </div>
          <CommentReplyDrafter />
        </TabsContent>
      </Tabs>
    </div>
  )
}
