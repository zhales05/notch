import { Skeleton } from "@/components/ui/skeleton"

export default function HabitsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
