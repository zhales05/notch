import { Card, CardContent } from "@/components/ui/card"
import { CompletionRing } from "./completion-ring"
import { CategoryProgress } from "./category-progress"
import type { CategoryProgress as CategoryProgressData } from "@/hooks/use-today-habits"

interface TodaySummaryProps {
  completed: number
  total: number
  categoryProgress: CategoryProgressData[]
}

export function TodaySummary({
  completed,
  total,
  categoryProgress,
}: TodaySummaryProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-6 p-4">
        <CompletionRing completed={completed} total={total} />
        <div className="min-w-0 flex-1">
          <CategoryProgress data={categoryProgress} />
        </div>
      </CardContent>
    </Card>
  )
}
