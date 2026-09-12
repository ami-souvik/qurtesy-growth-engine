import Link from "next/link"
import { notFound } from "next/navigation"
import { getResumeReviewSession } from "@/actions/reddit-resume-actions"
import { ResumeReviewClient } from "./resume-review-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function ResumeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sessionData = await getResumeReviewSession(id)

  if (!sessionData) {
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

  return <ResumeReviewClient initialData={sessionData} />
}
