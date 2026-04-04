import { cn } from "@/lib/utils"
import type { GoalStatus } from "@/lib/types/goals"

const STATUS_CONFIG: Record<
  GoalStatus,
  { label: string; dotClass: string; bgClass: string }
> = {
  active: {
    label: "Active",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    dotClass: "bg-green-500",
    bgClass: "bg-green-500/10 text-green-700 dark:text-green-400",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-yellow-500",
    bgClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
  abandoned: {
    label: "Abandoned",
    dotClass: "bg-gray-400",
    bgClass: "bg-gray-400/10 text-gray-600 dark:text-gray-400",
  },
}

interface GoalStatusBadgeProps {
  status: GoalStatus
  className?: string
}

export function GoalStatusBadge({ status, className }: GoalStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        config.bgClass,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  )
}
