interface CompletionRingProps {
  completed: number
  total: number
  size?: number
}

export function CompletionRing({
  completed,
  total,
  size = 96,
}: CompletionRingProps) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = total > 0 ? completed / total : 0
  const offset = circumference * (1 - percentage)
  const allDone = total > 0 && completed >= total

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={allDone ? "text-emerald-500" : "text-primary"}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">
          {completed}/{total}
        </span>
        <span className="text-[10px] text-muted-foreground">done</span>
      </div>
    </div>
  )
}
