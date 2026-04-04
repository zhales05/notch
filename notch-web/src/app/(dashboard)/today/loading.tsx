import { Skeleton } from "@/components/ui/skeleton"

export default function TodayLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Summary ring + category progress */}
      <Skeleton className="h-28 w-full rounded-xl" />

      {/* Week chart */}
      <Skeleton className="h-48 w-full rounded-xl" />

      {/* Habit cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
