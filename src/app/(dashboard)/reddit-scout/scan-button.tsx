"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { scanReddit } from "@/actions/reddit-ingestion-actions"
import { Loader2, RefreshCcw } from "lucide-react"

export function ScanButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleScan = () => {
    setError(null)
    startTransition(async () => {
      try {
        await scanReddit()
      } catch (e: any) {
        setError(e.message || "An error occurred during scan.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={handleScan} 
        disabled={isPending}
        className="w-fit"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scanning Reddit...
          </>
        ) : (
          <>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Scan Reddit Now
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
