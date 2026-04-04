import { cn } from "@/lib/utils"

interface GoalProgressBarProps {
  percentage: number
  currentValue?: number
  targetValue?: number
  unit?: string | null
  compact?: boolean
  className?: string
}

export function GoalProgressBar({
  percentage,
  currentValue,
  targetValue,
  unit,
  compact = false,
  className,
}: GoalProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          compact ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-300",
            clampedPercentage >= 100 && "bg-green-500"
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {!compact && (
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {currentValue !== undefined && targetValue !== undefined
              ? `${currentValue} / ${targetValue}${unit ? ` ${unit}` : ""}`
              : `${clampedPercentage}% complete`}
          </span>
          <span>{clampedPercentage}%</span>
        </div>
      )}
    </div>
  )
}
