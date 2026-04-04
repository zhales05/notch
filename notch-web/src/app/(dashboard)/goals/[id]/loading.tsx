import { Skeleton } from "@/components/ui/skeleton"

export default function GoalDetailLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-40 w-full rounded-xl" />
      <Skeleton className="mt-4 h-32 w-full rounded-xl" />
    </div>
  )
}
