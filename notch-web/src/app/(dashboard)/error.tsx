"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <h2 className="mt-4 font-medium">Something went wrong</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Please try again or refresh the page.
      </p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
