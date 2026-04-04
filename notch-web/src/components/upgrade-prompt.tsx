"use client"

import { Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface UpgradePromptProps {
  title?: string
  description?: string
}

export function UpgradePrompt({
  title = "You\u2019ve reached the free plan limit.",
  description = "Upgrade to Premium for unlimited access.",
}: UpgradePromptProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardContent className="flex items-center gap-3 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {title}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {description}
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Upgrade
        </Link>
      </CardContent>
    </Card>
  )
}
