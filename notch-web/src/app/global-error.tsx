"use client"

import { AlertCircle } from "lucide-react"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans text-foreground antialiased">
        <div className="flex flex-col items-center text-center px-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-red-100">
            <AlertCircle className="size-6 text-red-600" />
          </div>
          <h2 className="mt-4 text-lg font-medium">Something went wrong</h2>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            An unexpected error occurred. Please try again.
          </p>
          <button
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            onClick={reset}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
