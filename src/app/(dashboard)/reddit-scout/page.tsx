import { getRecentScans, getRecentDiscoveredPosts } from "@/actions/reddit-ingestion-actions"
import { getRedditConfig, getRedditCommunities } from "@/actions/reddit-actions"
import { ScanButton } from "./scan-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function RedditScoutPage() {
  const config = await getRedditConfig()
  const communities = await getRedditCommunities()
  const recentScans = await getRecentScans(5)
  const recentPosts = await getRecentDiscoveredPosts(20)

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2 border-b pb-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Reddit Scout</h1>
        <p className="text-muted-foreground">Monitor and discover relevant conversations on Reddit.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Configuration</h2>
          <div className="border rounded-md p-4 bg-muted/20 space-y-4">
            <div>
              <span className="font-semibold block mb-1">Status:</span>
              <span className={config.enabled ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                {config.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="font-semibold block mb-1">Monitored Subreddits:</span>
              {communities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {communities.map(c => (
                    <span key={c.id} className="bg-background px-2 py-1 rounded text-sm font-mono border">r/{c.name}</span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm italic">No subreddits configured.</span>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <ScanButton />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Scans</h2>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Found</TableHead>
                  <TableHead>New</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentScans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No scans recorded.</TableCell>
                  </TableRow>
                ) : (
                  recentScans.map(scan => (
                    <TableRow key={scan.id}>
                      <TableCell className="text-xs" suppressHydrationWarning>
                        {new Date(scan.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${scan.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : scan.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {scan.status}
                        </span>
                      </TableCell>
                      <TableCell>{scan.postsDiscovered}</TableCell>
                      <TableCell className="font-medium">{scan.newPosts}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recently Discovered Posts</h2>
        <div className="border rounded-md divide-y">
          {recentPosts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground italic">
              No posts discovered yet. Try running a scan.
            </div>
          ) : (
            recentPosts.map(post => (
              <div key={post.id} className="p-4 hover:bg-muted/10 transition-colors">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div>
                    <span className="text-xs font-mono text-muted-foreground mb-1 block">r/{post.subreddit} • u/{post.author}</span>
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      {post.title}
                    </a>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${post.ingestionStatus === 'UNPROCESSED' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                    {post.ingestionStatus}
                  </span>
                </div>
                {post.body && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{post.body}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
