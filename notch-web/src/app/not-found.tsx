import Link from "next/link"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center text-center px-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <FileQuestion className="size-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-medium">Page not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/today"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Today
        </Link>
      </div>
    </div>
  )
}
