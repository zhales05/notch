import type { CategoryProgress as CategoryProgressData } from "@/hooks/use-today-habits"

interface CategoryProgressProps {
  data: CategoryProgressData[]
}

export function CategoryProgress({ data }: CategoryProgressProps) {
  if (data.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((cat) => {
        const pct = cat.total > 0 ? (cat.completed / cat.total) * 100 : 0

        return (
          <div key={cat.categoryId ?? "uncategorized"} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{cat.categoryTitle}</span>
              <span className="text-muted-foreground">
                {Math.round(pct)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: cat.categoryColor,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
