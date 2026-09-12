import Link from "next/link"
import { notFound } from "next/navigation"
import { getOpportunityWithDraft, generateOrRegenerateCommentDraft } from "@/actions/reddit-comment-actions"
import { CommentWorkspaceClient } from "./comment-workspace-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function CommentDraftPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let oppData = await getOpportunityWithDraft(id)

  if (!oppData) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold">Opportunity Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested opportunity does not exist or has been removed.
        </p>
        <Link href="/reddit-scout">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Reddit Scout
          </Button>
        </Link>
      </div>
    )
  }

  // Pre-generate initial draft if not already created
  if (!oppData.draft) {
    try {
      const newDraft = await generateOrRegenerateCommentDraft(id)
      oppData.draft = newDraft
    } catch (err) {
      console.error("Failed auto-generating initial comment draft:", err)
    }
  }

  return <CommentWorkspaceClient initialData={oppData} />
}
