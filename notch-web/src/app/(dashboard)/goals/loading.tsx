import { Skeleton } from "@/components/ui/skeleton"

export default function GoalsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
      {/* Status filter pills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
