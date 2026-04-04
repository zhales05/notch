import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RadialProgress } from "./radial-progress"
import type { CategoryStat } from "@/lib/types/analytics"

interface CategoryStatsListProps {
  stats: CategoryStat[]
  isLoading: boolean
}

export function CategoryStatsList({ stats, isLoading }: CategoryStatsListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No categories with habits yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {stats.map((stat) => (
        <Card key={stat.categoryId}>
          <CardContent className="p-4">
            {/* Category header with radial ring */}
            <div className="flex items-center gap-4">
              <RadialProgress
                value={stat.completionRate}
                color={stat.categoryColor}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{stat.categoryTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.habitCount} habit{stat.habitCount !== 1 ? "s" : ""}{" "}
                  &middot; {stat.totalLogs} logs
                </p>
              </div>
            </div>

            {/* Per-habit breakdown */}
            {stat.habits.length > 0 && (
              <div className="mt-4 grid gap-2.5">
                {stat.habits.map((habit) => (
                  <div key={habit.habitId} className="flex items-center gap-2.5">
                    <div
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: habit.habitColor }}
                    />
                    <p className="min-w-0 flex-1 truncate text-xs">
                      {habit.habitTitle}
                    </p>
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/30">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(habit.completionRate, 100)}%`,
                          backgroundColor: habit.habitColor,
                        }}
                      />
                    </div>
                    <p className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                      {habit.completionRate}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
