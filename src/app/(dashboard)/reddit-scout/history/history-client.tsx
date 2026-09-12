"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  PostedCommentRecord,
  PostingAnalyticsSummary,
} from "@/lib/reddit-learning-service"
import { PreservedVersionsModal } from "@/components/reddit/preserved-versions-modal"
import { UpdatePerformanceModal } from "@/components/reddit/update-performance-modal"
import {
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Flame,
  History,
  Layers,
  MessageSquare,
  Sparkles,
  TrendingUp,
  UserCheck,
  ShieldAlert,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react"

export interface HistoryClientProps {
  initialPosts: PostedCommentRecord[]
  initialAnalytics: PostingAnalyticsSummary
}

export function HistoryClient({
  initialPosts,
  initialAnalytics,
}: HistoryClientProps) {
  const [posts, setPosts] = useState<PostedCommentRecord[]>(initialPosts)
  const [analytics, setAnalytics] = useState<PostingAnalyticsSummary>(initialAnalytics)
  const [activeTab, setActiveTab] = useState<string>("posts")

  // Filters
  const [filterSub, setFilterSub] = useState<string>("ALL")
  const [filterStrategy, setFilterStrategy] = useState<string>("ALL")
  const [search, setSearch] = useState<string>("")

  // Modals state
  const [inspectingPost, setInspectingPost] = useState<PostedCommentRecord | null>(null)
  const [updatingPost, setUpdatingPost] = useState<PostedCommentRecord | null>(null)

  // Subreddit & Strategy lists
  const subreddits = Array.from(new Set(posts.map(p => p.subreddit.toLowerCase())))
  const strategies = Array.from(new Set(posts.map(p => p.strategy.toUpperCase())))

  const filteredPosts = posts.filter(p => {
    if (filterSub !== "ALL" && p.subreddit.toLowerCase() !== filterSub.toLowerCase()) return false
    if (filterStrategy !== "ALL" && p.strategy.toUpperCase() !== filterStrategy.toUpperCase()) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = p.postTitle.toLowerCase().includes(q)
      const matchSub = p.subreddit.toLowerCase().includes(q)
      const matchComment = p.finalPostedComment.toLowerCase().includes(q)
      const matchTopic = p.topic?.toLowerCase().includes(q)
      if (!matchTitle && !matchSub && !matchComment && !matchTopic) return false
    }
    return true
  })

  const handlePerformanceUpdated = () => {
    // In next action or page refresh, or trigger re-fetch
    window.location.reload()
  }

  const formatRelativeTime = (val: any) => {
    try {
      const d = new Date(val)
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return "Recently"
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Modals */}
      {inspectingPost && (
        <PreservedVersionsModal
          isOpen={!!inspectingPost}
          onClose={() => setInspectingPost(null)}
          post={inspectingPost}
        />
      )}

      {updatingPost && (
        <UpdatePerformanceModal
          isOpen={!!updatingPost}
          onClose={() => setUpdatingPost(null)}
          post={updatingPost}
          onSuccess={handlePerformanceUpdated}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reddit-scout"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
              Posting History & Performance
              <span className="text-xs font-mono font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Founder Lifecycle
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Track manually published comments, version calibrations, downstream conversions, and empirical learnings.
            </p>
          </div>
        </div>

        {/* Non-automation notice */}
        <div className="flex items-center gap-2 bg-muted/50 border px-3 py-1.5 rounded-md text-xs text-muted-foreground font-mono">
          <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Manual tracking only • No auto-posting or scraping</span>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-blue-500" /> Total Posts
            </span>
            <p className="text-2xl font-serif font-bold text-foreground">
              {analytics.funnel.totalPosts}
            </p>
            <p className="text-[11px] text-muted-foreground">Across {analytics.bySubreddit.length} subreddits</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> Total Replies
            </span>
            <p className="text-2xl font-serif font-bold text-foreground">
              {analytics.funnel.totalReplies}
            </p>
            <p className="text-[11px] text-muted-foreground">Avg {analytics.funnel.avgReplies} replies / post</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-amber-500" /> Total Upvotes
            </span>
            <p className="text-2xl font-serif font-bold text-foreground">
              {analytics.funnel.totalUpvotes}
            </p>
            <p className="text-[11px] text-muted-foreground">Avg {analytics.funnel.avgUpvotes} upvotes / post</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Product Actions
            </span>
            <p className="text-2xl font-serif font-bold text-foreground">
              {analytics.funnel.totalConversions}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {analytics.funnel.totalBuilderStarts} builder • {analytics.funnel.totalTailoringStarts} tailoring starts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md text-xs font-semibold">
          <TabsTrigger value="posts" className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            <span>Posts ({posts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Analytics & Funnel</span>
          </TabsTrigger>
          <TabsTrigger value="learnings" className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>Empirical Learnings ({analytics.learnings.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ALL POSTED COMMENTS */}
        <TabsContent value="posts" className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filter:
              </span>

              {/* Subreddit Filter */}
              <select
                value={filterSub}
                onChange={e => setFilterSub(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-md border bg-background font-medium focus:outline-none"
              >
                <option value="ALL">All Subreddits</option>
                {subreddits.map(sub => (
                  <option key={sub} value={sub}>r/{sub}</option>
                ))}
              </select>

              {/* Strategy Filter */}
              <select
                value={filterStrategy}
                onChange={e => setFilterStrategy(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-md border bg-background font-medium focus:outline-none"
              >
                <option value="ALL">All Strategies</option>
                {strategies.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search posts or comments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-1 text-xs rounded-md border bg-background w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="border rounded-xl p-12 text-center text-muted-foreground space-y-2 bg-muted/10">
              <History className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="font-semibold text-sm text-foreground">No posted comments found</p>
              <p className="text-xs">
                When you manually post a response to Reddit, click "Mark as Posted" in the Comment Assistant or Resume Review workspace.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <Card key={post.id} className="shadow-xs hover:shadow-md transition-all">
                  <CardContent className="p-4 space-y-3">
                    {/* Top Row: Subreddit, Strategy, Date, Links */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-muted">
                          r/{post.subreddit}
                        </span>

                        <Badge variant="outline" className="text-[10px] font-mono">
                          {post.strategy}
                        </Badge>

                        {post.responseStyle && (
                          <span className="text-[11px] text-muted-foreground">
                            • {post.responseStyle.replace(/_/g, " ")}
                          </span>
                        )}

                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeTime(post.postedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={post.postedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Live Reddit Comment</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Original Thread Title */}
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Thread Title:</span>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {post.postTitle}
                      </p>
                    </div>

                    {/* Final Posted Excerpt */}
                    <div className="p-3 rounded-md bg-muted/30 border space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Final Published Comment:
                      </span>
                      <p className="text-xs font-mono text-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
                        {post.finalPostedComment}
                      </p>
                    </div>

                    {/* Performance Metrics Badges & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
                      {/* Metric Badges */}
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-muted/60" title="Upvotes">
                          ▲ <b>{post.upvotes}</b> upvotes
                        </span>
                        <span className="px-2 py-0.5 rounded bg-muted/60" title="Replies">
                          💬 <b>{post.replies}</b> replies
                        </span>
                        {post.profileVisits > 0 && (
                          <span className="px-2 py-0.5 rounded bg-muted/60" title="Profile Visits">
                            👤 <b>{post.profileVisits}</b> visits
                          </span>
                        )}
                        {(post.builderStarts > 0 || post.tailoringStarts > 0) && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">
                            🚀 {post.builderStarts + post.tailoringStarts} starts ({post.builderStarts} builder, {post.tailoringStarts} tailoring)
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectingPost(post)}
                          className="h-7 text-xs px-2.5"
                        >
                          <Layers className="h-3 w-3 mr-1" /> Compare Versions
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => setUpdatingPost(post)}
                          className="h-7 text-xs px-2.5 bg-primary text-primary-foreground font-semibold"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" /> Update Performance
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ANALYTICS & CONVERSION FUNNEL */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Conversion Funnel Grid */}
          <Card className="shadow-xs border-primary/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Primary Growth Conversion Funnel
                </span>
                <Badge variant="outline" className="text-xs font-mono">
                  Conversion Rate: {analytics.funnel.conversionRatePercent}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                  <span className="text-[11px] text-muted-foreground">Profile Visits</span>
                  <p className="text-xl font-bold font-mono">{analytics.funnel.totalProfileVisits}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                  <span className="text-[11px] text-muted-foreground">Qurtesy Clicks</span>
                  <p className="text-xl font-bold font-mono">{analytics.funnel.totalQurtesyClicks}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                  <span className="text-[11px] text-muted-foreground">Site Sessions</span>
                  <p className="text-xl font-bold font-mono">{analytics.funnel.totalQurtesySessions}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Builder Starts</span>
                  <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {analytics.funnel.totalBuilderStarts}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Tailoring Starts</span>
                  <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {analytics.funnel.totalTailoringStarts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Strategy Table */}
            <Card className="shadow-xs">
              <CardContent className="p-4 space-y-3">
                <span className="font-bold text-xs text-foreground block border-b pb-2">
                  Performance by Strategy
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground text-left text-[11px]">
                        <th className="pb-1.5 font-semibold">Strategy</th>
                        <th className="pb-1.5 font-semibold text-center">Posts</th>
                        <th className="pb-1.5 font-semibold text-center">Avg Rep</th>
                        <th className="pb-1.5 font-semibold text-center">Avg Up</th>
                        <th className="pb-1.5 font-semibold text-right">Actions/Post</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {analytics.byStrategy.map(s => (
                        <tr key={s.strategy} className="hover:bg-muted/20">
                          <td className="py-2 font-sans font-medium">{s.strategy}</td>
                          <td className="py-2 text-center">{s.postCount}</td>
                          <td className="py-2 text-center">{s.avgReplies}</td>
                          <td className="py-2 text-center">{s.avgUpvotes}</td>
                          <td className="py-2 text-right font-bold text-emerald-600">
                            {s.actionRatePerPost}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* By Subreddit Table */}
            <Card className="shadow-xs">
              <CardContent className="p-4 space-y-3">
                <span className="font-bold text-xs text-foreground block border-b pb-2">
                  Performance by Subreddit
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground text-left text-[11px]">
                        <th className="pb-1.5 font-semibold">Subreddit</th>
                        <th className="pb-1.5 font-semibold text-center">Posts</th>
                        <th className="pb-1.5 font-semibold text-center">Avg Rep</th>
                        <th className="pb-1.5 font-semibold text-center">Avg Up</th>
                        <th className="pb-1.5 font-semibold text-right">Starts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono">
                      {analytics.bySubreddit.map(sub => (
                        <tr key={sub.subreddit} className="hover:bg-muted/20">
                          <td className="py-2 font-sans font-medium">r/{sub.subreddit}</td>
                          <td className="py-2 text-center">{sub.postCount}</td>
                          <td className="py-2 text-center">{sub.avgReplies}</td>
                          <td className="py-2 text-center">{sub.avgUpvotes}</td>
                          <td className="py-2 text-right font-bold text-emerald-600">
                            {sub.builderStarts + sub.tailoringStarts}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: EMPIRICAL LEARNING PATTERNS */}
        <TabsContent value="learnings" className="space-y-4">
          {/* Sample Size Policy Banner */}
          <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Sample-Size & Confidence Guardrails</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Learnings are strictly derived from your recorded performance without speculative claims. Patterns require minimum 3 posts for an <b>Emerging Pattern</b> and 5 posts for a <b>Statistically Reliable</b> conclusion.
            </p>
          </div>

          {/* Learning Cards */}
          {analytics.learnings.length === 0 ? (
            <div className="border rounded-xl p-12 text-center text-muted-foreground space-y-2 bg-muted/10">
              <Lightbulb className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="font-semibold text-sm text-foreground">No Learnings Available Yet</p>
              <p className="text-xs">
                Record at least 3 manually posted comments to trigger the empirical pattern analysis engine.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.learnings.map(learn => (
                <Card key={learn.id} className="shadow-xs hover:shadow-md transition-all border-l-4 border-l-primary">
                  <CardContent className="p-4 space-y-3">
                    {/* Header: Strength Badge, Sample Size, Confidence */}
                    <div className="flex items-center justify-between gap-2 border-b pb-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-semibold ${
                          learn.evidenceStrength === "STATISTICALLY_RELIABLE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                            : learn.evidenceStrength === "EMERGING_PATTERN"
                            ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40"
                            : "bg-zinc-100 text-zinc-700 border-zinc-300"
                        }`}
                      >
                        {learn.evidenceStrength.replace(/_/g, " ")}
                      </Badge>

                      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                        <span>n={learn.sampleSize}</span>
                        <span>•</span>
                        <span className="font-bold text-foreground">{learn.confidence}% Confidence</span>
                      </div>
                    </div>

                    {/* Pattern Statement */}
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        "{learn.pattern}"
                      </p>
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        Observed: {learn.observationPeriod}
                      </span>
                    </div>

                    {/* Data Summary */}
                    <div className="p-2.5 rounded bg-muted/30 border text-xs text-muted-foreground space-y-1">
                      <span className="font-bold text-foreground block text-[11px]">Supporting Evidence:</span>
                      <p>{learn.dataSummary}</p>
                    </div>

                    {/* Recommended Action */}
                    <div className="pt-2 border-t text-xs">
                      <span className="font-bold text-primary block text-[11px] mb-0.5">
                        Recommended Founder Action:
                      </span>
                      <p className="text-muted-foreground">{learn.recommendedAction}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
