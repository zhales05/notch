import { Skeleton } from "@/components/ui/skeleton"

export default function CategoriesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
